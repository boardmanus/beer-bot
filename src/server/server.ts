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
import * as bodyParser from 'body-parser';
import { Config } from './config';
import express, { Express, Request, Response } from 'express';

const SERVER_ADDRESS = beerbot_config?.server?.address ?? 'localhost';
const PORT = 3000;
const BEER_CONFIG_PATH = path.join(__dirname, 'config/beer_config.json');
const LCDd_ADDRESS = beerbot_config?.server?.LCDd ?? 'localhost';

type TiltRequest = Request<{
  uuid: string;
  temperature: number;
  gravity: number;
  rssi: number;
}>;

type BeerDetailsRequest = Request<{
  name: string;
  color_srm: number,
  og: number
}>;

function create_io_server(app: Express): https.Server | http.Server {
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

  server.listen(PORT, () => {
    console.log(`Beer-Bot listening on port ${PORT}!`);
  });

  return server;
}

function handle_tilt_payload(payload: TiltPayload) {
  const payloadJson = JSON.stringify(payload);
  tiltPayloadResponse?.write(`data: ${payloadJson}\n\n`);
  cloud.onPayload(payload);
  lcdproc.onPayload(payload);
}

function handle_get_root(_req: Request, res: Response) {
  res.render('index', { title: 'beer-bot' });
}

function handle_post_tilt_meas(req: TiltRequest, res: Response) {
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

function handle_req_beer_details(_req: Request, res: Response) {
  const beerJson = JSON.stringify(config.beer);
  console.log(`request-beer-details: ${beerJson}`);
  res.json(beerJson);
}

function handle_post_beer_details(req: BeerDetailsRequest, res: Response) {
  const beerJson = JSON.stringify(req.body);
  console.log(`handle-post-beer-details: ${beerJson}`);
  const beer = config.update(beerJson);
  cloud.onBeerChange(beer);
  res.json(JSON.stringify(beer));
}

function handle_sse_tilt_meas_connection(req: Request, res: Response) {
  console.log("handle-sse-tilt-meas-connection: connecting to client...");
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  tiltPayloadResponse = res;

  req.on('close', () => {
    console.log("Connection to client closed.");
    tiltPayloadResponse = null;
    res.end();
  });
}

const tilt = new Tilt(handle_tilt_payload);
const _beacon = new Beacon((payload) => tilt.handleTiltPayload(payload));
const lcdproc = new LcdProc(LCDd_ADDRESS);
const config = new Config(BEER_CONFIG_PATH);
const cloud = new Cloud(config);
let tiltPayloadResponse: Response | null = null;

const app: Express = express();
const server = create_io_server(app);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', handle_get_root);
app.post('/beer-details', handle_post_beer_details);
app.get('/beer-details', handle_req_beer_details)
app.post('/tilt-meas', handle_post_tilt_meas);
app.get('/tilt-meas', handle_sse_tilt_meas_connection)
