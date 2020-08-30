const mongo = require('./mongo');
const crawler = require('./crawler');

let mongoClient;

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

const DB_NAME = 'steamMarket';
const COLLECTION_NAME = 'v1_crawledItemsStats';

async function run() {
  const client = mongo.createClient({ collection: COLLECTION_NAME });

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

    const itemData = await crawler.fetchItemData(itemUrl);
    console.log(`Item stats fetched, saving to database "${DB_NAME}" in collection "${COLLECTION_NAME}"`);
    const now = new Date();
    const fetchedAtISOString = now.toISOString();
    const entry = {
      itemUrl,
      fetchedAt: fetchedAtISOString,
      itemData,
    };
    await collection.insertOne(entry);
    const query = { fetchedAt: fetchedAtISOString };
    console.log('Saved data: ');
    const cursor = collection.find(query);
    await cursor.forEach(console.dir);
  } catch (e) {
    console.dir(e);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}


run().catch(console.dir);
