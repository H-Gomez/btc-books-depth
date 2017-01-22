// Required packages
const request = require('request');
const WebSocket = require('ws');

// Global vars
const webSocket = new WebSocket('wss://api.bitfinex.com/ws/2');
//const ob = {
//    event: 'subscribe',
//    channel: 'book',
//    symbol: 'tBTCUSD',
//    prec: 'P2'
//};

var ticker = { };
var targetUrl = "https://api.bitfinex.com/v2/book/tBTCUSD/P2?len=100";
var percentage = 5;

// Payloads
var payloadTicker = JSON.stringify({
    event: 'subscribe',
    channel: 'ticker',
    symbol: 'tBTCUSD'
});

// Helper functions
function calculatePercent(price, percentage) {
    return ((price / 100) * percentage).toFixed(2);
}

function convertCurrency(price, sumOfOrders) {
    return price * sumOfOrders.toFixed(2);
}

// WebSocket Work - Subscribe to the ticker channel for price updates.
webSocket.on('open', function() {
    webSocket.send(payloadTicker);
});

webSocket.on('message', function(msg) {
    var response = JSON.parse(msg);

    if (response.event) {
        console.log(response);
    }
    else if (response[1] === "hb") {
        console.log("polling server...");
    }
    else {
        ticker.bid = response[1][0];
        ticker.ask =response[1][2];
        ticker.price = response[1][6];
        ticker.down5 = ticker.price - calculatePercent(ticker.price, percentage);
        ticker.up5 = parseInt(ticker.price) + parseInt(calculatePercent(ticker.price, percentage));

        console.log("Price: $" + ticker.price);
        sumOrders();
    }
});

// REST Work - Poll the api for order book data.
function sumOrders() {
    request(targetUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var orders = JSON.parse(body);
            var bidSum = 0;
            var askSum = 0;

            for (var i = 0; i < orders.length; i++) {
                if(orders[i][0] < ticker.price && orders[i][0] > ticker.down5) {
                    bidSum += parseInt(orders[i][2], 10);
                }
                else if (orders[i][0] > ticker.price && orders[i][0] < ticker.up5) {
                    askSum -= parseInt(orders[i][2], 10);
                }
            }

            console.log("Bids 5%: " + bidSum + " | " + "Asks 5%: " + askSum);

            var bidDollarValue = convertCurrency(ticker.price, bidSum);
            var askDollarValue = convertCurrency(ticker.price, askSum);
            console.log('Bids: $' + bidDollarValue.toLocaleString());
            console.log('Asks: $' + askDollarValue.toLocaleString());
            console.log("---------------------");
        }
    });
}
