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
        this.temperature = temperature;
        this.gravity = gravity;
        this.rssi = rssi;

        const color = TILT_UUIDS[uuid];
        this.color = (color == null)? 'Invisible' : color;
    }

    static fromBleacon(bleacon) {
        return new TiltPayload(bleacon.uuid, bleacon.major, bleacon.minor/1000.0, bleacon.rssi);
    }

    static fromReq(req) {
        return new TiltPayload(req.uuid, req.temperature, req.gravity, req.rssi);
    }
};


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
        this.lastPayload = payload;
    }
    
}

module.exports = Tilt;
