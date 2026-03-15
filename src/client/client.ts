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

function is_valid_beer_name(name: string) {
  return name.length > 0 && name.length < 64;
}

function is_valid_beer_color(srm: number) {
  return srm >= 0.0 && srm <= 200.0;
}

function is_valid_beer_og(og: number) {
  return og >= 1.0 && og <= 1.15;
}

function validate_data<DataType>(
  data: DataType,
  is_valid_func: (val: DataType) => boolean,
  input: HTMLInputElement
) {
  const valid = is_valid_func(data);
  if (valid) {
    input.classList.remove('invalid');
  } else {
    console.log(`validate-data: invalid='${data}'`)
    if (!input.classList.contains('invalid')) {
      input.classList.add('invalid');
    }
  }
  return valid;
}

class Jist {
  tiltPayloadEvent = new EventSource(`${SERVER_URL}/tilt-meas`);
  beerName = document.getElementById('beername') as HTMLInputElement;
  beerColor = document.getElementById('beercolor') as HTMLInputElement;
  beerOg = document.getElementById('og') as HTMLInputElement;
  beerSubmit = document.getElementById('beersubmit') as HTMLButtonElement;
  beerTemperature = document.getElementById('temperature') as HTMLElement;
  beerGravity = document.getElementById('gravity') as HTMLElement;
  beerAbv = document.getElementById('abv') as HTMLElement;
  fermenter = document.getElementById('fermenter') as HTMLDivElement;
  svgFermenter = this.fermenter.querySelector('#Fermenter') as SVGElement;
  svgBeer = this.svgFermenter.querySelector('#Beer') as SVGRectElement;
  svgBeerName = this.svgFermenter.querySelector('#BeerName') as SVGTextElement;
  svgBeerAbv = this.svgFermenter.querySelector('#BeerAbv') as SVGTextElement;
  svgTilt = this.svgFermenter.querySelector('#Tilt') as SVGGElement;
  svgTiltText = this.svgFermenter.querySelector('#TiltDetails') as SVGTextElement;
  svgTiltFrame = this.svgFermenter.querySelector('#TiltFrame') as SVGRectElement;
  svgLiquidPath = this.svgFermenter.querySelector('#Liquid') as SVGPathElement;
  svgAnimation = this.svgFermenter.querySelector('#Animation') as SVGElement;
  svgActivityLed = this.svgFermenter.querySelector('#ActivityLed') as SVGCircleElement;
  lastBeerDetails = DEFAULT_BEER_DETAILS;
  lastTiltMeas = DEFAULT_MEAS;

  constructor() {

    this.beerName.addEventListener('keyup', () => {
      this.updateBeerName(this.beerName.value);
      this.beerSubmit.disabled = !this.beerDetailsChanged(this.lastBeerDetails);
    });

    const beer_color_event = () => {
      this.updateBeerColor(Number(this.beerColor.value));
      this.beerSubmit.disabled = !this.beerDetailsChanged(this.lastBeerDetails);
    };
    this.beerColor.addEventListener('input', beer_color_event);
    this.beerColor.addEventListener('keyup', beer_color_event);

    const beer_og_event = () => {
      this.updateBeerOg(Number(this.beerOg.value));
      this.beerSubmit.disabled = !this.beerDetailsChanged(this.lastBeerDetails);
    };
    this.beerOg.addEventListener('input', beer_og_event);
    this.beerOg.addEventListener('keyup', beer_og_event);

    this.beerSubmit.addEventListener('click', () => this.submit_beer_details());

    this.tiltPayloadEvent.onmessage = (event: MessageEvent) => this.updateFermenterTilt(JSON.parse(event.data));
    this.tiltPayloadEvent.onerror = (event: Event) => console.error('EventSource failed:', event);

    this.fetchBeerDetails();
  }

  beerDetailsChanged(deets: Deets): boolean {
    return deets.og != Number(this.beerOg.value)
      || deets.color_srm != Number(this.beerColor.value)
      || deets.name != this.beerName.value;
  }

  updateAirlock(meas: TiltPayload) {
    //jist.svgAnimation.attr("dur", `${meas.temperature}s`);
  }

  updateTilt(meas: TiltPayload) {
    this.svgTiltFrame?.setAttribute('fill', TILT_COLOR_TO_FILL[meas.color] ?? '#ffffff');

    const text = `${meas.temperature.toFixed(1)}C, ${meas.gravity.toFixed(3)}SG`;
    if (this.svgTiltText) { this.svgTiltText.textContent = text; }

    let tiltAngle = 10.0 + (meas.gravity - 1.0) * 600.0;
    if (tiltAngle > 70.0) {
      tiltAngle = 70.0;
    }

    const newRotation = 90.0 - tiltAngle;
    this.svgTilt?.setAttribute('transform', `translate(38, 78) rotate(${newRotation})`);
  }

  blipActivityLed() {
    this.svgActivityLed?.setAttribute('fill', 'green');
    setTimeout(() => this.svgActivityLed?.setAttribute('fill', 'none'), 200);
  }

  updateFermenterTilt(meas: TiltPayload) {
    this.updateMeas(meas);
    this.updateTilt(meas);
    this.updateAirlock(meas);
    this.blipActivityLed();
  }

  updateBeerOg(og: number, update = false) {
    console.log(`update-beer-og: ${og}`);
    if (validate_data(og, is_valid_beer_og, this.beerOg)) {
      this.updateBeerAbv(og, this.lastTiltMeas.gravity);
      if (update) {
        this.beerOg.value = String(og);
      }
    }
  }

  updateBeerName(name: string, update = false) {
    if (validate_data(name, is_valid_beer_name, this.beerName)) {
      if (this.svgBeerName) { this.svgBeerName.textContent = name; }
      if (update) {
        this.beerName.value = name;
      }
    }
  }

  updateBeerColor(srm: number, update = false) {
    if (validate_data(srm, is_valid_beer_color, this.beerColor)) {
      const beerRgb = Utils.srm_to_rgb(srm);
      this.svgBeer?.setAttribute('fill', Utils.rgba_style(beerRgb, 1.0));
      this.beerColor.style.backgroundColor = Utils.rgba_style(beerRgb, 0.3);
      if (update) {
        this.beerColor.value = String(srm);
      }
    } else {
      this.beerColor.style.backgroundColor = '';
    }
  }

  updateBeerAbv(og: number, g: number) {
    if (og && g && og > g) {
      const abv = `${Utils.gravity_to_abv(og, g).toFixed(1)}%`;
      this.beerAbv.innerText = abv;
      if (this.svgBeerAbv) { this.svgBeerAbv.textContent = abv; }
    } else {
      this.beerAbv.innerText = '-';
      if (this.svgBeerAbv) { this.svgBeerAbv.textContent = ''; }
    }
  }

  updateMeas(meas: TiltPayload) {
    this.beerTemperature.innerText = `${meas.temperature.toFixed(1)}C`;
    this.beerGravity.innerText = `${meas.gravity.toFixed(3)}SG`;
    this.updateBeerAbv(this.lastBeerDetails.og, meas.gravity);
    this.lastTiltMeas = meas;
  }

  updateBeerDetails(deets: Deets, disable = false) {
    console.log('update-beer-details: ', deets);
    this.updateBeerName(deets.name, true);
    this.updateBeerColor(deets.color_srm, true);
    this.updateBeerOg(deets.og, true);
    this.lastBeerDetails = deets;
    this.beerName.disabled = disable;
    this.beerColor.disabled = disable;
    this.beerOg.disabled = disable;
    this.beerSubmit.disabled = disable || !this.beerDetailsChanged(deets);
  }

  deets(): Deets {
    return {
      name: this.beerName.value,
      color_srm: Number(this.beerColor.value),
      og: Number(this.beerOg.value)
    };
  }

  submit_beer_details() {
    const deets = this.deets();
    this.updateBeerName(deets.name, true);
    this.updateBeerColor(deets.color_srm, true);
    this.updateBeerOg(deets.og, true);
    this.updateBeerAbv(deets.og, this.lastTiltMeas.gravity);
    this.beerSubmit.disabled = true;
    this.postBeerDetails(deets);
  }

  postBeerDetails(deets: Deets) {
    console.log(`post-beer-details: deets=${deets}`);
    fetch(`${SERVER_URL}/beer-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deets),
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    }).then(json => {
      console.log(`post-beer-details: response=${json}`);
      this.updateBeerDetails(JSON.parse(json));
    }).catch(error => {
      console.error(`post-beer-details: error=${error}`);
    });
  }

  fetchBeerDetails() {
    fetch(`${SERVER_URL}/beer-details`)
      .then(response => response.json())
      .then(msg => this.updateBeerDetails(JSON.parse(msg)))
      .catch(error => {
        console.error(`fetch-beer-details: error=${error}`);
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Contents loaded...");
  const jist = new Jist();
});
