const config = require("./config/config.json");


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

const tilt = {
    fromBleacon: function(bleacon) {

        if (TILT_UUIDS[bleacon.uuid] == null) {
            return {};
        }

        // Assigns the device label based on the TILT identified
        const color = TILT_UUIDS[bleacon.uuid];

        // Build the payload by default
        const payload = {
            "uuid": bleacon.uuid,
            "color": color,
            "timestamp": Date.now(),
            "temperature": bleacon.major,
            "gravity": bleacon.minor/1000.0,
            "rssi": bleacon.rssi
        };

        return payload;
    },
    
    fromReq: function(req) {
        
        const payload = {
            "uuid": req.body.uuid || Object.keys(TILT_UUIDS)[0],
            "color": TILT_UUIDS[req.body.uuid],
            "timestamp": Date.now(),
            "temperature": req.body.temperature || 19,
            "gravity": req.body.gravity*1000 || 1000,
            "rssi": req.body.rssi || -41
        }
        
        return payload;
    },

    toCloud: function(payload) {

        const googleSheetTime = payload.timestamp/86400000.0 + 25568;

        const cloud = {
            "Beer": config.beer.name,
            "Temp": payload.temperature,
            "SG": payload.gravity,
            "Color": payload.color,
            "Comment": "",
            "Timepoint": googleSheetTime
        };

        return cloud;
    }
}

module.exports = tilt;
