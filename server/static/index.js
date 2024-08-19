var data;
var currentData;
const ctx = document.getElementById('bitcoinChart');
const currentPrice = document.getElementById('currentPrice');
const marketCap = document.getElementById('marketCap');
const volume = document.getElementById('volume');
const supply = document.getElementById('supply');
const maxSupply = document.getElementById('maxSupply');
const percent = document.getElementById('percent');

function getData(callback) {
    $.ajax({
        type: 'GET',
        url: '/fetch-data',
        success: function(response) {
            $("#content").text(response);
            data = response;
            callback();
        }
    })

}

getData(function() {
    const last = data.length - 1;
    console.log(data)
    const dataSort = data.sort((a,b) => a.timestamp - b.timestamp);
    const filteredData = dataSort.map(item => ({
        timestamp: item.timestamp,
        price: item.data["1"].quote.USD.price
      }));

      let plotData = {
        timestamp: filteredData.map(item => new Date(Number(item.timestamp)*1000).toLocaleString()),
        prices: filteredData.map(item => item.price)
      };
      currentData = {
        marketCap: data[last].data["1"].quote.USD.market_cap,
        volume: data[last].data["1"].quote.USD.volume_24h,
        supply: data[last].data["1"].circulating_supply,
        max_supply: data[last].data["1"].max_supply,
        percent_change_24: data[last].data["1"].quote.USD.percent_change_24h
    }
    currentPrice.innerHTML += `<h1 class="h2">BTC ${parseInt(plotData.prices[last])}</h1>`
    marketCap.innerHTML += `<p>${currentData.marketCap}</p>`
    volume.innerHTML += `<p>${currentData.volume}</p>`
    supply.innerHTML += `<p>${currentData.supply}</p>`
    maxSupply.innerHTML += `<p>${currentData.max_supply}</p>`
    percent.innerHTML += `<p>${currentData.percent_change_24}</p>`
    console.log(parseInt(plotData.prices[last]));
    console.log(currentData);
    data = plotData;
    
    new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.timestamp,
          datasets: [{
            label: 'Price ($USD)',
            data: data.prices,
            borderWidth: 2,
            lineTension: 0,
            backgroundColor: 'transparent',
            borderColor: '#007bff',
            borderWidth: 4,
            pointBackgroundColor: '#007bff'
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
});

