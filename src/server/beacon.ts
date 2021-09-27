/* eslint-disable @typescript-eslint/no-var-requires */
import { Utils } from '../common/utils';
import { TiltPayload } from '../common/tiltpayload';

interface IBeacon {
  uuid: string;
  major: number;
  minor: number;
  txPower: number;
}

interface Beacon {
  beaconType: string;
  iBeacon: IBeacon;
}

function toTiltPayload(beacon: Beacon): TiltPayload {
  return new TiltPayload(
    beacon.iBeacon.uuid,
    beacon.iBeacon.major,
    beacon.iBeacon.minor / 1000.0,
    beacon.iBeacon.txPower
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let beaconScanner: any;
try {
  const noble = require('@abandonware/noble');
  const BeaconScanner = require('node-beacon-scanner');
  beaconScanner = new BeaconScanner({ noble: noble });
} catch (err: unknown) {
  console.log(`node-beacon-scanner couldn't be started: using fake`);
  console.error(`${err}`);
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

  class FakeBeacon {
    reading: Reading;
    uuid: string;
    major: number;
    minor: number;
    rssi: number;
    onadvertisement: (details: Beacon) => void;

    constructor() {
      this.reading = new Reading();
      this.uuid = 'a495bb40c5b14b44b5121370f02d74de';
      this.major = Utils.c_to_f(this.reading.temperature);
      this.minor = this.reading.gravity * 1000.0;
      this.rssi = 30;
    }

    startScan(): Promise<unknown> {
      const promise = new Promise((resolve: (value: void) => void) => {
        setInterval(() => {
          this.reading.update(new Date().getTime());
          this.minor =
            1000.0 * (this.reading.gravity + Utils.noise(NOISE_GRAVITY));
          this.major = Utils.c_to_f(
            this.reading.temperature + Utils.noise(NOISE_TEMPERATURE)
          );

          const beacon: Beacon = {
            beaconType: 'iBeacon',
            iBeacon: {
              uuid: this.uuid,
              major: this.major,
              minor: this.minor,
              txPower: this.rssi
            }
          };

          if (this.onadvertisement) {
            this.onadvertisement(beacon);
          }
        }, 1000);
        resolve();
      });

      return promise;
    }
  }

  beaconScanner = new FakeBeacon();
}

export { beaconScanner, toTiltPayload, Beacon };
