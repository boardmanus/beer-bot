import { Tilt } from './tilt';
import { Cloud } from './cloud';
import { Beacon } from './beacon';
import { LcdProc } from './lcdproc';
import * as beerbot_config from '../config/config.json';
import { TiltPayload } from '../common/tiltpayload';

import * as fs from 'fs';
import path from 'path';
import * as https from 'https';
import * as http from 'http';
import { Config, Beer } from 'config';
import { Server, Socket } from 'socket.io';
import express, { Express, Request, Response } from 'express';

const PORT = 3000;
const BEER_CONFIG_PATH = path.join(__dirname, 'config/beer_config.json');
const LCDd_ADDRESS = beerbot_config?.server?.LCDd ?? 'localhost';

type TiltRequest = Request<{
  uuid: string;
  temperature: number;
  gravity: number;
  rssi: number;
}>;

function create_io_server(app: Express): Server {
  let server: https.Server | http.Server;
  if (beerbot_config?.server?.useHttps) {
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

  return io;
}

function handle_tilt_payload(payload: TiltPayload) {
  io.emit('tilt-meas', JSON.stringify(payload));
  cloud.onPayload(payload);
  lcdproc.onPayload(payload);
}

function handle_post_tilt(req: TiltRequest, res: Response) {
  handle_tilt_payload(
    new TiltPayload(
      req.params.uuid,
      req.params.temperature,
      req.params.gravity,
      req.params.rssi
    )
  );
  res.end('yes');
}

function handle_get_root(_req: Request, res: Response) {
  res.render('index', { title: 'beer-bot' });
}

function handle_beer_change(beer: Beer) {
  io.emit('beer-details', JSON.stringify(beer));
  cloud.onBeerChange(beer);
}

const tilt = new Tilt(handle_tilt_payload);
const _beacon = new Beacon((payload) => tilt.handleTiltPayload(payload));
const lcdproc = new LcdProc(LCDd_ADDRESS);
const config = new Config(BEER_CONFIG_PATH);
const cloud = new Cloud(config);

const app: Express = express();
const io = create_io_server(app);

io.on('connection', (socket: Socket) => {
  console.log('Client connected!');
  config.registerOnChange(handle_beer_change);
  socket.on('update-details', (beerJson: string) => {
    const beer = config.update(beerJson);
    console.log(`update-details:`, beer);
  });
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/tilt', handle_post_tilt);
app.get('/', handle_get_root);
