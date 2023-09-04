import * as config from 'config/config.json';
import { Utils } from 'common/utils';
import { TiltPayload } from 'common/tiltpayload';
import * as request from 'request';

const CLOUD_ENABLED = config.cloud?.enabled ?? false;
const CLOUD_URL = config.cloud?.url ?? '';
const CLOUD_REPORT_PERIOD_S = cloud_report_period_s();

function cloud_report_period_s() {
  if (config.cloud?.report_period_s) {
    return parseInt(config.cloud.report_period_s);
  }
  return 300;
}

function timestamp_to_googlesheettime(t: number) {
  return t / 86400000.0 + 25568.0;
}

function payloadToCloud(payload: TiltPayload) {
  const cloud = {
    Beer: config.beer?.name ?? 'Beer',
    Temp: Utils.c_to_f(payload.ftemperature),
    SG: payload.fgravity,
    Color: payload.color,
    Comment: '',
    Timepoint: timestamp_to_googlesheettime(payload.timestamp)
  };

  return cloud;
}

class Cloud {
  lastReportedPayload: TiltPayload | null;

  constructor() {
    this.lastReportedPayload = null;
  }

  reportToCloud(payload: TiltPayload) {
    if (!CLOUD_ENABLED) {
      return false;
    }

    if (this.lastReportedPayload == null) {
      return true;
    }
    const dt =
      payload.timestamp / 1000.0 - this.lastReportedPayload.timestamp / 1000.0;
    return dt >= CLOUD_REPORT_PERIOD_S;
  }

  onPayload(payload: TiltPayload) {
    if (this.reportToCloud(payload)) {
      this.lastReportedPayload = payload;
      const cloudData = payloadToCloud(payload);

      request.post(
        CLOUD_URL,
        {
          qs: cloudData,
          followAllRedirects: true
        },
        (error, res, body) => {
          if (error) {
            console.error(error);
            return;
          }
          console.log(`statusCode: ${res.statusCode}`);
          console.log(body);
        }
      );
    }
  }
}

export const cloud = new Cloud();
