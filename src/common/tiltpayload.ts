import { Utils } from './utils';

type TiltColor =
  | 'Green'
  | 'Red'
  | 'Black'
  | 'Purple'
  | 'Orange'
  | 'Blue'
  | 'Pink';

// Identifies the TILT Hydrometer available
const TILT_UUIDS: { [uuid: string]: TiltColor } = {
  a495bb20c5b14b44b5121370f02d74de: 'Green',
  a495bb10c5b14b44b5121370f02d74de: 'Red',
  a495bb30c5b14b44b5121370f02d74de: 'Black',
  a495bb40c5b14b44b5121370f02d74de: 'Purple',
  a495bb50c5b14b44b5121370f02d74de: 'Orange',
  a495bb60c5b14b44b5121370f02d74de: 'Blue',
  a495bb70c5b14b44b5121370f02d74de: 'Pink'
};

function normalize_uuid(uuid: string): string {
  return uuid.toLowerCase().replace(/-/g, '');
}

class TiltPayload {
  uuid: string;
  timestamp: number;
  temperature: number;
  ftemperature: number;
  gravity: number;
  fgravity: number;
  rssi: number;
  color: TiltColor;

  constructor(
    uuid: string,
    temperature: number,
    gravity: number,
    rssi: number
  ) {
    // Build the payload by default
    this.uuid = uuid;
    this.timestamp = Date.now();
    this.temperature = Utils.f_to_c(temperature);
    this.ftemperature = this.temperature;
    this.gravity = gravity;
    this.fgravity = this.gravity;
    this.rssi = rssi;
    this.color = TILT_UUIDS[normalize_uuid(uuid)];
  }

  isValid(): boolean {
    return (
      this.color != null &&
      this.temperature < 100.0 &&
      this.temperature > 0.0 &&
      this.gravity < 1.2 &&
      this.gravity > 0.9
    );
  }
}

export { TiltPayload, TiltColor };
