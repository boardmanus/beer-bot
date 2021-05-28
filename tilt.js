const Utils = require('./utils.js');
const config = require('./config/config.json');


// Identifies the TILT Hydrometer available
const TILT_UUIDS = {
    "a495bb10c5b14b44b5121370f02d74de": "Red",
    "a495bb20c5b14b44b5121370f02d74de": "Green",
    "a495bb30c5b14b44b5121370f02d74de": "Black",
    "a495bb40c5b14b44b5121370f02d74de": "Purple",
    "a495bb50c5b14b44b5121370f02d74de": "Orange",
    "a495bb60c5b14b44b5121370f02d74de": "Blue",
    "a495bb70c5b14b44b5121370f02d74de": "Pink"
};


class TiltPayload {

    constructor(uuid, temperature, gravity, rssi) {
        // Build the payload by default
        this.uuid = uuid;
        this.timestamp = Date.now();
        this.temperature = Utils.f_to_c(temperature);
        this.ftemperature = this.temperature;
        this.gravity = gravity;
        this.fgravity = this.gravity;
        this.rssi = rssi;
        this.color = TILT_UUIDS[uuid];
    }

    static isValid(tilt) {
        return ((tilt.color != null)
            && (tilt.temperature < 100.0)
            && (tilt.temperature > 0.0)
            && (tilt.gravity < 1.200)
            && (tilt.gravity > 0.900));
    }

    static fromBleacon(bleacon) {
        return new TiltPayload(bleacon.uuid, bleacon.major, bleacon.minor/1000.0, bleacon.rssi);
    }

    static fromReq(req) {
        return new TiltPayload(req.uuid, req.temperature, req.gravity, req.rssi);
    }
};

const TEMPERATURE_RC = 60.0;
const GRAVITY_RC = 60.0;


class Tilt {

    constructor() {
        this.lastPayload = null;
    }

    get Payload() {
        return TiltPayload;
    }

    get payload() {
        return this.lastPayload;
    }

    update(payload) {

        if (this.lastPayload != null) {
            const dt = (payload.timestamp - this.lastPayload.timestamp)/1000.0;
            
            payload.ftemperature = Utils.low_pass_filter(
                payload.temperature, this.lastPayload.ftemperature, dt, TEMPERATURE_RC);
            
            payload.fgravity = Utils.low_pass_filter(
                payload.gravity, this.lastPayload.fgravity, dt, GRAVITY_RC);
        }
        this.lastPayload = payload;
    }
    
}

module.exports = Tilt;
