const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb://localhost:27017";

const DB_NAME = 'steamMarket';

let client;

function create() {
  return client = new MongoClient(uri);
}

async function connect() {
  try {
    console.log("Connecting to Mongo");

    await client.connect();

    console.log("Connected successfully to Mongo server");

    const database = client.db(DB_NAME);
    return database;
  } catch (e) {
    console.dir(e);
  }
}

module.exports = {
  create,
  connect,
}
