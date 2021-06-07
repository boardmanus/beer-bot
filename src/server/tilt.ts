import { Utils } from '../common/utils';
import { TiltPayload } from '../common/tiltpayload';

const TEMPERATURE_RC = 60.0;
const GRAVITY_RC = 60.0;

class Tilt {
  lastPayload: TiltPayload;

  constructor() {
    this.lastPayload = null;
  }

  get payload(): TiltPayload {
    return this.lastPayload;
  }

  update(payload: TiltPayload): TiltPayload {
    if (this.lastPayload != null) {
      const dt = (payload.timestamp - this.lastPayload.timestamp) / 1000.0;

      payload.ftemperature = Utils.low_pass_filter(
        payload.temperature,
        this.lastPayload.ftemperature,
        dt,
        TEMPERATURE_RC
      );

      payload.fgravity = Utils.low_pass_filter(
        payload.gravity,
        this.lastPayload.fgravity,
        dt,
        GRAVITY_RC
      );
    }
    this.lastPayload = payload;
    return payload;
  }
}

export { Tilt };
