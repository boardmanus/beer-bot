function c_to_f(c) {
    return c * 9.0 / 5.0 + 32
}

class Bleacon {

    constructor() {
        this.uuid = 'a495bb40c5b14b44b5121370f02d74de';
        this.major = c_to_f(21.1); // temperature
        this.minor = 1060.0; // gravity
        this.rssi = 30;
        this.callbacks = {};

        // Todo - automatically connect to a 
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    startScanning() {
        const discover = this.callbacks['discover'];
        setInterval(() => {
            if (this.minor > 1001.0) {
                this.minor -= 0.1;
                this.major += (Math.random() - 0.5)*0.05;
            }
            if (discover) {
                discover(this);
            } 
        }, 1000);
    }
}

module.exports = new Bleacon();