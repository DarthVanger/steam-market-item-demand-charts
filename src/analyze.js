const dbClient = require('./dbClient');
const fetch = require('node-fetch');

async function sendTelegram(message) {
  //console.log('telegram message: ', message);
  await fetch(`https://api.telegram.org/bot1271355712:AAGUXY7qE0VjqzmGBUgtVY07vrXqncztpw0/sendMessage?chat_id=@steamMarketAnalyzer&text=${encodeURIComponent(message)}`);
}

async function analyze() {
  const itemStatsCollectionName =  'v1_crawledItemsStats';
  const trackedItemsCollectionName =  'v2_trackedItems';

  const client = dbClient.create();

  try {
    const db = await dbClient.connect();

    const roundPercents = (percents) => (Math.round(percents * 100) / 100).toFixed(2);
    const formatPercents = (percents) => `${percents > 0 ? '+' : ''}${roundPercents(percents)}%`;
    const getSellOrderQuantity = entry => entry.itemData.histogram.sell_order_summary[0];

    const itemStatsCollection = await db.collection(itemStatsCollectionName);

    const getLast24HoursStats = async (trackedItem) => {
      const now = new Date();
      date24HoursBack = new Date(now.setHours(now.getHours() - 24)); 
      return await itemStatsCollection.find({
        itemUrl: decodeURIComponent(trackedItem.itemUrl),
        fetchedAt: {
          $gte: date24HoursBack.toISOString(),
        },
      }).toArray();
    }

    const getItemName = (entry) => decodeURI(entry.itemUrl.replace(/.+[/]/, ''));
    const getItemUrl = (entry) => entry.itemUrl;
  
    const generateSellOrdersReport = (last24HoursStats) => {
      const latestEntry = last24HoursStats[last24HoursStats.length - 1];

      const entriesWithHistogram = last24HoursStats.filter((entry) => (
        Boolean(entry.itemData.histogram)
      ));

      if (!latestEntry.itemData.histogram) {
        return `Failed to retrieve current sell orders quantity for ${getItemName(latestEntry)}`;
      }

      if (last24HoursStats.length < 22) {
        return `Not yet enough data collected for ${getItemName(latestEntry)}`;
      }

      if (entriesWithHistogram.length < 10) {
        return `Failed to retrieve sell orders too many times during last 24 hours for ${getItemName(latestEntry)}`;
      }
      
      const calculateSellOrderQuantityChangePercent = () => {
        const latestEntry = last24HoursStats[last24HoursStats.length - 1];
        const currentSellOrderQuantity = getSellOrderQuantity(latestEntry);
        const avgSellOrderQuantity24Hours = entriesWithHistogram.reduce((acc, curr) => {
          return acc += getSellOrderQuantity(curr) / entriesWithHistogram.length;
        }, 0);
        return 100 * (currentSellOrderQuantity - avgSellOrderQuantity24Hours) / avgSellOrderQuantity24Hours;
      }
      
      const percents = calculateSellOrderQuantityChangePercent();
      
      return `${formatPercents(percents)} - ${getItemName(latestEntry)} ${getItemUrl(latestEntry)}`;
    }

    const generatePricesReport = (last24HoursStats) => {
      const latestEntry = last24HoursStats[last24HoursStats.length - 1];
      const entriesWithSalePriceInfo = last24HoursStats.filter((entry) => (
        Boolean(entry.itemData.salePriceInfo)
      ));

      if (!latestEntry.itemData.salePriceInfo) {
        return `Failed to retrieve current sale price for ${getItemName(latestEntry)}`;
      }

      if (last24HoursStats.length < 22) {
        return `Not yet enough data collected for ${getItemName(latestEntry)}`;
      }

      if (entriesWithSalePriceInfo.length < 10) {
        return `Failed to retrieve sale price too many times during the last 24 hours for ${getItemName(latestEntry)}`;
      }

      const calculateSalePriceChangePercent = (last24HourStats) => {
        const getSalePrice = (entry) => entry.itemData.salePriceInfo[1];
        const currentPrice = getSalePrice(latestEntry);

        const avgSalePrice24Hours = entriesWithSalePriceInfo.reduce((acc, curr) => {
          return acc += getSalePrice(curr) / entriesWithSalePriceInfo.length;
        }, 0);
        return 100 * (currentPrice - avgSalePrice24Hours) / avgSalePrice24Hours;
      }

      const percents = calculateSalePriceChangePercent();
      
      return `${formatPercents(percents)} - ${getItemName(latestEntry)} ${getItemUrl(latestEntry)}`;
    }

    const trackedItems = await db.collection(trackedItemsCollectionName).find({}).toArray();
    console.log('trackedItems', trackedItems);

    let message = '';

    message = 'Sell orders 24 hour change:\n';
    for (const trackedItem of trackedItems) {
      message += generateSellOrdersReport(await getLast24HoursStats(trackedItem)) + '\n';
    }

    await sendTelegram(message);

    message = 'Sale prices 24 hours change:\n';
    for (const trackedItem of trackedItems) {
      message += generatePricesReport(await getLast24HoursStats(trackedItem)) + '\n';
    }

    await sendTelegram(message);
  } catch (e) {
    console.dir(e);
    throw e;
  } finally {
    console.log('Closing mongo connection');
    await client.close();
  }
}

module.exports = analyze;

// for debug
// analyze();
