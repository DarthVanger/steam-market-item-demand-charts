const mongo = require('./mongo');
const steamApi = require('./steamApi');

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

const DB_NAME = 'steamMarket';
const COLLECTION_NAME = 'v3_fetchedItemsStats';

async function run() {
  const client = mongo.createClient();

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

    try {
      const itemData = await steamApi.fetchItemData(itemUrl);
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
      console.log(`Failed to fetch item stats, error: "${e.message}"`);
    }
  } catch (e) {
    console.dir(e);
  } finally {
    console.log('Closing mongo connection');
    await client.close();
  }
}


run().catch(console.dir);
