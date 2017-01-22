// Required packages
const request = require('request');
const WebSocket = require('ws');

// Global vars
const wsUrl = 'wss://api.bitfinex.com/ws/2';
const restUrl = 'https://api.bitfinex.com/v2/book/tBTCUSD/P2?len=100';
const percentage = 5;
var ticker = { };
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

        console.log("Price: $" + ticker.price);
        sumOrders();
    }
});

// REST Work - Poll the api for order book data.
function sumOrders() {
    request(restUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var orders = JSON.parse(body);
            var bidSum = 0;
            var askSum = 0;

            orders.forEach(function(order) {
                if (order[0] < ticker.price && order[0] > ticker.lowerPercentage) {
                    bidSum += parseInt(order[2]);
                } else if (order[0] > ticker.price && order[0] < ticker.upperPercentage) {
                    askSum -= parseInt(order[2]);
                }
            });

            var bidDollarValue = convertCurrency(ticker.price, bidSum);
            var askDollarValue = convertCurrency(ticker.price, askSum);

            console.log("Bids 5%: " + bidSum + " | " + "Asks 5%: " + askSum);
            console.log('Bids: $' + bidDollarValue.toLocaleString());
            console.log('Asks: $' + askDollarValue.toLocaleString());
            console.log("---------------------"); // divider for more readable output
        }
    });
}
