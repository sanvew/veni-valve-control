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

/*
  HTTP server setup
*/
const httpServer = http.createServer(function(req, res) {
  if (ALLOWED_HOSTS.includes(req.headers.host)) {
    fs.readFile('index.html', function(err, data) {
      console.log(`Handled request from ${req.headers.host}`);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      // serialPort.write(Buffer.from('test\n', 'ascii'), function(err) {
      //   if (err) console.error(`Error: ${err.message}`);
      //   console.log('message written');
      // });
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
  });
  // serialPort.write('test\n', function(err) {
  //   if (err) console.error(`Error: ${err.message}`);
  //   console.log('message written');
  // });
});


/*
 WebSocket setup
*/
const wsServer = new WebSocketServer({httpServer});
wsServer.on('request', function(request) {
  console.log('Websocket client connected!');
  const connection = request.accept(null, request.origin);
  connection.on('message', function(message) {
    console.log(message.utf8Data);
    serialPort.write('0:toggle');
  });
});
