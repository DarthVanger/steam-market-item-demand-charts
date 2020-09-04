import { createChart } from 'lightweight-charts';

const chart = createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addLineSeries();
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
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
