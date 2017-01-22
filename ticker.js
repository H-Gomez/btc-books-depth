// Required packages
var request = require('request');
var WebSocket = require('ws');

// Global vars
const webSocket = new WebSocket('wss://api.bitfinex.com/ws/2');
const ob = {
    event: 'subscribe',
    channel: 'book',
    symbol: 'tBTCUSD',
    prec: 'P2'
};

var ticker = {};
var payload = JSON.stringify(ob);
var targetUrl = "https://api.bitfinex.com/v2/ticker/tBTCUSD";
var percentage = 5;

// Payloads
var payloadTicker = JSON.stringify({
    event: 'subscribe',
    channel: 'ticker',
    symbol: 'tBTCUSD'
});

function calculatePercent(price, percentage) {
    return ((price / 100) * percentage).toFixed(2);
}

// API work
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

        console.log(ticker);
    }
});
