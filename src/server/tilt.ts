import { TiltPayload } from '../common/tiltpayload';
import { LowPassFilter } from '../common/low_pass_filter';
import * as config from '../config/config.json';

type OnTiltPayload = (payload: TiltPayload) => void;

const LOGGING_RC = (config?.cloud?.report_period_s ?? 120.0) / 2.0;
const TEMPERATURE_RC = LOGGING_RC;
const GRAVITY_RC = LOGGING_RC;

class Tilt {
  private tFilter = new LowPassFilter(TEMPERATURE_RC);
  private gFilter = new LowPassFilter(GRAVITY_RC);
  private onTiltPayload: OnTiltPayload;

  constructor(onTiltPayload: OnTiltPayload) {
    this.tFilter = new LowPassFilter(TEMPERATURE_RC);
    this.onTiltPayload = onTiltPayload;
  }

  handleTiltPayload(payload: TiltPayload) {
    if (payload.isValid()) {
      payload.temperature = this.tFilter.update(
        payload.temperature,
        payload.timestamp
      );
      payload.gravity = this.gFilter.update(payload.gravity, payload.timestamp);

      this.onTiltPayload(payload);
    }
  }
}

export { Tilt };
