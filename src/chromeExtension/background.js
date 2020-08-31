//chrome.runtime.onInstalled.addListener(function() {
//  chrome.storage.sync.set({color: '#3aa757'}, function() {
//    console.log("The color is green.");
//  });
//});

const target = 'https://steamcommunity.com/market/*';

chrome.webRequest.onCompleted.addListener(response => {
  console.log('response: ', response);
}, { urls: [target] });
