import * as beerbot_config from '../config/config.json';
import { LowPassFilter } from '../common/low_pass_filter';
import { Utils } from '../common/utils';
import { TiltPayload } from '../common/tiltpayload';
import * as request from 'needle';

const CLOUD_ENABLED = beerbot_config.cloud?.enabled ?? false;
const CLOUD_URL = beerbot_config.cloud?.url ?? '';
const CLOUD_REPORT_PERIOD_S = beerbot_config?.cloud?.report_period_s ?? 300.0;
const LOGGING_RC = (beerbot_config?.cloud?.report_period_s ?? 120.0) * 2.0;
const TEMPERATURE_RC = LOGGING_RC;
const GRAVITY_RC = LOGGING_RC;

function timestamp_to_googlesheettime(t: number) {
  return t / 86400.0 + 25568.0;
}

class Cloud {
  private beerName: string;
  private lastReportedPayload: TiltPayload | null;
  private tFilter = new LowPassFilter(TEMPERATURE_RC);
  private gFilter = new LowPassFilter(GRAVITY_RC);

  constructor(beerName = 'Unnamed Beer') {
    this.beerName = beerName;
    this.lastReportedPayload = null;
  }

  reportToCloud(payload: TiltPayload) {
    if (!CLOUD_ENABLED) {
      return false;
    }

    if (this.lastReportedPayload == null) {
      return true;
    }
    const dt = payload.timestamp - this.lastReportedPayload.timestamp;
    return dt >= CLOUD_REPORT_PERIOD_S;
  }

  onBeerChange(beerName: string) {
    if (beerName !== this.beerName) {
      this.beerName = beerName;
      this.lastReportedPayload = null;
    }
  }

  onPayload(payload: TiltPayload) {
    const cloudData = this.payloadToCloud(this.beerName, payload);
    if (this.reportToCloud(payload)) {
      this.lastReportedPayload = payload;

      request.post(
        CLOUD_URL,
        cloudData,
        {
          follow_max: 5
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

  payloadToCloud(beer: string, payload: TiltPayload) {
    const cloud = {
      Beer: beer,
      Temp: Utils.c_to_f(this.tFilter.update(payload.temperature, payload.timestamp)),
      SG: this.gFilter.update(payload.gravity, payload.timestamp),
      Color: payload.color,
      Comment: '',
      Timepoint: timestamp_to_googlesheettime(payload.timestamp)
    };
    return cloud;
  }
}

export { Cloud };
