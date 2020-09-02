#!/usr/bin/env node

var childProcess = require('child_process');
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

async function respondWithCrawlData({ res, itemUrl }) {
  const itemData = await getCrawlItemData(itemUrl);
  console.log('Sending http response with crawl data from Mongo with CORS header');
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });

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

    if (url.includes('/crawl/item')) {
      const itemUrl = url.replace('/crawl/item/', '');
      respondWithCrawlData({ res, itemUrl }).catch(respondWith500);
    }

    if (/.+[.]js/.test(url)) {
      const filePath = url.substring(1);
      console.log(`Reading requested file "${filePath}"`);
      respondWithJSFile({ res, filePath });
    }

    if (url.includes('acme-challenge')) {
      responWithPlainTextFile({ res, filePath: url.substr(1) }).catch(respondWith500);
    }

    if (url.includes('/track')) {
      const itemUrl = url.replace('/track/', '');
      trackItem(itemUrl)
        .then(() => {
          console.log('responding with 200 for /track');
          res.writeHead(200);
          res.end();
        })
        .catch(respondWith500);
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

    const query = { }
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

async function getCrawlItemData(itemUrl) {
  const collectionName =  'v1_crawledItemsStats';
  console.log(`Getting crawl item data from collection: "${collectionName}"`);
  const client = mongo.createClient({ collection: collectionName });

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

    const query = { itemUrl: decodeURIComponent(itemUrl) };
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

async function trackItem(itemUrl) {
  const collectionName =  'v2_trackedItems';
  console.log(`Saving an item url "${itemUrl}" to collection:"${collectionName}"`);
  const client = mongo.createClient({ collection: collectionName });

  try {
    console.log('Connecting to Mongo');
    const collection = await mongo.connect();

    const existingItemsWithSameUrl = await collection.find({ itemUrl }).toArray();

    if (existingItemsWithSameUrl.length > 0) {
      console.log('Item is already tracked');
    } else {
      const entry = { itemUrl };
      await collection.insertOne(entry);
      console.log('Inserted the item url to the DB');
    }

    const query = { };
    console.log('Tracked items:');
    const cursor = collection.find(query);
    await cursor.forEach(console.dir);
    await crawlAndSave();
  } catch (e) {
    console.dir(e);
    throw e;
  } finally {
    console.log('Closing mongo connection');
    await client.close();
  }
}

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

async function crawlAndSave() {
  console.log('Running crawlAndSave.js from server process');
  runScript('./crawlAndSave.js', function (err) {
      if (err) throw err;
      console.log('finished running crawlAndSavejs from server process');
  });
}
