const url = '/item';
const urlCrawl = '/crawl/item';

google.charts.load('current', {'packages':['corechart', 'line']});
google.charts.setOnLoadCallback(handleGoogleChartLibLoad);

const chartsContainer = document.querySelector('#charts')

function handleGoogleChartLibLoad() {
  console.log('google chart lib loaded');

  console.log('fetching data from server');
  fetch(url)
    .then(response => response.json())
    .then(data => draw(data));

  fetch(urlCrawl)
    .then(response => response.json())
    .then(data => drawCrawlData(data))
}

function drawCrawlData(historicalData) {
  console.log('crawl data: ', historicalData);
}

function draw(historicalData) {

  console.log('historical steam data fetched');
  console.log('historicalData: ', historicalData)

  const latestItemData = historicalData.sort((a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt))[0].itemData;
  console.log('latestItemData:', latestItemData);

  const itemInfoContainer = document.querySelector('#item-info')

  itemInfoContainer.innerHTML = `
    <h1>
      ${decodeURI(latestItemData.market_hash_name)}
      <small>
        (<a href="${latestItemData.url}">open in steam</a>)
      </small>
    </h1>
  `;

  const avgPrices = latestItemData.median_avg_prices_15days;

  const getSellOrderGraph = (historicalItem) => historicalItem.itemData.histogram.sell_order_graph;
  const getSellOrderSummary = (historicalItem) => historicalItem.itemData.histogram.sell_order_summary;

  const updatedAtDates = [];
  function generateSellOrdersHistogramDynamicsDataTable() {
    const updatedAtTimestamps = new Set();
    historicalData.forEach(historicalItem => {
      updatedAtTimestamps.add(historicalItem.itemData.updated_at);
    });
    console.log('updatedAtTimestamps: ', updatedAtTimestamps);

    const columnNames = [];
    const rows = [];
    let timestampIndex = 0;
    updatedAtTimestamps.forEach((timestamp) => {
      const date = new Date(timestamp);
      //date.setHours(0,0,0,0);
      updatedAtDates.push(date);
      const historicalItem = historicalData.find(h => h.itemData.updated_at === timestamp);
      const quantities = getSellOrderGraph(historicalItem).map(x => x[1]);
      const row = [date];
      getSellOrderGraph(historicalItem).map(graphItem => {
        const [price, quantity, tooltip] = graphItem;
        console.log('timestampIndex: ', timestampIndex);
        if (timestampIndex === 0) {
          columnNames.push(`$${price} or lower`);
        }
        row.push(quantity);
      });
      rows.push(row); 
      timestampIndex++;
    });

    console.log('columnNames: ', columnNames);
    console.log('rows: ', rows);

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('date', 'Date');
    columnNames.forEach(columnName => {
      dataTable.addColumn('number', columnName);
    });

    dataTable.addRows(rows);

    console.log('dataTable: ', dataTable);

    return dataTable;
  }

  const generateSellOrdersQuantityDynamicsDataTable = () => {
    const updatedAtTimestamps = new Set();
    historicalData.forEach(historicalItem => {
      updatedAtTimestamps.add(historicalItem.itemData.updated_at);
    });
    console.log('updatedAtTimestamps: ', updatedAtTimestamps);

    const rows = [];
    updatedAtTimestamps.forEach((timestamp) => {
      const date = new Date(timestamp);
      const historicalItem = historicalData.find(h => h.itemData.updated_at === timestamp);
      const {price, quantity} = getSellOrderSummary(historicalItem);
      const tooltip = `${quantity} order for sale starting at $${price}\nDate: ${date}`
      rows.push([date, quantity, tooltip]);
    });

    console.log('rows: ', rows);

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('date', 'Date');
    dataTable.addColumn('number', 'quantity');
    dataTable.addColumn({type: 'string', role: 'tooltip'});

    dataTable.addRows(rows);

    return { rows, dataTable };
  }

  function drawSellOrdersQuantityDynamics({ rows, dataTable }) {
      const dates = rows.map(r => r[0]);
      var options = {
        title: 'Total sell orders quantity dynamics',
        explorer: {},
        legend: 'none',
        hAxis: {
         format: 'dd/MM/yy hh:mm:ss',
          viewWindow: {
            min: dates[0],
            max: dates[dates.length - 1],
          },
          viewWindowMode: 'explicit',
          ticks: dates,
          gridlines: {
            count: dates.length,
          }
        },
        chartArea: { left: '8%', top: '8%', width: "88%", height: "70%"}
      };

    var chart = new google.visualization.LineChart(createChartElement());
    chart.draw(dataTable, options);
  }

  function drawSellOrdersHistogramDynamics(dataTable) {
      var options = {
        title: 'Sell orders histogram dynamics',
        explorer: {},
        hAxis: {
         format: 'dd/MM/yy hh:mm:ss',
          viewWindow: {
            min: updatedAtDates[0],
            max: updatedAtDates[updatedAtDates.length - 1],
          },
          viewWindowMode: 'explicit',
          ticks: updatedAtDates,
          gridlines: {
            count: updatedAtDates.length,
          }
        },
        chartArea: { left: '8%', top: '8%', width: "70%", height: "70%"}
      };

    var chart = new google.visualization.LineChart(createChartElement());
    chart.draw(dataTable, options);
  }

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

  drawMedianAvgPrices({
    title: 'Median average prices',
    avgPrices,
  });

  drawSellOrdersQuantityDynamics(generateSellOrdersQuantityDynamicsDataTable());
  drawSellOrdersHistogramDynamics(generateSellOrdersHistogramDynamicsDataTable());
}


function usdToUah(usd) {
  uahRate = 27.47;
  return Math.round(usd * uahRate);
}

function createChartElement() {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100vh';
  element.style.marginBottom = '10px';
  chartsContainer.append(element);
  return element;
}
