const puppeteer = require('puppeteer');

const url = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('response', (response) => {
      if (/itemordershistogram/.test(response.url())) {
        console.log('response url: ', response.url());
        (async () => {
          const responseBody = await response.json();
          console.log('responseBody: ', responseBody);
          const numberOfOrders = Number(responseBody.sell_order_summary.match(/<span class="market_commodity_orders_header_promote">(\d+)<\/span>/)[1]);
          const price = Number(responseBody.sell_order_summary.match(/<span class="market_commodity_orders_header_promote">\$(.+)<\/span>/)[1]);
          console.log('numberOfOrders: ', numberOfOrders);
          console.log('price: ', price);
        })();
      }
    });
    await page.goto(url,  {waitUntil: 'networkidle2'});
    await page.screenshot({path: 'image.png'});

    await browser.close();
})();
