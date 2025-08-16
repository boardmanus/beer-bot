import * as beerbot_config from '../config/config.json';
import { Config, Beer } from './config';
import { Utils } from '../common/utils';
import { TiltPayload } from '../common/tiltpayload';
import * as request from 'needle';

const CLOUD_ENABLED = beerbot_config.cloud?.enabled ?? false;
const CLOUD_URL = beerbot_config.cloud?.url ?? '';
const CLOUD_REPORT_PERIOD_S = beerbot_config?.cloud?.report_period_s ?? 300.0;

function timestamp_to_googlesheettime(t: number) {
  return t / 86400.0 + 25568.0;
}

function payloadToCloud(beer: string, payload: TiltPayload) {
  const cloud = {
    Beer: beer,
    Temp: Utils.c_to_f(payload.temperature),
    SG: payload.gravity,
    Color: payload.color,
    Comment: '',
    Timepoint: timestamp_to_googlesheettime(payload.timestamp)
  };
  return cloud;
}

class Cloud {
  config: Config;
  beerName: string;
  lastReportedPayload: TiltPayload | null;

  constructor(config: Config) {
    this.config = config;
    this.beerName = config.beer.name ?? 'Unnamed Beer';
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

  onBeerChange(beer: Beer) {
    if (beer.name !== this.beerName) {
      this.beerName = beer.name;
      this.lastReportedPayload = null;
    }
  }

  onPayload(payload: TiltPayload) {
    if (this.reportToCloud(payload)) {
      this.lastReportedPayload = payload;
      const cloudData = payloadToCloud(this.beerName, payload);

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
}

export { Cloud };
