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

    const roundPercents = (percents) => (Math.round(percents * 100) / 100).toFixed(2);

    const report = analytics.reduce((acc, curr) => {
      const percentRounded = curr.hasEnoughData ?
        `${curr.sellOrderQuantityChangePercent > 0 ? '+' : ''}${roundPercents(curr.sellOrderQuantityChangePercent)}%` : 'not enough data yet';
      return acc += `${percentRounded} -  ${curr.itemName} ${curr.itemUrl}\n`;
    }, '24 hours sell order quantity change:\n');

    console.log('report: ', report);

    await sendTelegram(report);

    async function analyzeItemData(trackedItem) {
      const { itemUrl } = trackedItem;
      console.log(`Analyzing data for itemUrl "${itemUrl}"`);

      const getSellOrderQuantity = entry => entry.itemData.histogram.sell_order_summary[0];

      const itemStatsCollection = await db.collection(itemStatsCollectionName);

      const now = new Date();
      date24HoursBack = new Date(now.setHours(now.getHours() - 24)); 

      const last24HoursStats = await itemStatsCollection.find({
        itemUrl: decodeURIComponent(itemUrl),
        fetchedAt: {
          $gte: date24HoursBack.toISOString(),
        },
      }).toArray();

      const latestEntry = last24HoursStats[last24HoursStats.length - 1];
      const itemName = decodeURI(latestEntry.itemUrl.replace(/.+[/]/, ''));
      console.log('itemName: ', itemName);

      console.log('last24HoursStats length: ', last24HoursStats.length);
      let sellOrderQuantityChangePercent;
      const hasEnoughData = last24HoursStats.length > 22;
      const itemAnalytics = { itemName, itemUrl: decodeURIComponent(itemUrl), hasEnoughData }
      if (hasEnoughData) {
        const avgSellOrderQuantity24Hours = last24HoursStats.reduce((acc, curr) => {
          return acc += getSellOrderQuantity(curr) / last24HoursStats.length;
        }, 0);
        const currentSellOrderQuantity = getSellOrderQuantity(latestEntry);
        console.log('currentSellOrderQuantity: ', currentSellOrderQuantity);
        console.log('avgSellOrderQuantity24Hours: ', avgSellOrderQuantity24Hours);
        itemAnalytics.sellOrderQuantityChangePercent = 100 * (currentSellOrderQuantity - avgSellOrderQuantity24Hours) / avgSellOrderQuantity24Hours;
        console.log('sellOrderQuantityChangePercent: ', sellOrderQuantityChangePercent);
      }

      analytics.push(itemAnalytics);
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
