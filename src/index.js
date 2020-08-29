//async function fetchItemData(itemUrl) {
//  const market_hash_name = itemUrl.replace(/.+\//, '')
//
//  const API_KEY = 'jb_EQ2nnwcwrhXpB0GAfJMgEhIo'
//  const APP_ID = 730
//
//  const url = `https://api.steamapis.com/market/item/${APP_ID}/${market_hash_name}?api_key=${API_KEY}`
//  const response = await fetch(url);
//  return await response.json();
//}
//
//const itemUrl = 'https://steamcommunity.com/market/listings/730/Chroma%203%20Case'
//fetchItemData(itemUrl).then(itemData => {
//  console.log('fresh steam item data: ', itemData);
//});


const url = '/item';

google.charts.load('current', {'packages':['corechart', 'line']});
google.charts.setOnLoadCallback(handleGoogleChartLibLoad);

const chartsContainer = document.querySelector('#charts')

function handleGoogleChartLibLoad() {
  console.log('google chart lib loaded');

  console.log('fetching data from steam');
  fetch(url)
    .then(response => response.json())
    .then(data => draw(data));
}

const getHistogram = (itemData) => itemData.itemData.histogram

function draw(historicalData) {
  console.log('historical steam data fetched');
  console.log('historicalData: ', historicalData)

  const latestItemData = historicalData.sort((a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt))[0].itemData;
  console.log('latestItemData:', latestItemData);

  const itemInfoContainer = document.querySelector('#item-info')

  itemInfoContainer.innerHTML = `<h1>${decodeURI(latestItemData.market_hash_name)}</h1>`

  const avgPrices = latestItemData.median_avg_prices_15days;

  const buyOrders = historicalData.map(historicalItem => ({
      date: new Date(historicalItem.fetchedAt),
      //quantity: historicalItem.itemData.histogram.buy_order_summary.quantity,
      quantity: historicalItem.itemData.histogram.buy_order_graph.reduce((acc, curr) => acc + curr[1], 0)
  }));

  const getSellOrderGraph = (historicalItem) => historicalItem.itemData.histogram.sell_order_graph;

  const histogramPrices = new Set();
  historicalData.forEach(historicalItem => {
    const sellOrderGraph = getSellOrderGraph(historicalItem);
    sellOrderGraph.forEach(graphItem => {
      const price = graphItem[0];
      histogramPrices.add(price);
    });
  });

  console.log('histogramPrices: ', histogramPrices);

  const sellOrderLines = [];
  histogramPrices.forEach(price => {
    const line = [];
    historicalData.forEach(historicalItem => {
      const dateFetched = new Date(historicalItem.fetchedAt);
      const apiDataUpdateDate = new Date(historicalItem.itemData.updated_at);
      const sellOrderGraphItem = getSellOrderGraph(historicalItem).find(x => x[0] === price);
      const quantity = sellOrderGraphItem[1];
      const tooltip = sellOrderGraphItem[2];
      line.push([apiDataUpdateDate, price, quantity, tooltip]);
    });
    sellOrderLines.push(line); 
  });

  console.log('sellOrderLines: ', sellOrderLines);
  console.log('fetchedAt vs updatedAt: ', historicalData.map(h => ({
    fetched_at: new Date(h.fetchedAt),
    updated_at: new Date(h.itemData.updated_at),
  })));


  const sellOrders = historicalData.map(historicalItem => ({
      date: new Date(historicalItem.fetchedAt),
      quantity: historicalItem.itemData.histogram.sell_order_graph.reduce((acc, curr) => acc + curr[1], 0)
  }));

  console.log('buyOrders: ', buyOrders);
  console.log('sellOrders: ', sellOrders);

  drawMedianAvgPrices({
    title: 'Median average prices',
    avgPrices,
  });

  drawOrders({
    title: 'Sell orders total',
    data: historicalData.histogram.sell_order_graph
  })
  drawOrders({
    title: 'Buy orders total',
    histogram:  historicalData.histogram.buy_order_graph
  })

  function drawMedianAvgPrices({ title, avgPrices, isQuantityChart }) {
    console.log('avgPrices: ', avgPrices)

    const chartData = avgPrices
      .map((item, index) => {
        const [day, price, quantity] = item;
        const uahRate = 27.47
        const priceUAH = Math.round(price * uahRate);
        const tooltip = `Day: ${day}\nPrice (UAH): ${priceUAH}\nQuantity: ${quantity}`
        return [new Date(day), priceUAH, quantity, tooltip]
      });

    var data = new google.visualization.DataTable();

    data.addColumn('date', 'day');
    data.addColumn('number', 'price (UAH)');
    data.addColumn('number', 'quantity');
    data.addColumn({type: 'string', role: 'tooltip'});

    data.addRows(chartData);

    var options = {
      title,
      series: {
        // Gives each series an axis name that matches the Y-axis below.
        0: {targetAxisIndex: 0},
        1: {targetAxisIndex: 1}
      },
      vAxes: {
        // Adds labels to each axis; they don't have to match the axis names.
        0: {title: 'Prices (UAH)'},
        1: {title: 'Quantity'}
      },
      explorer: {},
    };

    var chart = new google.visualization.LineChart(createChartElement());

    chart.draw(data, options);
  }

  function drawOrders({ histogram, title  }) {
    console.log('title: ', title);
    console.log('histogram: ', histogram);

    const chart_data = histogram
      .map((item) => {
        const [price, quantity, tooltip] = item;

        const uahRate = 27.47
        const tooltipWithUah = tooltip.replace(/(\$[\S]+\s)/, `$1 (${Math.round(price * uahRate)} UAH) `);
        const priceUAH = Math.round(price * uahRate) 

        return [
          quantity,
          priceUAH,
          tooltipWithUah
        ]
      });

    console.log('chart_data: ', chart_data)

    var data = new google.visualization.DataTable();

    data.addColumn('number', 'quantity');
    data.addColumn('number', 'price');
    data.addColumn({type: 'string', role: 'tooltip'});

    data.addRows(chart_data);

    var options = {
      title,
      legend: 'none',
      vAxis: {
        maxValue: usdToUah(itemData.histogram.graph_max_x) + 10,
        minValue: usdToUah(itemData.histogram.graph_min_x),
      },
      hAxis: {
        maxValue: itemData.histogram.graph_max_y,
        minValue: 0,
      }
    };

    var chart = new google.visualization.LineChart(createChartElement());

    chart.draw(data, options);
  }
}

function usdToUah(usd) {
  uahRate = 27.47;
  return Math.round(usd * uahRate);
}

function createChartElement() {
  const element = document.createElement('div');
  element.style.width = '1500px';
  element.style.height = '400px';
  element.style.marginBottom = '10px';
  chartsContainer.append(element);
  return element;
}
