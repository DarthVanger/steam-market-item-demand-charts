const itemUrl = 'https://steamcommunity.com/market/listings/730/Sticker%20%7C%20NiKo%20%28Foil%29%20%7C%20Berlin%202019'

const market_hash_name = itemUrl.replace(/.+\//, '')
console.log('market_hash_name: ', market_hash_name)

const API_KEY = 'jb_EQ2nnwcwrhXpB0GAfJMgEhIo'
const APP_ID = 730

const url = `http://api.steamapis.com/market/item/${APP_ID}/${market_hash_name}?api_key=${API_KEY}`


google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(handleGoogleChartLibLoad);

const chartsContainer = document.querySelector('#charts')
//chartsContainer.style.display = 'flex';
//chartsContainer.style.flexWrap = 'wrap';

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

  const itemInfoContainer = document.querySelector('#item-info')

  itemInfoContainer.innerHTML = `<h1>${decodeURI(market_hash_name)}</h1>`

  drawMedianAvgPrices(itemData.median_avg_prices_15days)
  drawChart({
    title: 'Sell order quantity',
    isQuantityChart: true,
    histogram: itemData.histogram.sell_order_graph
  })
  drawChart({
    title: 'Sell order price',
    isQuantityChart: false,
    histogram:  itemData.histogram.sell_order_graph
  })
  drawChart({
    title: 'Buy order quantity',
    isQuantityChart: true,
    histogram:  itemData.histogram.buy_order_graph
  })
  drawChart({
    title: 'Buy order price',
    isQuantityChart: false,
    histogram:  itemData.histogram.buy_order_graph
  })
}

function drawMedianAvgPrices(avgPrices) {
  console.log('avgPrices: ', avgPrices)

  const chartData = avgPrices
    .map((item, index) => {
      const [day, price, quantity] = item;
      const uahRate = 27.47
      const priceUAH = Math.round(price * uahRate);
      const tooltip = `Day: ${day}\nPrice (UAH): ${priceUAH}\nQuantity: ${quantity}`
      return [day, priceUAH, tooltip]
    });

  console.log('chartData: ', chartData)

  var data = new google.visualization.DataTable();

  data.addColumn('string', 'day');
  data.addColumn('number', 'price (UAH)');
  data.addColumn({type: 'string', role: 'tooltip'});

  data.addRows(chartData);

  var options = {
    title: 'Median average prices',
    curveType: 'function',
    legend: 'none'
  };

  var chart = new google.visualization.LineChart(createChartElement());

  chart.draw(data, options);
}

function drawChart({ histogram, title, isQuantityChart }) {
  console.log('histogram: ', histogram);

  const chart_data = histogram
    .map((item, index) => {
      const [price, quantity, tooltip] = item;

      const uahRate = 27.47
      const tooltipWithUah = tooltip.replace(/(\$[\S]+\s)/, `$1 (${Math.round(price * uahRate)} UAH) `);
      const priceUAH = price * uahRate 

      return isQuantityChart ? 
        [index, quantity, tooltipWithUah]
        :
        [index, priceUAH, tooltipWithUah]
    });

  console.log('chart_data: ', chart_data)

  var data = new google.visualization.DataTable();

  data.addColumn('number', 'index');
  data.addColumn('number', isQuantityChart ? 'quantity' : 'price');
  data.addColumn({type: 'string', role: 'tooltip'});

  data.addRows(chart_data);

  var options = {
    title,
    curveType: 'function',
    legend: 'none'
  };

  var chart = new google.visualization.LineChart(createChartElement());

  chart.draw(data, options);
}

function createChartElement() {
  const element = document.createElement('div');
  element.style.width = '100%';
  //element.style.height = '700px';
  chartsContainer.append(element);
  return element;
}
