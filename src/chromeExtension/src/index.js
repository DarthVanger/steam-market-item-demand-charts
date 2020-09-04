import { createChart } from 'lightweight-charts';

function createChartElement() {
  const element = document.createElement('div');
  element.style.width = 'calc(100% + 30px)';
  element.style.height = '400px';
  element.style.margin = '15px -15px';
  element.style.background = 'white';
  return element;
}

function drawPriceVsDemand() {
  const priceHistoryData = JSON.parse(document.body.innerHTML.match(/line1=(.+\]\]);/)[1]);
  console.log('priceHistoryData: ',  priceHistoryData);
  const chartData = priceHistoryData.slice(0, 5)
    .map(item => {
      const [dateString, price, quantity] = item;
      const date = new Date(dateString);
      const time = date.toISOString().replace(/T.*/, '');
      //const dateTooltip = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
      //const tooltip = `${dateTooltip}\n$${price}\n${quantity} sold`
      return { time, value: price, }; //quantity: Number(quantity) };
    });

  const chartElement = createChartElement();
  const steamPriceHistoryChart = document.querySelector('#pricehistory');
  const priceHistoryDemandChart = document.createElement('div');
  steamPriceHistoryChart.after(chartElement);

  const chart = createChart(chartElement, {
    width: 949,
    height: 400,
    leftPriceScale: {
      visible: true,
      borderColor: 'rgba(197, 203, 206, 1)',
    },
  });

  const slice = 1000;

  chart.addLineSeries({
    priceScaleId: 'left',
    color: 'red',
  }).setData(priceHistoryData.map(x => ({ time: x[0], value: x[1] })));


  const quantity = priceHistoryData.map(x => ({ time: x[0], value: Number(x[2]) }));
  console.log('quantity: ', quantity);

  chart.addLineSeries({
    titile: 'quantity',
    priceScaleId: 'right',
  }).setData(quantity);

  //lineSeries.setData([
  //    { time: '2019-04-11', value: 80.01 },
  //    { time: '2019-04-12', value: 96.63 },
  //    { time: '2019-04-13', value: 76.64 },
  //    { time: '2019-04-14', value: 81.89 },
  //    { time: '2019-04-15', value: 74.43 },
  //    { time: '2019-04-16', value: 80.01 },
  //    { time: '2019-04-17', value: 96.63 },
  //    { time: '2019-04-18', value: 76.64 },
  //    { time: '2019-04-19', value: 81.89 },
  //    { time: '2019-04-20', value: 74.43 },
  //]);


  //const lastChartDate = new Date(chartData[chartData.length - 1][0]);
  //console.log('lastChartDate: ', lastChartDate);
  //const initialMinDate = new Date(lastChartDate.getTime());
  //initialMinDate.setDate(lastChartDate.getDate() - 31);
  //console.log('initialMinDate: ', initialMinDate);

  //var options = {
  //  title: 'Median sale prices and quantity',
  //  legend: 'none',
  //  series: {
  //    0: {targetAxisIndex: 0},
  //    1: {targetAxisIndex: 1}
  //  },
  //  chartArea: { left: 60, right: 60 },
  // hAxis: {
  //    viewWindow: {
  //      min: initialMinDate,
  //    },
  //    gridlines: {
  //      count: 4,
  //    },
  //  },
  //  explorer: {},
  //};

  //const chart = new google.visualization.LineChart(chartElement);

  //chart.draw(dataTable, options);
}

drawPriceVsDemand();

//const lineSeries = chart.addLineSeries();
//lineSeries.setData([
//    { time: '2019-04-11', value: 80.01 },
//    { time: '2019-04-12', value: 96.63 },
//    { time: '2019-04-13', value: 76.64 },
//    { time: '2019-04-14', value: 81.89 },
//    { time: '2019-04-15', value: 74.43 },
//    { time: '2019-04-16', value: 80.01 },
//    { time: '2019-04-17', value: 96.63 },
//    { time: '2019-04-18', value: 76.64 },
//    { time: '2019-04-19', value: 81.89 },
//    { time: '2019-04-20', value: 74.43 },
//]);
/*
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "TRACK_ORDER_HISTORY")) {
    console.log("Content script received: ", event.data);
    //port.postMessage(event.data.text);
    const { itemUrl } = event.data.payload;

    fetch(`https://steam-market-demand-analyzer.trade/track/${encodeURIComponent(itemUrl)}`, { mode: 'no-cors' })
      .then(response => response.text())
      .then(data => {
        console.log(`Started tracking item ${itemUrl}`);
        window.postMessage({ type: "TRACK_ORDER_REQUEST_SUCCESS", payload: { } }, "*");
      })
      .catch(err => {
        console.log(`Failed to start tracking item. Error: ${err}`);
      });
    }

  if (event.data.type && (event.data.type == "GET_ORDER_HISTORY")) {
    console.log("Content script received: ", event.data);
    //port.postMessage(event.data.text);
    const { itemUrl } = event.data.payload;

    fetch(`https://steam-market-demand-analyzer.trade/crawl/item/${encodeURIComponent(itemUrl)}`)
      .then(response => response.json())
      .then(data => {
        console.log('response data: ', data);
        window.postMessage({ type: "ORDER_HISTORY_FETCHED", payload: { orderHistory: data } }, "*");
      })
      .catch(err => {
        console.log(`Failed to get item order history. Error:`,  err);
      });
  }

  if (event.data.type && (event.data.type == "IS_ORDER_TRACKED")) {
    console.log("Content script received: ", event.data);
    //port.postMessage(event.data.text);
    const { itemUrl } = event.data.payload;

    fetch(`https://steam-market-demand-analyzer.trade/item/is-tracked/${encodeURIComponent(itemUrl)}`)
      .then(response => response.json())
      .then(data => {
        console.log('response data: ', data);
        const { isTracked } = data;
        window.postMessage({ type: "ORDER_TRACK_STATUS_FETCHED", payload: { isTracked } }, "*");
      })
      .catch(err => {
        console.log(`Failed to check if item is tracked. Error:`,  err);
      });
  }
}, false);
*/
