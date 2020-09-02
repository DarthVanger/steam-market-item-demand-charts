const mongo = require('./mongo');

async function getCrawlItemData(itemUrl) {
  const collectionName =  'v1_crawledItemsStats';
  console.log(`Getting crawl item data from collection: "${collectionName}"`);
  const client = mongo.createClient({ collection: collectionName });

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

    const query = { itemUrl: decodeURIComponent(itemUrl) };
    const cursor = collection.find(query);
    data = await cursor.toArray();
    console.log('Mongo data received');
    return data;
  } catch (e) {
    console.dir(e);
    throw e;
  } finally {
    console.log('Closing mongo connection');
    await client.close();
  }
}

module.exports = getCrawlItemData;
