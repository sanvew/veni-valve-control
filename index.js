const http = require('http');
const fs = require('fs');
const WebSocketServer = require('websocket').server;
const gpio = require('onoff').Gpio;
const pin = new gpio(4, 'out');

const SERVER_PORT = 8080;
// allowed hosts workaround
const ALLOWED_HOSTS = [
  `localhost:${SERVER_PORT}`,
  `127.0.0.1:${SERVER_PORT}`,
  `192.168.1.200:${SERVER_PORT}`,
];

const httpServer = http.createServer(function(req, res) {
  if (ALLOWED_HOSTS.includes(req.headers.host)) {
    fs.readFile('index.html', function(err, data) {
      console.log(`Handled request from ${req.headers.host}`);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      return res.end();
    });
  } else {
    console.log(`Bad origin host: ${req.headers.host}! Access denied!`);
  }
});
httpServer.listen(SERVER_PORT, function() {
  console.log(`Server started at port ${SERVER_PORT}!`);
});

const wsServer = new WebSocketServer({httpServer});
wsServer.on('request', function(request) {
  console.log('Websocket client connected!');
  const connection = request.accept(null, request.origin);
  connection.on('message', function(message) {
    curVal = message;
    if (curVal != pin.readSync()) {
      pin.writeSync(1);
    }
    console.log(message.utf8Data);
  });
});
