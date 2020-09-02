function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

injectScript( chrome.extension.getURL('injectedScript.js'), 'body');

//var port = chrome.runtime.connect();

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
}, false);
