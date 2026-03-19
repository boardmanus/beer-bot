import { TiltPayload } from '../common/tiltpayload';
import { Utils } from '../common/utils';
import * as beerbot_config from '../config/config.json';

const SERVER_ADDRESS = beerbot_config?.server?.address ?? 'localhost';
const SERVER_URL = `http://${SERVER_ADDRESS}:3000`;

type Deets = {
  name: string;
  color_srm: number;
  og: number;
};

const ACTIVITY_LED_COLOR = 'green';

const DEFAULT_BEER_DETAILS: Deets = {
  name: 'Beer pop',
  color_srm: 23.1,
  og: 1.01
};

const DEFAULT_MEAS: TiltPayload = new TiltPayload('-', 20.0, 1.01, 0.0);

const TILT_COLOR_TO_FILL: { [color: string]: string } = {
  Red: '#f27373',
  Purple: '#ba73f2',
  Green: '#73f273',
  Black: '#737373',
  Blue: '#7373f2',
  Pink: '#f2baba',
  Orange: '#f2ba73'
};

const TILT_COLOR_DEFAULT = TILT_COLOR_TO_FILL.Purple;

function tilt_color(color: string): string {
  return TILT_COLOR_TO_FILL[color] ?? TILT_COLOR_DEFAULT;
}

function is_valid_beer_name(name: string) {
  return name.length > 0 && name.length < 64;
}

function is_valid_beer_color(srm: number) {
  return srm >= 0.0 && srm <= 200.0;
}

function is_valid_beer_og(og: number) {
  return og >= 1.0 && og <= 1.15;
}

function validate_data<DataType>(data: DataType, is_valid_func: (val: DataType) => boolean, input: HTMLInputElement) {
  const valid = is_valid_func(data);
  if (valid) {
    input.classList.remove('invalid');
  } else {
    if (!input.classList.contains('invalid')) {
      input.classList.add('invalid');
    }
  }
  return valid;
}

class BeerForm {
  private beerName: HTMLInputElement = document.getElementById('beername') as HTMLInputElement;
  private beerColor: HTMLInputElement = document.getElementById('beercolor') as HTMLInputElement;
  private beerOg: HTMLInputElement = document.getElementById('og') as HTMLInputElement;
  private beerSubmit: HTMLButtonElement = document.getElementById('beersubmit') as HTMLButtonElement;
  private beerReload: HTMLButtonElement = document.getElementById('beerreload') as HTMLButtonElement;
  private savedDeets: Deets = DEFAULT_BEER_DETAILS;

  constructor(
    private onInputChanged: (deets: Deets) => void,
    private onSubmit: (deets: Deets) => void,
    private onReload: () => void
  ) {
    if (!this.beerName || !this.beerColor || !this.beerOg || !this.beerSubmit) {
      throw new Error('BeerForm: required form elements are not present in the DOM');
    }

    this.beerName.addEventListener('keyup', () => this.onBeerNameEvent());
    this.beerColor.addEventListener('input', () => this.onBeerColorEvent());
    this.beerColor.addEventListener('keyup', () => this.onBeerColorEvent());
    this.beerOg.addEventListener('input', () => this.onBeerOgEvent());
    this.beerOg.addEventListener('keyup', () => this.onBeerOgEvent());
    this.beerSubmit.addEventListener('click', () => this.onSubmit(this.current()));
    this.beerReload.addEventListener('click', () => this.onReload());
  }

  update(deets: Deets) {
    this.savedDeets = deets;
    this.beerName.value = deets.name;
    this.beerColor.value = String(deets.color_srm);
    this.beerOg.value = String(deets.og);
    this.onBeerDetailsUpdated();
  }

  private updateSubmit() {
    this.beerSubmit.disabled = !this.hasChanges();
  }

  private current(): Deets {
    return {
      name: this.beerName.value,
      color_srm: Number(this.beerColor.value),
      og: Number(this.beerOg.value)
    };
  }

  private hasChanges(): boolean {
    return (
      this.savedDeets.og !== Number(this.beerOg.value) ||
      this.savedDeets.color_srm !== Number(this.beerColor.value) ||
      this.savedDeets.name !== this.beerName.value
    );
  }

  private onBeerDetailsUpdated() {
    const deets = this.current();
    const beerRgb = Utils.srm_to_rgb(deets.color_srm);
    this.beerColor.style.backgroundColor = Utils.rgba_style(beerRgb, 0.3);
    this.updateSubmit();
    this.onInputChanged(deets);
  }

  private onBeerColorEvent() {
    if (validate_data(Number(this.beerColor.value), is_valid_beer_color, this.beerColor)) {
      this.onBeerDetailsUpdated();
    }
  }

  private onBeerOgEvent() {
    if (validate_data(Number(this.beerOg.value), is_valid_beer_og, this.beerOg)) {
      this.onBeerDetailsUpdated();
    }
  }

  private onBeerNameEvent() {
    if (validate_data(this.beerName.value, is_valid_beer_name, this.beerName)) {
      this.onBeerDetailsUpdated();
    }
  }
}

class FermenterSvg {
  private svgBeer = document.querySelector('#Beer') as SVGRectElement;
  private svgBeerName = document.querySelector('#BeerName') as SVGTextElement;
  private svgBeerAbv = document.querySelector('#BeerAbv') as SVGTextElement;
  private svgTilt = document.querySelector('#Tilt') as SVGGElement;
  private svgTiltText = document.querySelector('#TiltDetails') as SVGTextElement;
  private svgTiltFrame = document.querySelector('#TiltFrame') as SVGRectElement;
  private svgActivityLed = document.querySelector('#ActivityLed') as SVGCircleElement;

  constructor() {
    if (
      !this.svgBeer ||
      !this.svgBeerName ||
      !this.svgBeerAbv ||
      !this.svgTilt ||
      !this.svgTiltText ||
      !this.svgTiltFrame ||
      !this.svgActivityLed
    ) {
      throw new Error('FermenterDisplay: required SVG elements are not all present');
    }
  }

  update(deets: Deets, meas: TiltPayload, blipLed = false) {
    this.svgBeerName.textContent = deets.name;
    this.svgBeer.setAttribute('fill', Utils.rgba_style(Utils.srm_to_rgb(deets.color_srm), 1.0));
    this.svgTiltFrame.setAttribute('fill', tilt_color(meas.color));
    this.svgTiltText.textContent = `${meas.temperature.toFixed(1)}C, ${meas.gravity.toFixed(3)}SG`;
    this.svgBeerAbv.textContent = `${Utils.gravity_to_abv(deets.og, meas.gravity).toFixed(1)}%`;
    const tiltAngle = Math.min(70.0, 10.0 + (meas.gravity - 1.0) * 600.0);
    this.svgTilt.setAttribute('transform', `translate(38, 78) rotate(${90.0 - tiltAngle})`);

    if (blipLed) {
      this.svgActivityLed.setAttribute('fill', ACTIVITY_LED_COLOR);
      setTimeout(() => this.svgActivityLed.setAttribute('fill', 'none'), 200);
    }
  }
}

class BeerStatus {
  private abvStatus = document.getElementById('abv');
  private temperatureStatus = document.getElementById('temperature');
  private gravityStatus = document.getElementById('gravity');

  constructor() {
    if (!this.abvStatus || !this.gravityStatus || !this.temperatureStatus) {
      throw new Error('BeerStatus: required elements are not all present');
    }
  }

  update(deets: Deets, meas: TiltPayload) {
    const measuredAbv = Utils.gravity_to_abv(deets.og, meas.gravity);
    this.abvStatus.innerText = `${measuredAbv.toFixed(1)}%`;
    this.temperatureStatus.innerText = `${meas.temperature.toFixed(1)}C`;
    this.gravityStatus.innerText = `${meas.gravity.toFixed(3)}SG`;
  }
}

class BeerDetailsService {
  async get(): Promise<Deets> {
    const res = await fetch(`${SERVER_URL}/beer-details`);
    const payload = await res.json();
    return JSON.parse(payload);
  }

  async post(deets: Deets): Promise<Deets> {
    const res = await fetch(`${SERVER_URL}/beer-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deets)
    });
    if (!res.ok) throw new Error(`Network response not ok: ${res.statusText}`);
    const body = await res.json();
    return JSON.parse(body);
  }
}

class Jist {
  private tiltSource = new EventSource('/tilt-meas');
  private beerForm: BeerForm;
  private beerStatus: BeerStatus;
  private fermenterSvg: FermenterSvg;
  private beerService = new BeerDetailsService();
  private lastTilt: TiltPayload = DEFAULT_MEAS;
  private lastDeets: Deets = DEFAULT_BEER_DETAILS;

  constructor() {
    this.fermenterSvg = new FermenterSvg();
    this.beerStatus = new BeerStatus();

    this.beerForm = new BeerForm(
      (deets) => this.onBeerDetails(deets),
      (deets) => this.submitBeerDetails(deets),
      () => this.fetchBeerDetails()
    );

    this.tiltSource.onmessage = (event: MessageEvent) => this.onTiltUpdate(JSON.parse(event.data));
    this.tiltSource.onerror = (event) => console.error('jist: EventSource failed:', event);

    this.beerForm.update(this.lastDeets);
    this.beerStatus.update(this.lastDeets, this.lastTilt);
    this.fermenterSvg.update(this.lastDeets, this.lastTilt);
    this.fetchBeerDetails();
  }

  private async fetchBeerDetails() {
    try {
      const deets = await this.beerService.get();
      this.beerForm.update(deets);
    } catch (error) {
      console.error(`jist: fetch-beer-details: ${error}`);
    }
  }

  private async submitBeerDetails(deets: Deets) {
    try {
      const savedDeets = await this.beerService.post(deets);
      this.beerForm.update(savedDeets);
    } catch (error) {
      console.error('jist: submit-beer-details:', error);
    }
  }

  private onBeerDetails(deets: Deets) {
    this.lastDeets = deets;
    this.fermenterSvg.update(deets, this.lastTilt);
    this.beerStatus.update(deets, this.lastTilt);
  }

  private onTiltUpdate(meas: TiltPayload) {
    this.lastTilt = meas;
    this.fermenterSvg.update(this.lastDeets, meas, true);
    this.beerStatus.update(this.lastDeets, meas);
  }
}

document.addEventListener('DOMContentLoaded', () => new Jist());
