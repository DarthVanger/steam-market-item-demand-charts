const dbClient = require('./dbClient');
const fetch = require('node-fetch');

async function sendTelegram(message) {
  await fetch(`https://api.telegram.org/bot1271355712:AAGUXY7qE0VjqzmGBUgtVY07vrXqncztpw0/sendMessage?chat_id=@steamMarketAnalyzer&text=${encodeURIComponent(message)}`);
}

async function analyze() {
  const itemStatsCollectionName =  'v1_crawledItemsStats';
  const trackedItemsCollectionName =  'v2_trackedItems';

  const client = dbClient.create();

  try {
    const db = await dbClient.connect();

    const trackedItemsCursor = await db.collection(trackedItemsCollectionName).find({});
    const trackedItems = await trackedItemsCursor.toArray();
    console.log('trackedItems', trackedItems);

    const analytics = [];
    for (const trackedItem of trackedItems) {
      await analyzeItemData(trackedItem);
    }

    console.log('analytics: ', analytics);

    const report = analytics.reduce((acc, curr) => {
      const percentRounded = isNaN(curr.sellOrderQuantityHourChangePercent) ?
       'unavailable' : (Math.round(curr.sellOrderQuantityHourChangePercent * 10000) / 10000).toFixed(4);
      return acc += `${percentRounded}% -  ${curr.itemName}\n`;
    }, 'Hourly sell order quantity change:\n');

    console.log('report: ', report);

    await sendTelegram(report);

    async function analyzeItemData(trackedItem) {
      const { itemUrl } = trackedItem;
      console.log(`Analyzing data for itemUrl "${itemUrl}"`);
      const itemStatsCollection = await db.collection(itemStatsCollectionName);
      const itemStatsCursor = await itemStatsCollection.find({ itemUrl: decodeURIComponent(itemUrl) });
      const itemStats = await itemStatsCursor.toArray();
      console.log('itemStats: ', itemStats);
       // '2020-09-02T20:00:22.087Z'
      const latestEntry = itemStats[itemStats.length - 1];
      const date = new Date(latestEntry.fetchedAt);
      console.log('date: ', date);
      const previousHourDate = new Date(date.getTime());
      previousHourDate.setHours(date.getHours() - 1);
      const previous12HoursDate = new Date(date.getTime());
      previous12HoursDate.setHours(date.getHours() - 12);
      console.log('previousHourDate: ', previousHourDate);
      const previousHourEntry = await itemStatsCollection.findOne({
        itemUrl: decodeURIComponent(itemUrl),
        fetchedAt: {
          $gte: new Date(previousHourDate.setMinutes(previousHourDate.getMinutes() - 5)).toISOString(),
          $lt: new Date(previousHourDate.setMinutes(previousHourDate.getMinutes() + 5)).toISOString(),
        },
      });
      console.log('previousHourEntry: ', previousHourEntry);
      const itemName = decodeURI(latestEntry.itemUrl.replace(/.+[/]/, ''));
      if (previousHourEntry) {
        const getSellOrderQuantity = entry => entry.itemData.histogram.sell_order_summary[0];
        const sellOrderQuantityHourChangePercent = ((getSellOrderQuantity(latestEntry) - getSellOrderQuantity(previousHourEntry)) / getSellOrderQuantity(latestEntry));
        console.log('itemName: ', itemName);
        console.log('sellOrderQuantityHourChangePercent: ', sellOrderQuantityHourChangePercent);
      } else {
        sellOrderQuantityHourChangePercent = NaN;
      }
      analytics.push({ itemName, sellOrderQuantityHourChangePercent });
    }
  } catch (e) {
    console.dir(e);
    throw e;
  } finally {
    console.log('Closing mongo connection');
    await client.close();
  }
}

module.exports = analyze;
