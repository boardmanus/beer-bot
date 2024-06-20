import { Utils } from '../common/utils';
import { TiltPayload } from '../common/tiltpayload';
import { Beacon } from './beacon';

const TEMPERATURE_RC = 60.0;
const GRAVITY_RC = 60.0;

type OnTiltPayload = (payload: TiltPayload) => void;

class Tilt {
  private lastPayload: TiltPayload | null;
  private onTiltPayload: OnTiltPayload;
  private _tiltBeacon: Beacon;

  constructor(onTiltPayload: OnTiltPayload) {
    this.onTiltPayload = onTiltPayload;
    this._tiltBeacon = new Beacon((payload: TiltPayload) => {
      this.handleTiltPayload(payload);
    });
    this.lastPayload = null;
  }

  uploadTiltPayload(payload: TiltPayload) {
    if (payload.isValid() && this.lastPayload != null) {
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
    return payload;
  }

  private handleTiltPayload(payload: TiltPayload) {
    payload = this.uploadTiltPayload(payload);
    if (payload.isValid()) {
      this.lastPayload = payload;
      this.onTiltPayload(payload);
    }
  }
}

export { Tilt };
