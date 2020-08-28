const fetch = require('node-fetch');

async function fetchItemData(itemUrl) {
  const market_hash_name = itemUrl.replace(/.+\//, '')

  const API_KEY = 'jb_EQ2nnwcwrhXpB0GAfJMgEhIo'
  const APP_ID = 730

  const url = `https://api.steamapis.com/market/item/${APP_ID}/${market_hash_name}?api_key=${API_KEY}`
  const response = await fetch(url);
  return await response.json();
}

module.exports = {
  fetchItemData,
};
