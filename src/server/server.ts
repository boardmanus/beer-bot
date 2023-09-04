import { Tilt } from './tilt';
import { cloud } from './cloud';
import { LcdProc } from './lcdproc';
import * as Beacon from './beacon';
import * as config from 'config/config.json';
import { TiltPayload } from 'common/tiltpayload';

import * as fs from 'fs';
import path from 'path';
import * as https from 'https';
import * as http from 'http';
import { Server } from 'socket.io';
import express from 'express';
const app = express();

const PORT = 3000;

const tilt = new Tilt();
const lcdproc = new LcdProc(config?.server?.LCDd ?? 'localhost');

Beacon.beaconScanner.onadvertisement = on_device_beacon;

Beacon.beaconScanner
  .startScan()
  .then(() => {
    console.log('Started to scan.');
  })
  .catch((error: unknown) => {
    console.error(error);
  });

let server: https.Server | http.Server;
if (config?.server?.useHttps) {
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

io.on('update-details', (msg: string) => {
  const deets = JSON.parse(msg);
  console.log(`update-details:`, deets);
});

function handle_tilt_payload(payload: TiltPayload) {
  if (payload.isValid()) {
    tilt.update(payload);
    io.emit('tilt-meas', JSON.stringify(tilt.payload));
    cloud.onPayload(tilt.payload);
    lcdproc.onPayload(tilt.payload);
  } else {
    console.log('Invalid payload:', payload);
  }
}

function on_device_beacon(advertisement: Beacon.Beacon) {
  handle_tilt_payload(Beacon.toTiltPayload(advertisement));
}

function handle_tilt_post(req: any, res: any) {
  handle_tilt_payload(
    new TiltPayload(req.uuid, req.temperature, req.gravity, req.rssi)
  );
  res.end('yes');
}

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

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
