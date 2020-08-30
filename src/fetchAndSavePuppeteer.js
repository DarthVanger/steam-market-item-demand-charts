const mongo = require('./mongo');
const crawler = require('./crawler');

const pizzaDocument = {
  name: "Neapolitan pizza",
  shape: "round",
  toppings: [ "San Marzano tomatoes", "mozzarella di bufala cheese" ],
};

let mongoClient;

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

const DB_NAME = 'steamMarket';
const COLLECTION_NAME = 'v1_crawledItemsStats';

async function run() {
  try {
    mongoClient = await mongo.connect();
    const database = mongoClient.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

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
    await mongoClient.close();
  }
}


run().catch(console.dir);
