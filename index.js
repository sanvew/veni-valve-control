const http = require('http');
const fs = require('fs');
const WebSocketServer = require('websocket').server;
const SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');

/*
  Constants
*/
const SERVER_PORT = 8080;
// allowed hosts workaround
const ALLOWED_HOSTS = [
  `localhost:${SERVER_PORT}`,
  `127.0.0.1:${SERVER_PORT}`,
  `rpi-veni000:${SERVER_PORT}`,
];
const SERIAL_PORT = '/dev/ttyACM0';
const SERIAL_BAUD_RATE = 9600;

const valvesState = {
  valve0: 'close',
  valve1: 'close',
};

/*
  HTTP server setup
*/
const httpServer = http.createServer(function(req, res) {
  if (ALLOWED_HOSTS.includes(req.headers.host)) {
    fs.readFile('index.html', function(err, data) {
      // console.log(`Handled request from ${req.headers.host}`);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      return res.end();
    });
  } else {
    console.error(`Bad origin host: ${req.headers.host}! Access denied!`);
  }
});
httpServer.listen(SERVER_PORT, function() {
  console.log(`Http server started at port ${SERVER_PORT}`);
});

/*
  SerialPort setup
*/
const serialPort = new SerialPort(SERIAL_PORT,
    {
      baudRate: SERIAL_BAUD_RATE,
      autoOpen: false,
    },
);
serialPort.open(function(err) {
  if (err) {
    return console.error(`Error opening serial port: ${err.message}`);
  }
  console.log(`Serial port opened at ${SERIAL_PORT}`);

  const lineStream = serialPort.pipe(new ReadLine({
    delimiter: '\r\n',
    encoding: 'utf8',
  }));
  lineStream.on('data', function(data) {
    console.log(`${SERIAL_PORT}: IN: ${data}`);
    if (/^\d+?:(open|close)$/.test(data)) {
      valvesState[`valve${data.match(/\d+?/)[0]}`] =
        data.match(/(open|close)$/)[0];
      console.log('Valves state:', valvesState);
      notifyWsClients();
    }
  });
});


/*
 WebSockets setup
*/
const wsClients = new Set();
const wsServer = new WebSocketServer({httpServer});
wsServer.on('request', function(request) {
  // TODO: add id for ws client
  // let clientCounter = 0;
  const connection = request.accept(null, request.origin);
  wsClients.add(connection);

  // send initial states
  connection.send(JSON.stringify(valvesState));

  connection.on('message', function(message) {
    console.log(`WsClient sent data: ${message.utf8Data}`);
    const msg = JSON.parse(message.utf8Data);
    for (key of Object.keys(msg)) {
      if (/^valve\d+?$/.test(key)) {
        // extract valve number
        valveNum = key.match(/\d+?$/)[0];
        serialData = `${valveNum}:${msg[key]}`;
        console.log(`${SERIAL_PORT}: OUT: ${serialData}`);
        serialPort.write(serialData);
      }
    }
  });
});

function notifyWsClients() {
  // publish updated states
  for (const client of wsClients) {
    client.send(JSON.stringify(valvesState));
  }
}
