const itemUrl = 'https://steamcommunity.com/market/listings/730/Sticker%20%7C%20NiKo%20%28Foil%29%20%7C%20Berlin%202019'

const market_hash_name = itemUrl.replace(/.+\//, '')
console.log('market_hash_name: ', market_hash_name)

const API_KEY = 'jb_EQ2nnwcwrhXpB0GAfJMgEhIo'
const APP_ID = 730

const url = `https://api.steamapis.com/market/item/${APP_ID}/${market_hash_name}?api_key=${API_KEY}`


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

function draw(itemData) {
  console.log('steam data fetched');
  console.log('itemData: ', itemData)

  const itemInfoContainer = document.querySelector('#item-info')

  itemInfoContainer.innerHTML = `<h1>${decodeURI(market_hash_name)}</h1>`

  const avgPrices = itemData.median_avg_prices_15days;
  drawMedianAvgPrices({
    title: 'Median average quantity',
    avgPrices,
  });

  if (itemData.histogram) {
    drawHistogram({
      title: 'Sell orders price in UAH vs quantity',
      histogram: itemData.histogram.sell_order_graph
    })
    drawHistogram({
      title: 'Buy orders price in UAH vs quantity',
      histogram:  itemData.histogram.buy_order_graph
    })
  }

  function drawMedianAvgPrices({ title, avgPrices, isQuantityChart }) {
    console.log('avgPrices: ', avgPrices)

    const chartData = avgPrices
      .map((item, index) => {
        const [day, price, quantity] = item;
        const uahRate = 27.47
        const priceUAH = Math.round(price * uahRate);
        const tooltip = `Day: ${day}\nPrice (UAH): ${priceUAH}\nQuantity: ${quantity}`
        return [day, priceUAH, quantity, tooltip]
      });

    var data = new google.visualization.DataTable();

    data.addColumn('string', 'day');
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
      }
    };

    var chart = new google.visualization.LineChart(createChartElement());

    chart.draw(data, options);
  }

  function drawHistogram({ histogram, title  }) {
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
