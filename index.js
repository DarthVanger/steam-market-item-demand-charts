const itemUrl = 'https://steamcommunity.com/market/listings/730/Sticker%20%7C%20NiKo%20%28Foil%29%20%7C%20Berlin%202019'

const market_hash_name = itemUrl.replace(/.+\//, '')
console.log('market_hash_name: ', market_hash_name)

const API_KEY = 'jb_EQ2nnwcwrhXpB0GAfJMgEhIo'
const APP_ID = 730

const url = `http://api.steamapis.com/market/item/${APP_ID}/${market_hash_name}?api_key=${API_KEY}`


google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(handleGoogleChartLibLoad);

function handleGoogleChartLibLoad() {
  console.log('google chart lib loaded');

  console.log('fetching data from steam');
  fetch(url)
    .then(response => response.json())
    .then(data => draw(data));
}

function draw(itemData) {
  console.log('steam data fetched');
  console.log('itemData: ', itemData)

  drawSellPriceChart(itemData)
  drawQuantityChart({ title: 'Sell order graph', histogram: itemData.histogram.sell_order_graph })
  drawQuantityChart({ title: 'Buy order graph', histogram:  itemData.histogram.buy_order_graph })
}

function drawSellPriceChart(itemData) {
  const sell_price_chart = itemData.histogram.sell_order_graph
    .map((item, index) => {
      const [price, quantity, tooltip] = item;
      const uahRate = 27.47
      const tooltipWithUah = tooltip.replace(/(\$[\S]+\s)/, `$1 (${Math.round(price * uahRate)} UAH) `);
      return [index, price * uahRate, tooltipWithUah]
    });

  console.log('sell_price_chart: ', sell_price_chart)

  var data = new google.visualization.DataTable();

  data.addColumn('number', 'index');
  data.addColumn('number', 'price (UAH)');
  data.addColumn({type: 'string', role: 'tooltip'});

  data.addRows(sell_price_chart);

  var options = {
    title: 'sell_price_chart',
    curveType: 'function',
    legend: { position: 'bottom' },
  };

  var chart = new google.visualization.LineChart(document.getElementById('sell_price_chart'));

  chart.draw(data, options);
}

function drawQuantityChart({ histogram, title }) {
  console.log('histogram: ', histogram);

  const chart_data = histogram
    .map((item, index) => {
      const [price, quantity, tooltip] = item;
      return [index, quantity, tooltip]
    });

  console.log('chart_data: ', chart_data)

  var data = new google.visualization.DataTable();

  data.addColumn('number', 'index');
  data.addColumn('number', 'quantity');
  data.addColumn({type: 'string', role: 'tooltip'});

  data.addRows(chart_data);

  var options = {
    title,
    curveType: 'function',
    legend: { position: 'bottom' }
  };

  const element = document.createElement('div');
  element.style.width = '900px';
  element.style.height = '500px';
  document.body.append(element);

  var chart = new google.visualization.LineChart(element);

  chart.draw(data, options);
}
