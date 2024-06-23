import { TiltPayload } from '../common/tiltpayload';
import { Utils } from '../common/utils';
import $ from 'jquery';
import io from 'socket.io-client';
import { SVG, registerWindow } from '@svgdotjs/svg.js';

registerWindow(window, document);

const socket = io();

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
    input.removeClass('invalid');
    input.val(data);
  } else {
    if (!input.hasClass('invalid')) {
      input.addClass('invalid');
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
      beerColorInput.css({
        'background-color': Utils.rgba_style(beerRgb, 0.3)
      });
    }
  } else {
    beerColorInput.css({ 'background-color': '' });
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
    beerAbv.text(abv);
    svgBeerAbv.text(abv);
  } else {
    beerAbv.text('-');
    svgBeerAbv.text('');
  }
}

function update_meas(jist: Jist, meas: any) {
  jist.beerTemperature.text(`${meas.temperature.toFixed(1)}C`);
  jist.beerGravity.text(`${meas.gravity.toFixed(3)}SG`);
  update_beer_abv(
    jist.beerOg.val(),
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

function update_fermenter_svg(jist: Jist, contents: any) {
  const svgContents = $('svg', contents).html();
  jist.image.svg(svgContents);
  jist.image.viewbox(0, 0, 80, 130);

  jist.svgBeer = jist.image.find('#Beer');
  jist.svgBeerName = jist.image.find('#BeerName');
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
    name: jist.beerName.val(),
    color_srm: jist.beerColor.val(),
    og: jist.beerOg.val()
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

$(() => {
  const jist: Jist = {
    image: SVG('#svgimage'),
    beerName: $('#beername'),
    beerColor: $('#beercolor'),
    beerOg: $('#og'),
    beerSubmit: $('#beersubmit'),
    beerTemperature: $('#temperature'),
    beerGravity: $('#gravity'),
    beerAbv: $('#abv'),
    svgBeer: null,
    svgBeerName: null,
    svgBeerAbv: null,
    svgTilt: null,
    svgTiltText: null,
    svgTiltFrame: null,
    svgLiquidPath: null,
    svgAnimation: null
  };

  $.get(
    '/images/fermenter.svg',
    (content) => {
      update_fermenter_svg(jist, content);
    },
    'xml'
  );

  jist.beerName.on('keyup change', () => {
    update_beer_name(
      String(jist.beerName.val()),
      jist.beerName,
      jist.svgBeerName
    );
  });

  jist.beerColor.on('keyup change', () => {
    update_beer_color(
      Number(jist.beerColor.val()),
      jist.beerColor,
      jist.svgBeer
    );
  });

  jist.beerOg.on('keyup change', () => {
    update_beer_og(Number(jist.beerOg.val()), jist.beerOg);
  });

  jist.beerSubmit.on('click', () => {
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
