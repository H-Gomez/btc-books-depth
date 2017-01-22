// Required packages
var request = require('request');
var WebSocket = require('ws');

// Global vars
const ws = new WebSocket('wss://api.bitfinex.com/ws/2');
const ob = {
    event: 'subscribe',
    channel: 'book',
    symbol: 'tBTCUSD',
    prec: 'P2'
};
var payload = JSON.stringify(ob);
var targetUrl = "https://api.bitfinex.com/v2/ticker/tBTCUSD"
var books = [];
var percentage = 5;


function calculatePercent(price, percentage) {
    return (price / 100) * percentage;
}


var msg = JSON.stringify({
    event: 'subscribe',
    channel: 'ticker',
    symbol: 'tBTCUSD'
});

ws.on('open', function() {
    ws.send(msg);
});

ws.on('message', function(msg){
    var response = JSON.parse(msg);
    if (response.event) {
        console.log(msg)
    }
    else if (response[1] === "hb"){
        console.log("polling server...");
    }
    else {
        var p = JSON.parse(msg);
        var price = p[1][2];
        var downPercent = price - calculatePercent(price, percentage);

        console.log("BTC price: " + price + " 5% down: " + downPercent);
    }
});





//
//ws.onmessage = function(msg) {
//    console.log(msg.data);
//};
//
//// Subscribe to ticker.
//ws.on('open', function() {
//    ws.send(payload);
//});