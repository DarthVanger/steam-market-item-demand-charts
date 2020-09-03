const puppeteer = require('puppeteer');

async function fetchItemData(itemUrl) {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();

    const result = {};

    page.on('response', (response) => {
      if (/itemordershistogram/.test(response.url())) {
        (async () => {
          const responseBody = await response.json();

          result.histogram = {
            ...responseBody,
            sell_order_summary: parseOrderSummary(responseBody.sell_order_summary),
            buy_order_summary: parseOrderSummary(responseBody.buy_order_summary),
          };
        })();
      }
    });

    await page.goto(itemUrl,  {waitUntil: 'networkidle2'});

    const documentBody = await page.$('body');
    const bodyHTML = await page.evaluate(documentBody => documentBody.innerHTML, documentBody);
    const medianSalePrices = JSON.parse(bodyHTML.match(/line1=(.+\]\]);/)[1]);

    result.salePriceInfo = medianSalePrices[medianSalePrices.length - 1];

    await browser.close();
    console.log('Puppeteer: crawl successful');
    return result;
}

module.exports = { fetchItemData };

function parseOrderSummary(order_summary) {
  const numberOfOrders = Number(order_summary.match(/<span class="market_commodity_orders_header_promote">(\d+)<\/span>/)[1]);
  const price = Number(order_summary.match(/<span class="market_commodity_orders_header_promote">\$(.+)<\/span>/)[1]);

  return [numberOfOrders, price];
}

// for debug
// fetchItemData('https://steamcommunity.com/market/listings/730/Chroma%203%20Case');
