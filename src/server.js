const mongo = require('./mongo');
const steamApi = require('./steamApi');

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

async function run() {
  const { client, collection } = await mongo.connect();
  try {
    const query = { };
    const cursor = collection.find(query);
    await cursor.forEach(console.dir);
  } catch (e) {
    console.dir(e);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);;
