const http = require('http');
const fs = require('fs');
const mongo = require('./mongo');
const steamApi = require('./steamApi');

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

async function run() {
  return startServer();
}

run().catch(console.dir);

async function startServer() {
  http.createServer((req, res) => {
    console.log('Got http request');
    respondWithData(res)
      .catch ((e) => {
        res.writeHead(500, {'Content-Type': 'text/plain'})
        res.end(e.message);
      });

      async function respondWithData(res) {
        const itemData = await getItemData();
        console.log('Sending http response with data from Mongo');
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.write(Buffer.from(JSON.stringify(itemData)));
        res.end();
      }
  }).listen(80, () => {
    console.log('Server started, listening port 80');
  });
}

async function getItemData() {
  console.log('Connecting to Mongo');
  const { client, collection } = await mongo.connect();

  try {
    const query = { };
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
