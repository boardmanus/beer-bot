const config = require('./config/config.json');
const tilt = require('./tilt.js');
const request = require('request');

class Cloud {
    
    static get CLOUD_URL() {
        return config.cloud.url;
    }

    static get CLOUD_REPORT_PERIOD_S() {
        return 30;
    }

    constructor() {
        this.lastPayload = null;
    }

    reportToCloud(payload) {
        if (this.lastPayload == null) {
            return true;
        }
        const dt = payload.timestamp / 1000.0 - this.lastPayload.timestamp / 1000.0;
        return dt >= Cloud.CLOUD_REPORT_PERIOD_S;
    }

    onPayload(payload) {

        if (this.reportToCloud(payload)) {
            this.lastPayload = payload;
            const cloudData = tilt.toCloud(payload);

            request.post(Cloud.CLOUD_URL, {
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