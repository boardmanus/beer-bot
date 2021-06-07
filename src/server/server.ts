import * as fs from 'fs';
import path from 'path';
import * as https from 'https';
import * as http from 'http';
import { Server } from 'socket.io';
import express from 'express';
const app = express();

import bleacon from './bleacon-fake';

import { Tilt } from './tilt';
const tilt = new Tilt();

import { cloud } from './cloud';
import * as config from '../../config/config.json';
import { TiltPayload } from '../common/tiltpayload';

const PORT = 3000;

bleacon.on('discover', on_device_beacon);
bleacon.startScanning();

let server: any;
if (config.server.useHttps) {
  const httpsOpts = {
    key: fs.readFileSync('./config/key.pem'),
    cert: fs.readFileSync('./config/cert.pem')
  };

  server = https.createServer(httpsOpts, app);
} else {
  server = http.createServer(app);
}

const io = new Server(server);

server.listen(PORT, () => {
  console.log(`Beer-Bot listening on port ${PORT}!`);
});

io.on('connection', () => {
  console.log('Client connected!', config.beer);
  io.emit('beer-details', JSON.stringify(config.beer));
});

io.on('update-details', (msg: any) => {
  const deets = JSON.parse(msg);
  console.log(`update-details:`, deets);
});

function handle_tilt_payload(payload: TiltPayload) {
  if (tilt.Payload.isValid(payload)) {
    tilt.update(payload);
    io.emit('tilt-meas', JSON.stringify(tilt.payload));
    cloud.onPayload(tilt.payload);
  } else {
    console.log('Invalid payload:', payload);
  }
}

function on_device_beacon(bleacon: any) {
  handle_tilt_payload(tilt.Payload.fromBleacon(bleacon));
}

function handle_tilt_post(req: any, res: any) {
  handle_tilt_payload(tilt.Payload.fromReq(req));
  res.end('yes');
}

app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/tilt', (req: any, res: any) => handle_tilt_post(req, res));
app.get('/', (req: any, res: any) => {
  res.render('index', {
    title: 'beer-bot',
    tilt_payload: tilt.payload
  });
});
