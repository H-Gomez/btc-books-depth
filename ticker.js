// Required packages
const request = require('request');
const WebSocket = require('ws');

// Global vars
const wsUrl = 'wss://api.bitfinex.com/ws/2';
const restUrl = 'https://api.bitfinex.com/v2/book/tBTCUSD/P2?len=100';
const percentage = 10;
var ticker = {};
var tickerSnapshot = {};
var payloadTicker = JSON.stringify({
    event: 'subscribe',
    channel: 'ticker',
    symbol: 'tBTCUSD'
});

/**
 * Calculates the percentage of one value from another and returns it as a string fixed to 2 decimals places.
 * @param {number} price
 * @param {number} percentage
 */
function calculatePercent(price, percentage) {
    return ((price / 100) * percentage);
}

/**
 * Converts a number to a human readble currency value.
 * @param {number} price
 * @param {array} sumOfOrders
 */
function convertCurrency(price, sumOfOrders) {
    return price * sumOfOrders.toFixed(2);
}

// WebSocket Work - Subscribe to the ticker channel for price updates.
var webSocket = new WebSocket(wsUrl);
webSocket.on('open', function() {
    webSocket.send(payloadTicker);
});

/**
 * The main websocket subscriber to the API. Outputs to console.
 */
webSocket.on('message', function(data) {
    var response = JSON.parse(data);

    if (response.event) {
        console.log(response);
    } else if (response[1] === 'hb') {
        console.log('polling server...');
    } else {
        ticker.bid = response[1][0];
        ticker.ask = response[1][2];
        ticker.price = response[1][6];
        ticker.lowerPercentage = ticker.price - calculatePercent(ticker.price, percentage);
        ticker.upperPercentage = parseInt(ticker.price) + (calculatePercent(ticker.price, percentage));
        ticker.orders = {};

        sumOrders(ticker.orders, function() {
            console.log(`Price: $ ${ticker.price}`);
            console.log(`Bids 10%: ${ticker.orders.bidSum} ($${ticker.orders.bidDollarValue.toLocaleString()})`);
            console.log(`Asks 10%: ${ticker.orders.askSum} ($${ticker.orders.askDollarValue.toLocaleString()})`);
            console.log('---------------------'); // divider for more readable output
        });
    }
});

/**
 * Calculates the bid/ask depth at a percentage distance from the current price.
 * @param {object} tickerOrders
 * @param {function} callback
 */
function sumOrders(tickerOrders, callback) {
    request(restUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var orders = JSON.parse(body);
            tickerOrders.bidSum = 0;
            tickerOrders.askSum = 0;

            // Sum orders up to the percentage price difference.
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

module.exports = {
    convertCurrency: convertCurrency,
    calculatePercent: calculatePercent
};
