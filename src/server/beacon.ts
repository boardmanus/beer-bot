/* eslint-disable @typescript-eslint/no-var-requires */
import { Utils } from '../common/utils';
import { TiltPayload } from '../common/tiltpayload';
import * as config from '../config/config.json';

interface IBeacon {
  uuid: string;
  major: number;
  minor: number;
  txPower: number;
}

interface IBeaconReading {
  beaconType: string;
  iBeacon: IBeacon;
}

interface BeaconScanner {
  onadvertisement: (details: IBeaconReading) => void;
  startScan(): Promise<unknown>;
  stopScan(): void;
}

// BeaconScanner may not be available on some platforms (windows).
// Allow the require to fail. If it does fail, it is replaced by
// FakeBeacon.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NodeBeaconScanner: any;
try {
  NodeBeaconScanner = require('node-beacon-scanner');
} catch (err: unknown) {
  console.log(`node-beacon-scanner couldn't be started: using fake (${err})`);
  NodeBeaconScanner = null;
}

function toTiltPayload(beacon: IBeaconReading): TiltPayload {
  return new TiltPayload(
    beacon.iBeacon.uuid,
    beacon.iBeacon.major,
    beacon.iBeacon.minor / 1000.0,
    beacon.iBeacon.txPower
  );
}

function create_beacon_scanner(): BeaconScanner {
  if ((NodeBeaconScanner == null || config?.debug?.fakebleacon) ?? false) {
    return new FakeBeacon();
  } else {
    const noble = require('@abandonware/noble');
    return new NodeBeaconScanner({ noble: noble });
  }
}

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

class FakeBeacon implements BeaconScanner {
  reading: Reading;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  onadvertisement: (details: IBeaconReading) => void;
  timer: NodeJS.Timeout;

  constructor() {
    this.reading = new Reading();
    this.uuid = 'a495bb40c5b14b44b5121370f02d74de';
    this.major = Utils.c_to_f(this.reading.temperature);
    this.minor = this.reading.gravity * 1000.0;
    this.rssi = 30;
    this.onadvertisement = (_reading: IBeaconReading) => {
      _reading;
    };
  }

  startScan(): Promise<unknown> {
    const promise = new Promise((resolve: (value: void) => void) => {
      this.timer = setInterval(() => {
        this.reading.update(new Date().getTime());
        this.minor =
          1000.0 * (this.reading.gravity + Utils.noise(NOISE_GRAVITY));
        this.major = Utils.c_to_f(
          this.reading.temperature + Utils.noise(NOISE_TEMPERATURE)
        );

        const beacon: IBeaconReading = {
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

  stopScan() {
    clearInterval(this.timer);
  }
}

class Beacon {
  beaconScanner: BeaconScanner;

  constructor(onAdvertisement: (details: TiltPayload) => void) {
    this.beaconScanner = create_beacon_scanner();
    this.beaconScanner.onadvertisement = (details) =>
      onAdvertisement(toTiltPayload(details));

    this.beaconScanner
      .startScan()
      .then(() => {
        console.log('Started to scan.');
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }

  stopScan() {
    this.beaconScanner.stopScan();
  }
}

export { Beacon };
