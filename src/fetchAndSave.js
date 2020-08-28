const mongo = require('./mongo');
const steamApi = require('./steamApi');

const pizzaDocument = {
  name: "Neapolitan pizza",
  shape: "round",
  toppings: [ "San Marzano tomatoes", "mozzarella di bufala cheese" ],
};

let mongoClient;

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

async function run() {
  try {
    mongoClient = await mongo.connect();
    const database = mongoClient.db('steamMarket');
    const collection = database.collection(`v1:${itemUrl}`);

    const itemData = await steamApi.fetchItemData(itemUrl);
    console.log('Item data fetched, saving to DB');
    const now = new Date();
    const fetchedAtISOString = now.toISOString();
    const entry = {
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
