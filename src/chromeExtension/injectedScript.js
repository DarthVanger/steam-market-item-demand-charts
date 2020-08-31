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
}

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
  element.style.height = '401px';
  element.style.margin = '15px -15px';
  return element;
}
