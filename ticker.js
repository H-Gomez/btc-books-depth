// Required packages
const request = require('request');
const WebSocket = require('ws');

// Global vars
const wsUrl = 'wss://api.bitfinex.com/ws/2';
const restUrl = 'https://api.bitfinex.com/v2/book/tBTCUSD/P2?len=100';
const percentage = 5;
var ticker = { };
var tickerSnapshot = { };
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
var webSocket = new WebSocket(wsUrl);

webSocket.on('open', function() {
    webSocket.send(payloadTicker);
});

webSocket.on('message', function(data) {
    var response = JSON.parse(data);

    if (response.event) {
        console.log(response);
    }
    else if (response[1] === 'hb') {
        console.log('polling server...');
    }
    else {
        ticker.bid = response[1][0];
        ticker.ask =response[1][2];
        ticker.price = response[1][6];
        ticker.lowerPercentage = ticker.price - calculatePercent(ticker.price, percentage);
        ticker.upperPercentage = parseInt(ticker.price) + parseInt(calculatePercent(ticker.price, percentage));
        ticker.orders = { };

        sumOrders(ticker.orders, function() {
            console.log("Price: $" + ticker.price);
            console.log("Bids 5%: " + ticker.orders.bidSum + " | " + "Asks 5%: " + ticker.orders.askSum);
            console.log('Bids: $' + ticker.orders.bidDollarValue.toLocaleString());
            console.log('Asks: $' + ticker.orders.askDollarValue.toLocaleString());
            console.log("---------------------"); // divider for more readable output
        });
    }
});

// REST Work - Poll the api for order book data.
function sumOrders(tickerOrders, callback) {
    request(restUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var orders = JSON.parse(body);
            tickerOrders.bidSum = 0;
            tickerOrders.askSum = 0;

            // Sum orders up to the percentage price difference. (5%)
            orders.forEach(function(order) {
                if (order[0] < ticker.price && order[0] > ticker.lowerPercentage) {
                    tickerOrders.bidSum += parseInt(order[2]);
                } else if (order[0] > ticker.price && order[0] < ticker.upperPercentage) {
                    tickerOrders.askSum -= parseInt(order[2]);
                }
            });

            tickerOrders.bidDollarValue = convertCurrency(ticker.price, tickerOrders.bidSum);
            tickerOrders.askDollarValue = convertCurrency(ticker.price, tickerOrders.askSum);

            callback();
        }
    });
}
