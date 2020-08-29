const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb://localhost:27017";

const DB_NAME = 'steamMarket';
const COLLECTION_NAME = 'v3_fetchedItemsStats';

let client;

function createClient() {
  return client = new MongoClient(uri);
}

async function connect() {
  try {
    // Connect the client to the server
    await client.connect();

    console.log("Connected successfully to Mongo server");

    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);
    return collection;
  } catch (e) {
    console.dir(e);
  }
}

module.exports = {
  createClient,
  connect,
}
