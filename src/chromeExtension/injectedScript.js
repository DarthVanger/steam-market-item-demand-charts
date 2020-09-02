console.log('injected script');

const priceHistoryData = JSON.parse(document.body.innerHTML.match(/line1=(.+\]\]);/)[1]);
console.log(priceHistoryData);

const googleChartsScript = document.createElement('script');
googleChartsScript.src = 'https://www.gstatic.com/charts/loader.js';
googleChartsScript.onload = handleGoogleChartsScriptLoad;

document.body.append(googleChartsScript);

function handleGoogleChartsScriptLoad() {
  console.log('google charts script loaded');
  google.charts.load('current', {'packages':['corechart', 'line']});
  google.charts.setOnLoadCallback(handleGoogleChartLibLoad);
}

function handleGoogleChartLibLoad() {
  console.log('google chart lib loaded');
  drawPriceVsDemand();
  drawOrdersChart();
}

const getSellOrderSummary = (historicalItem) => historicalItem.itemData.histogram.sell_order_summary;

function drawPriceVsDemand() {
  const chartData = priceHistoryData
    .map(item => {
      const [day, price, quantity] = item;
      const date = new Date(day);
      const dateTooltip = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
      const tooltip = `${dateTooltip}\n$${price}\n${quantity} sold`
      return [date, price, tooltip, Number(quantity), tooltip]
    });

  var dataTable = new google.visualization.DataTable();

  dataTable.addColumn('date', 'day');
  dataTable.addColumn('number', 'price');
  dataTable.addColumn({type: 'string', role: 'tooltip'});
  dataTable.addColumn('number', 'quantity');
  dataTable.addColumn({type: 'string', role: 'tooltip'});

  dataTable.addRows(chartData);

  const lastChartDate = new Date(chartData[chartData.length - 1][0]);
  console.log('lastChartDate: ', lastChartDate);
  const initialMinDate = new Date(lastChartDate.getTime());
  initialMinDate.setDate(lastChartDate.getDate() - 31);
  console.log('initialMinDate: ', initialMinDate);

  var options = {
    title: 'Median sale prices and quantity',
    legend: 'none',
    series: {
      0: {targetAxisIndex: 0},
      1: {targetAxisIndex: 1}
    },
    chartArea: { left: 60, right: 60 },
   hAxis: {
      viewWindow: {
        min: initialMinDate,
      },
      gridlines: {
        count: 4,
      },
    },
    explorer: {},
  };

  const chartElement = createChartElement();
  const steamPriceHistoryChart = document.querySelector('#pricehistory');
  const priceHistoryDemandChart = document.createElement('div');
  steamPriceHistoryChart.after(chartElement);

  const chart = new google.visualization.LineChart(chartElement);

  chart.draw(dataTable, options);
}

function createChartElement() {
  const element = document.createElement('div');
  element.style.width = 'calc(100% + 30px)';
  element.style.height = '400px';
  element.style.margin = '15px -15px';
  return element;
}

function drawOrdersChart() {
  const itemUrl = window.location.href;
  window.postMessage({ type: "GET_ORDER_HISTORY", payload: { itemUrl } }, "*");

  window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
      return;

    if (event.data.type && (event.data.type == "ORDER_HISTORY_FETCHED")) {
      console.log("Injected script received: ", event.data);
      const { orderHistory } = event.data.payload;
      if (orderHistory.length > 1) {
        drawCrawlData(orderHistory);
      } else {
        const ordersHistogramElement = document.querySelector('#orders_histogram');
        console.log('ordersHistogramElement: ', ordersHistogramElement);
        const notSubscribedYetElement = createChartElement();
        notSubscribedYetElement.style.background = 'white';
        notSubscribedYetElement.style.padding = '15px';
        notSubscribedYetElement.style.width = '100%';
        notSubscribedYetElement.innerHTML = `
          <div style="display: flex; height: 100%; align-items: center; justify-content: center;">
            <button type="button" style="padding: 20px; background: #84079a; color: white; border: none; font-size: 24px; cursor: pointer">
              Start tracking item order history
            </button>
          </div>
        `;
        const startTrackingOrderHistoryButton = notSubscribedYetElement.querySelector('button');
        startTrackingOrderHistoryButton.onclick = startTrackingItemOrderHistory;
        ordersHistogramElement.after(notSubscribedYetElement);
      }
    }
  }, false);

}

function startTrackingItemOrderHistory() {
  const itemUrl = window.location.href;
  console.log(`Starting to track order history for item: ${itemUrl}`);

  window.postMessage({ type: "TRACK_ORDER_HISTORY", payload: { itemUrl } }, "*");
}

function drawCrawlData(historicalData) {
  console.log('crawl data: ', historicalData);
  const rows = [];
  historicalData.forEach(historicalItem => {
    const date = new Date(historicalItem.fetchedAt);
    const sellOrderSummary = getSellOrderSummary(historicalItem);
    const [quantity, price] = sellOrderSummary ;
    const tooltip = `${quantity} sell orders at price starting at $${price}\nDate: ${date};`
    rows.push([date, quantity, tooltip]);
  });

  console.log('crawl chart rows: ', rows);

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('date', 'Date');
  dataTable.addColumn('number', 'Quantity');
  dataTable.addColumn({type: 'string', role: 'tooltip'});

  dataTable.addRows(rows);

  var options = {
    title: 'Sell orders quantity dynamics',
    explorer: {},
      legend: 'none',
      //chartArea: { left: '8%', top: '10%', width: "85%", height: "70%"}
      chartArea: { left: 60, right: 60 },
  };

  const sellOrderHistoryElement = createChartElement();
  const ordersHistogramElement = document.querySelector('#orders_histogram');
  ordersHistogramElement.after(sellOrderHistoryElement);

  var chart = new google.visualization.LineChart(sellOrderHistoryElement);

  chart.draw(dataTable, options);

  return dataTable;
}
