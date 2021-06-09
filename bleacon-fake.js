const Utils = require('./utils.js');
const config = require('./config/config.json');

if (!config.debug.fakebleacon) {
    const Bleacon = require('bleacon');
    module.exports = new Bleacon();
}
else {

    const START_TEMPERATURE = 21.1;
    const START_GRAVITY = 1.100;
    const NOISE_TEMPERATURE = 2.0;
    const NOISE_GRAVITY = 0.020;


    class Reading {
        constructor() {
            this.temperature = START_TEMPERATURE;
            this.gravity = START_GRAVITY;
        }

        update(t) {
            this.temperature = START_TEMPERATURE + 4.0 * Math.sin((t / 1000 % 3600) * 6.28);
            if (this.gravity > 1.000) {
                this.gravity -= 0.0001;
            }
        }
    }


    class Bleacon {

        constructor() {
            this.reading = new Reading();
            this.uuid = 'a495bb40c5b14b44b5121370f02d74de';
            this.major = Utils.c_to_f(this.reading.temperature);
            this.minor = this.reading.gravity * 1000.0;
            this.rssi = 30;
            this.callbacks = {};
        }

        on(event, callback) {
            this.callbacks[event] = callback;
        }

        startScanning() {
            const discover = this.callbacks['discover'];
            setInterval(() => {
                this.reading.update(new Date().getTime());
                this.minor = 1000.0 * (this.reading.gravity + Utils.noise(NOISE_GRAVITY));
                this.major = Utils.c_to_f(this.reading.temperature + Utils.noise(NOISE_TEMPERATURE));

                if (discover) {
                    discover(this);
                }
            }, 1000);
        }
    }
    module.exports = new Bleacon();
}
