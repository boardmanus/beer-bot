const os = require('os');
const fs = require('fs');
const express = require('express');
const app = express();
const bleacon = require('./bleacon-fake.js');
const Tilt = require('./tilt.js');
const tilt = new Tilt();
const cloud = require('./cloud.js');
const config = require('./config/config.json');

const PORT = 3000;

bleacon.on('discover', on_device_beacon);
bleacon.startScanning();

var server;
if (config.server.useHttps) {
    const httpsOpts = {
        key: fs.readFileSync('./config/key.pem'),
        cert: fs.readFileSync('./config/cert.pem')
    };

    const https = require('https');
    server = https.createServer(httpsOpts, app);
}
else {
    const http = require('http');
    server = http.createServer(app);
}

const io = require('socket.io')(server);

server.listen(PORT, () => {
    console.log(`Beer-Bot listening on port ${PORT}!`)
});

io.on('connection', () => {
    console.log('Client connected!', config.beer);
    io.emit('beer-details', JSON.stringify(config.beer));
});

io.on('update-details', (msg) => {
    const deets = JSON.parse(msg);
    console.log(`update-details:`, deets);
});

function handle_tilt_payload(payload) {
    if (tilt.Payload.isValid(payload)) {
        tilt.update(payload);
        io.emit('tilt-meas', JSON.stringify(tilt.payload));
        cloud.onPayload(tilt.payload);
    }
    else {
        console.log("Invalid payload:", payload);
    }
}

function on_device_beacon(bleacon) {
    handle_tilt_payload(tilt.Payload.fromBleacon(bleacon));
}

function handle_tilt_post(req, res) {
    handle_tilt_payload(tilt.Payload.fromReq(req));
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
