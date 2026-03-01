import { TiltPayload } from '../common/tiltpayload';
import { Utils } from '../common/utils';
import * as svg from '@svgdotjs/svg.js';
import * as beerbot_config from '../config/config.json';

const SERVER_ADDRESS = beerbot_config?.server?.address ?? 'localhost';

svg.registerWindow(window, document);

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

let lastBeerDetails = DEFAULT_BEER_DETAILS;
let lastTiltMeas = DEFAULT_MEAS;

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
  input: any
) {
  const valid = is_valid_func(data);
  if (valid) {
    input.classList.remove('invalid');
    input.value = data;
  } else {
    if (!input.classList.contains('invalid')) {
      input.classList.add('invalid');
    }
  }
  return valid;
}

function update_beer_name(name: string, beerNameInput: any, svgBeerName: any) {
  if (validate_data(name, is_valid_beer_name, beerNameInput)) {
    if (svgBeerName) {
      svgBeerName.text(name);
    }
  }
}

function update_beer_color(srm: number, beerColorInput: any, svgBeer: any) {
  if (validate_data(srm, is_valid_beer_color, beerColorInput)) {
    if (svgBeer) {
      const beerRgb = Utils.srm_to_rgb(srm);
      svgBeer.fill(Utils.rgba_style(beerRgb, 1.0));
      beerColorInput.style.backgroundColor = Utils.rgba_style(beerRgb, 0.3);
    }
  } else {
    beerColorInput.style.backgroundColor = '';
  }
}

function update_beer_og(og: number, beerog: any) {
  validate_data(og, is_valid_beer_og, beerog);
}

function update_beer_details(jist: Jist, deets: Deets) {
  console.log('update-beer-details: ', deets);
  update_beer_name(deets.name, jist.beerName, jist.svgBeerName);
  update_beer_color(deets.color_srm, jist.beerColor, jist.svgBeer);
  update_beer_og(deets.og, jist.beerOg);
  lastBeerDetails = deets;
}

function update_beer_abv(og: number, g: number, beerAbv: any, svgBeerAbv: any) {
  if (og && g && og > g) {
    const abv = `${Utils.gravity_to_abv(og, g).toFixed(1)}%`;
    beerAbv.innerText = abv;
    svgBeerAbv.text(abv);
  } else {
    beerAbv.innerText = '-';
    svgBeerAbv.text('');
  }
}

function update_meas(jist: Jist, meas: any) {
  jist.beerTemperature.innerText = `${meas.temperature.toFixed(1)}C`;
  jist.beerGravity.innerText = `${meas.gravity.toFixed(3)}SG`;
  update_beer_abv(
    lastBeerDetails.og,
    meas.gravity,
    jist.beerAbv,
    jist.svgBeerAbv
  );
  lastTiltMeas = meas;
}

function update_airlock(jist: Jist, meas: any) {
  //jist.svgAnimation.attr("dur", `${meas.temperature}s`);
}

function update_tilt(jist: Jist, meas: any) {
  jist.svgTiltFrame.fill(TILT_COLOR_TO_FILL[meas.color]);

  const text = `${meas.temperature.toFixed(1)}C, ${meas.gravity.toFixed(3)}SG`;
  jist.svgTiltText.text(text);

  let tiltAngle = 10.0 + (meas.gravity - 1.0) * 600.0;
  if (tiltAngle > 70.0) {
    tiltAngle = 70.0;
  }

  const newRotation = 90.0 - tiltAngle;
  jist.svgTilt.attr('transform', `translate(38, 78) rotate(${newRotation})`);
}

function update_fermenter_tilt(jist: Jist, meas: any) {
  update_meas(jist, meas);
  update_tilt(jist, meas);
  update_airlock(jist, meas);
}

function update_fermenter_svg(jist: Jist, svgContents: string) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContents, 'image/svg+xml');
  const svgBody = svgDoc.querySelector('svg');

  jist.image.svg(svgBody.innerHTML).viewbox(0, 0, 80, 130);
  jist.svgBeer = jist.image.findOne('#Beer') as svg.Rect;
  jist.svgBeerName = jist.image.findOne('#BeerName') as svg.Text;
  jist.svgBeerAbv = jist.image.findOne('#BeerAbv') as svg.Text;
  jist.svgTilt = jist.image.findOne('#Tilt') as svg.G;
  jist.svgTiltText = jist.image.findOne('#TiltDetails') as svg.Text;
  jist.svgTiltFrame = jist.image.findOne('#TiltFrame') as svg.Rect;
  jist.svgLiquidPath = jist.image.findOne('#Liquid') as svg.Path;
  jist.svgAnimation = jist.image.findOne('#Animation') as svg.Element;

  update_beer_details(jist, lastBeerDetails);
  update_fermenter_tilt(jist, lastTiltMeas);
}

function post_json(jist: Jist, path: string, json: string, rspHandler: (jist: Jist, json_obj: any) => void) {
  console.log(`post-json path=${path}, json=${json}`);
  fetch(`${SERVER_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: json,
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok: ' + response.statusText);
    }
    return response.json(); // or response.text() based on your API
  }).then(json => {
    console.log(`post-json path=${path} => response=${json}`);
    rspHandler(jist, JSON.parse(json));
  }).catch(error => {
    console.error(`post-json path=${path} => error=${error}`);
  });
}

function fetch_json(jist: Jist, path: string, jsonHandler: (jist: Jist, json_obj: any) => void) {
  // Function to periodically fetch tilt measurements
  fetch(`${SERVER_URL}/${path}`)
    .then(response => response.json())
    .then(msg => {
      console.log(`fetched from ${path}: ${msg}`);
      jsonHandler(jist, JSON.parse(msg));
    })
    .catch(error => {
      console.error(`Failed to fetch from ${path}: ${error}`);
    });
}

function submit_beer_details(jist: Jist) {
  const deets: Deets = {
    name: jist.beerName.value,
    color_srm: Number(jist.beerColor.value),
    og: Number(jist.beerOg.value)
  };

  update_beer_name(deets.name, jist.beerName, jist.svgBeerName);
  update_beer_color(deets.color_srm, jist.beerColor, jist.svgBeer);
  update_beer_og(deets.og, jist.beerOg);
  update_beer_abv(
    deets.og,
    lastTiltMeas.gravity,
    jist.beerAbv,
    jist.svgBeerAbv
  );

  post_json(jist, 'beer-details', JSON.stringify(deets), update_beer_details);
}

type Jist = {
  tiltPayloadEvent: EventSource,
  image: svg.Container;
  beerName: HTMLInputElement;
  beerColor: HTMLInputElement;
  beerOg: HTMLInputElement;
  beerSubmit: HTMLButtonElement;
  beerTemperature: HTMLElement;
  beerGravity: HTMLElement;
  beerAbv: HTMLElement;
  svgBeer: svg.Rect | null;
  svgBeerName: svg.Text | null;
  svgBeerAbv: svg.Text | null;
  svgTilt: svg.G | null;
  svgTiltText: svg.Text | null;
  svgTiltFrame: svg.Rect | null;
  svgLiquidPath: svg.Path | null;
  svgAnimation: svg.Element | null;
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Contents loaded...");
  const jist: Jist = {
    tiltPayloadEvent: new EventSource(`${SERVER_URL}/tilt-meas`),
    image: svg.SVG("#svgimage") as svg.Container,
    beerName: document.getElementById('beername') as HTMLInputElement,
    beerColor: document.getElementById('beercolor') as HTMLInputElement,
    beerOg: document.getElementById('og') as HTMLInputElement,
    beerSubmit: document.getElementById('beersubmit') as HTMLButtonElement,
    beerTemperature: document.getElementById('temperature'),
    beerGravity: document.getElementById('gravity'),
    beerAbv: document.getElementById('abv'),
    svgBeer: null,
    svgBeerName: null,
    svgBeerAbv: null,
    svgTilt: null,
    svgTiltText: null,
    svgTiltFrame: null,
    svgLiquidPath: null,
    svgAnimation: null,
  };

  fetch('/images/fermenter.svg')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.text();
    }).then(content => update_fermenter_svg(jist, content))
    .catch(error => {
      console.error(`Failed loading fermenter: ${error}`)
    });

  jist.beerName.addEventListener('keyup', () => {
    update_beer_name(
      String(jist.beerName.innerText),
      jist.beerName,
      jist.svgBeerName
    );
  });

  jist.beerColor.addEventListener('keyup', () => {
    update_beer_color(
      Number(jist.beerColor.innerText),
      jist.beerColor,
      jist.svgBeer
    );
  });

  jist.beerOg.addEventListener('keyup', () => {
    update_beer_og(Number(jist.beerOg.innerText), jist.beerOg);
  });

  jist.beerSubmit.addEventListener('click', () => {
    submit_beer_details(jist);
    return false;
  });

  fetch_json(jist, 'beer-details', update_beer_details);

  // Handle incoming messages
  jist.tiltPayloadEvent.onmessage = (event: MessageEvent) => update_fermenter_tilt(jist, JSON.parse(event.data));

  // Handle errors
  jist.tiltPayloadEvent.onerror = function (event: Event) {
    console.error('EventSource failed:', event);
  };
});
