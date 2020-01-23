const os = require('os');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bleaconSrc = (os.platform() == 'linux')? 'bleacon' : './bleacon-fake';
const bleacon = require(bleaconSrc);
const tilt = require('./tilt.js');
const cloud = require('./cloud.js');


const PORT = 3000;

var last_tilt_payload = {}

bleacon.on('discover', on_device_beacon);
bleacon.startScanning();

http.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
});

io.on('connection', () => {
    console.log('Client connected!');
});

function handle_tilt_payload(payload) {
    console.log(payload);
    io.emit('tilt-meas', JSON.stringify(payload));
    cloud.onPayload(payload);
    last_tilt_payload = payload
}

function on_device_beacon(bleacon) {
    const payload = tilt.fromBleacon(bleacon)
    handle_tilt_payload(payload)
}

function handle_tilt_post(req, res) {
    const payload = tilt.fromReq(req)
    handle_tilt_payload(payload)
    res.end("yes")
}

app.set('view engine', 'pug');

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'));

app.post('/tilt', (req, res) => handle_tilt_post(req, res))
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'beer-bot', tilt_payload: last_tilt_payload
    })
});
