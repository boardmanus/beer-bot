import { TiltPayload } from '../common/tiltpayload';
import { Utils } from '../common/utils';
import io from 'socket.io-client';
import { SVG, registerWindow } from '@svgdotjs/svg.js';
import * as beerbot_config from '../config/config.json';

const SERVER_ADDRESS = beerbot_config?.server?.address ?? 'localhost';

registerWindow(window, document);

const socket = io(`http://${SERVER_ADDRESS}:3000`);

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
    jist.beerOg.value,
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
  jist.svgBeer = jist.image.find('#Beer');
  jist.svgBeerName = jist.image.find('#BeerName');
  console.log(`update_fermenter_svg`);

  jist.svgBeerAbv = jist.image.find('#BeerAbv');
  jist.svgTilt = jist.image.find('#Tilt');
  jist.svgTiltText = jist.image.find('#TiltDetails');
  jist.svgTiltFrame = jist.image.find('#TiltFrame');
  jist.svgLiquidPath = jist.image.find('#Liquid');
  jist.svgAnimation = jist.image.find('#Animation');

  update_beer_details(jist, lastBeerDetails);
  update_fermenter_tilt(jist, lastTiltMeas);
}

function submit_beer_details(jist: Jist) {
  const deets: Deets = {
    name: jist.beerName.value,
    color_srm: jist.beerColor.value,
    og: jist.beerOg.value
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

  const jsonStr = JSON.stringify(deets);
  socket.emit('update-details', jsonStr);
}

type Jist = {
  image: any;
  beerName: any;
  beerColor: any;
  beerOg: any;
  beerSubmit: any;
  beerTemperature: any;
  beerGravity: any;
  beerAbv: any;
  svgBeer: any | null;
  svgBeerName: any | null;
  svgBeerAbv: any | null;
  svgTilt: any | null;
  svgTiltText: any | null;
  svgTiltFrame: any | null;
  svgLiquidPath: any | null;
  svgAnimation: any | null;
};

document.addEventListener("DOMContentLoaded", () => {
  const jist: Jist = {
    image: SVG("#svgimage"),
    beerName: document.getElementById('beername'),
    beerColor: document.getElementById('beercolor'),
    beerOg: document.getElementById('og'),
    beerSubmit: document.getElementById('beersubmit'),
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
    svgAnimation: null
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
      String(jist.beerName.value),
      jist.beerName,
      jist.svgBeerName
    );
  });

  jist.beerColor.addEventListener('keyup', () => {
    update_beer_color(
      Number(jist.beerColor.value),
      jist.beerColor,
      jist.svgBeer
    );
  });

  jist.beerOg.addEventListener('keyup', () => {
    update_beer_og(Number(jist.beerOg.value), jist.beerOg);
  });

  jist.beerSubmit.addEventListener('click', () => {
    submit_beer_details(jist);
    return false;
  });

  socket.on('tilt-meas', (msg: any) => {
    const meas = JSON.parse(msg);
    update_fermenter_tilt(jist, meas);
  });

  socket.on('beer-details', (msg: any) => {
    const deets = JSON.parse(msg);
    update_beer_details(jist, deets);
  });
});
