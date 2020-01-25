const config = require('./config/config.json');
const request = require('request');

const CLOUD_URL = config.cloud.url;
const CLOUD_REPORT_PERIOD_S = config.cloud.report_period_s;

function payloadToCloud(payload) {

    const googleSheetTime = this.timestamp/86400000.0 + 25568;

    const cloud = {
        "Beer": config.beer.name,
        "Temp": this.temperature,
        "SG": this.gravity,
        "Color": this.color,
        "Comment": "",
        "Timepoint": googleSheetTime
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
