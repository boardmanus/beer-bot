const os = require('os');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bleaconSrc = (os.platform() == 'linux')? 'bleacon' : './bleacon-fake';
const bleacon = require(bleaconSrc);
const Tilt = require('./tilt.js');
const tilt = new Tilt();
const cloud = require('./cloud.js');
const config = require('./config/config.json');

const PORT = 3000;

bleacon.on('discover', on_device_beacon);
bleacon.startScanning();

http.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
});

io.on('connection', () => {
    console.log('Client connected!', config.beer);
    io.emit('beer-details', JSON.stringify(config.beer));
});

function handle_tilt_payload(payload) {
    console.log(payload);
    io.emit('tilt-meas', JSON.stringify(payload));
    cloud.onPayload(payload);
    tilt.update(payload);
}

function on_device_beacon(bleacon) {
    handle_tilt_payload(Tilt.Payload.fromBleacon(bleacon));
}

function handle_tilt_post(req, res) {
    handle_tilt_payload(Tilt.Payload.fromReq(req));
    res.end("yes")
}

app.set('view engine', 'pug');

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'));

app.post('/tilt', (req, res) => handle_tilt_post(req, res))
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'beer-bot', tilt_payload: tilt.payload
    })
});
