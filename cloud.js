const config = require('./config/config.json');
const request = require('request');
const Utils = require('./utils.js');

const CLOUD_URL = config.cloud.url;
const CLOUD_REPORT_PERIOD_S = config.cloud.report_period_s;


function timestamp_to_googlesheettime(t) {
    return t/86400000.0 + 25568;
}

function payloadToCloud(payload) {

    const cloud = {
        Beer: config.beer.name,
        Temp: Utils.c_to_f(payload.ftemperature),
        SG: payload.fgravity,
        Color: payload.color,
        Comment: "",
        Timepoint: timestamp_to_googlesheettime(payload.timestamp)
    };

    return cloud;    
}


class Cloud {
    
    constructor() {
        this.lastReportedPayload = null;
    }

    reportToCloud(payload) {
        if (this.lastReportedPayload == null) {
            return true;
        }
        const dt = payload.timestamp / 1000.0 - this.lastReportedPayload.timestamp / 1000.0;
        return dt >= CLOUD_REPORT_PERIOD_S;
    }

    onPayload(payload) {

        if (this.reportToCloud(payload)) {
            this.lastReportedPayload = payload;
            const cloudData = payloadToCloud(payload);

            request.post(CLOUD_URL, {
                qs: cloudData,
                followAllRedirects: true 
            }, (error, res, body) => {
                if (error) {
                    console.error(error)
                    return
                }
                console.log(`statusCode: ${res.statusCode}`)
                console.log(body)
            });
        }
    }
}

module.exports = new Cloud();
