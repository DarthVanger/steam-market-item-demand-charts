const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb://localhost:27017";

// Create a new MongoClient
const client = new MongoClient(uri);

async function connect() {
    // Connect the client to the server
    await client.connect();

    console.log("Connected successfully to Mongo server");
    return client;
    //const result = collection.insertOne(pizzaDocument);
    //console.dir(result.insertedCount);
    //const movies = await collection.find();
    //console.log('movies: ', movies);
}

module.exports = {
  connect,
}
