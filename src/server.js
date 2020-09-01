#!/usr/bin/env node

const https = require('https');
const fs = require('fs/promises');
const mongo = require('./mongo');
const steamApi = require('./steamApi');

const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'

async function run() {
  return startServer();
}

run().catch(console.dir);

async function respondWithData(res) {
  const itemData = await getItemData();
  console.log('Sending http response with data from Mongo');
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.write(Buffer.from(JSON.stringify(itemData)));
  res.end();
}

async function respondWithCrawlData(res) {
  const itemData = await getCrawlItemData();
  console.log('Sending http response with crawl data from Mongo');
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.write(Buffer.from(JSON.stringify(itemData)));
  res.end();
}

async function responWithIndexHtml(res) {
  try {
    const file = await fs.readFile('./index.html', 'utf-8');
    console.log('Successfully read index.html');
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write(file);
    res.end();
  } catch (error) {
    console.error('Failed to send index.html, error: ', error.message);
    throw error;
  }
}

async function respondWithJSFile({ res, filePath }) {
  try {
    const file = await fs.readFile(filePath, 'utf-8');
    console.log(`Successfully read JS file "${filePath}"`);
    res.writeHead(200, {'Content-Type': 'text/javascript'})
    res.write(file);
    res.end();
  } catch (error) {
    console.error(`Failed to send JS file "${filePath}", error: `, error.message);
    throw error;
  }
}

async function responWithPlainTextFile({ res, filePath }) {
  try {
    const file = await fs.readFile(filePath, 'utf-8');
    console.log(`Successfully read plain text file "${filePath}"`);
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.write(file);
    res.end();
  } catch (error) {
    console.error(`Failed to send a plain text file "${filePath}", error: `, error.message);
    throw error;
  }
}

async function startServer() {
  const key = await fs.readFile('/home/ec2-user/.getssl/steam-market-demand-analyzer.trade/steam-market-demand-analyzer.trade.key');
  const cert = await fs.readFile('/home/ec2-user/.getssl/steam-market-demand-analyzer.trade/steam-market-demand-analyzer.trade.crt');
  const options = {
    key,
    cert,
  };

  https.createServer(options, (req, res) => {
    const url = req.url;

    function respondWith500(e) {
      res.writeHead(500, {'Content-Type': 'text/plain'})
      res.end(e.message);
    };


    console.log(`Got http request, url: ${url}`);
    if (url === '/') {
      responWithIndexHtml(res).catch(respondWith500);
    }

    if (url === '/item') {
      respondWithData(res).catch (respondWith500);
    }

    if (url === '/crawl/item') {
      respondWithCrawlData(res).catch (respondWith500);
    }

    if (/.+[.]js/.test(url)) {
      const filePath = url.substring(1);
      console.log(`Reading requested file "${filePath}"`);
      respondWithJSFile({ res, filePath });
    }

    if (url.includes('acme-challenge')) {
      responWithPlainTextFile({ res, filePath: url.substr(1) }).catch(respondWith500);
    }
  }).listen(443, () => {
    console.log('Server started, listening port 443');
  });
}

async function getItemData() {
  const client = mongo.createClient();

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

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

async function getCrawlItemData() {
  const collectionName =  'v1_crawledItemsStats';
  console.log(`Getting crawl item data from collection: "${collectionName}"`);
  const client = mongo.createClient({ collection: collectionName });

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

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
