const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const server = http.createServer();
const wsServer = new WebSocket.Server({
    noServer: true,
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3,
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        clientMaxWindowBits: 10,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 10
    },
    maxPayload: 0
});
const wsClient = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
var connectionPool = {};

wsClient.on("open", function open() {});
wsClient.on("message", function incoming(data) {
    Object.keys(connectionPool).forEach(function (prop) {
        connectionPool[prop].send(data);
    });
});

wsServer.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wsServer.on('connection', function connection(ws) {
    // add ws handle to websocket list.
    ws.id = wsServer.getUniqueID();
    connectionPool[ws.id] = ws;

    ws.on("close", function close() {
        delete connectionPool[ws.id];
        console.log("[" + ws.id + "] has been disconnected, Total No of Connection pool : " + Object.keys(connectionPool).length);
    });
});

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/ws/!miniTicker@arr') {
        wsServer.handleUpgrade(request, socket, head, function done(ws) {
            wsServer.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});
console.log("Websocket port for ticker : 19443");
server.listen(19443);
