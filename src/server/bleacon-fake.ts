import { Utils } from '../common/utils';
import * as config from '../../config/config.json';

let Bleacon: any;
if (!config.debug.fakeBleacon) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Bleacon_ = require('bleacon');
  Bleacon = new Bleacon_();
} else {
  const START_TEMPERATURE = 21.1;
  const START_GRAVITY = 1.1;
  const NOISE_TEMPERATURE = 2.0;
  const NOISE_GRAVITY = 0.02;

  class Reading {
    temperature: number;
    gravity: number;

    constructor() {
      this.temperature = START_TEMPERATURE;
      this.gravity = START_GRAVITY;
    }

    update(t: number) {
      this.temperature =
        START_TEMPERATURE + 4.0 * Math.sin(((t / 1000) % 3600) * 6.28);
      if (this.gravity > 1.0) {
        this.gravity -= 0.0001;
      }
    }
  }

  type BleaconCallback = (p: any) => void;

  class Bleacon_ {
    reading: Reading;
    uuid: string;
    major: number;
    minor: number;
    rssi: number;
    callbacks: { [name: string]: BleaconCallback };

    constructor() {
      this.reading = new Reading();
      this.uuid = 'a495bb40c5b14b44b5121370f02d74de';
      this.major = Utils.c_to_f(this.reading.temperature);
      this.minor = this.reading.gravity * 1000.0;
      this.rssi = 30;
      this.callbacks = {};
    }

    on(event: string, callback: BleaconCallback) {
      this.callbacks[event] = callback;
    }

    startScanning() {
      const discover = this.callbacks['discover'];
      setInterval(() => {
        this.reading.update(new Date().getTime());
        this.minor =
          1000.0 * (this.reading.gravity + Utils.noise(NOISE_GRAVITY));
        this.major = Utils.c_to_f(
          this.reading.temperature + Utils.noise(NOISE_TEMPERATURE)
        );

        if (discover) {
          discover(this);
        }
      }, 1000);
    }
  }

  Bleacon = new Bleacon_();
}
export default Bleacon;
