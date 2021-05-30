const $ = require('jquery');

const { SVG, registerWindow } = require('@svgdotjs/svg.js/dist/svg.node.js')
registerWindow(window, document);

const io = require('socket.io-client');
const socket = io();

const utils = require('./utils.js');
const { gravity_to_abv } = require('./utils.js');


const DEFAULT_BEER_DETAILS = {
  name: "Beer",
  color_srm: 23.1,
  og: 1.010
};


const DEFAULT_MEAS = {
  color: "Black",
  fgravity: 1.010,
  ftemperature: 20.0,
  gravity: 1.010,
  rssi: 0.0,
  temperature: 20.0,
  timestamp: 0,
  uuid: "-"
};


const TILT_COLOR_TO_FILL = {
  "Red": "#f27373",
  "Purple": "#ba73f2",
  "Green": "#73f273",
  "Black": "#737373",
  "Blue": "#7373f2",
  "Pink": "#f2baba",
  "Orange": "#f2ba73"
}


var lastBeerDetails = DEFAULT_BEER_DETAILS;
var lastTiltMeas = DEFAULT_MEAS;


function is_valid_beer_name(name) {
  return name.length > 0 && name.length < 64;
}


function is_valid_beer_color(srm) {
  return srm >= 0.0 && srm <= 200.0;
}


function is_valid_beer_og(og) {
  return og >= 1.0 && og <= 1.150;
}


function validate_data(data, is_valid_func, input) {
  const valid = is_valid_func(data);
  if (valid) {
    input.removeClass('invalid');
    input.val(data);
  }
  else {
    if (!input.hasClass('invalid')) {
      input.addClass('invalid');
    }
  }
  return valid;
}


function update_beer_name(name, beerNameInput, svgBeerName) {
  if (validate_data(name, is_valid_beer_name, beerNameInput)) {
    if (svgBeerName) {
      svgBeerName.text(name);
    }
  }
}


function update_beer_color(srm, beerColorInput, svgBeer) {
  if (validate_data(srm, is_valid_beer_color, beerColorInput)) {
    if (svgBeer) {
      const beerRgb = utils.srm_to_rgb(srm);
      svgBeer.fill(utils.rgba_style(beerRgb, 1.0));
      beerColorInput.css({ 'background-color': utils.rgba_style(beerRgb, 0.3) });
    }
  }
  else {
    beerColorInput.css({ 'background-color': '' });
  }
}


function update_beer_og(og, beerog) {
  validate_data(og, is_valid_beer_og, beerog);
}


function update_beer_details(jist, deets) {
  console.log('update-beer-details: ', deets);
  update_beer_name(deets.name, jist.beerName, jist.svgBeerName);
  update_beer_color(deets.color_srm, jist.beerColor, jist.svgBeer);
  update_beer_og(deets.og, jist.beerOg);
  lastBeerDetails = deets;
}

function update_beer_abv(og, g, beerAbv, svgBeerAbv) {
  if (og && g && og > g) {
    const abv = `${gravity_to_abv(og, g).toFixed(1)}%`;
    beerAbv.text(abv);
    svgBeerAbv.text(abv);
  }
  else {
    beerAbv.text('-');
    svgBeerAbv.text('');
  }
}

function update_meas(jist, meas) {
  jist.beerTemperature.text(`${meas.temperature.toFixed(1)}C`);
  jist.beerGravity.text(`${meas.gravity.toFixed(3)}SG`);
  update_beer_abv(jist.beerOg.val(), meas.gravity, jist.beerAbv, jist.svgBeerAbv);
  lastTiltMeas = meas;
}


function update_airlock(jist, meas) {
  //jist.svgAnimation.attr("dur", `${meas.temperature}s`);
}


function update_tilt(jist, meas) {

  jist.svgTiltFrame.fill(TILT_COLOR_TO_FILL[meas.color]);

  const text = `${meas.temperature.toFixed(1)}C, ${meas.gravity.toFixed(3)}SG`;
  jist.svgTiltText.text(text);

  var tiltAngle = 10.0 + (meas.gravity - 1.000)*600.0;
  if (tiltAngle > 70.0) {
    tiltAngle = 70.0;
  }
  
  const newRotation = 90.0 - tiltAngle;
  jist.svgTilt.attr('transform', `translate(38, 78) rotate(${newRotation})`);
}


function update_fermenter_tilt(jist, meas) {
  update_meas(jist, meas);
  update_tilt(jist, meas);
  update_airlock(jist, meas);
}


function update_fermenter_svg(jist, contents) {
  const svgContents = $('svg', contents).html();
  jist.image.svg(svgContents);
  jist.image.viewbox(0, 0, 80, 130);

  jist.svgBeer = jist.image.find('#Beer');
  jist.svgBeerName = jist.image.find('#BeerName');
  jist.svgBeerAbv = jist.image.find('#BeerAbv');
  jist.svgTilt = jist.image.find("#Tilt");
  jist.svgTiltText = jist.image.find("#TiltDetails");
  jist.svgTiltFrame = jist.image.find("#TiltFrame");
  jist.svgLiquidPath = jist.image.find("#Liquid");
  jist.svgAnimation = jist.image.find("#Animation");

  update_beer_details(jist, lastBeerDetails);
  update_fermenter_tilt(jist, lastTiltMeas);
}


function submit_beer_details(jist) {
  const beerName = jist.beerName.val();
  const beerColorSrm = jist.beerColor.val();
  const beerOg = jist.beerOg.val();

  update_beer_name(beerName, jist.beerName, jist.svgBeerName);
  update_beer_color(beerColorSrm, jist.beerColor, jist.svgBeer);
  update_beer_og(beerOg, jist.beerOg);
  update_beer_abv(beerOg, lastTiltMeas.gravity, jist.beerAbv, jist.svgBeerAbv);

  //socket.emit('update-details', JSON.stringify({ deets }));
}


$(() => {

  const jist = {
    image: SVG('#svgimage'),
    beerName: $('#beername'),
    beerColor: $('#beercolor'),
    beerOg: $('#og'),
    beerSubmit: $('#beersubmit'),
    beerTemperature: $('#temperature'),
    beerGravity: $('#gravity'),
    beerAbv: $('#abv')
  }

  $.get('/images/fermenter.svg', (content) => {
    update_fermenter_svg(jist, content);
  }, 'xml');

  jist.beerName.on('keyup change', () => {
    update_beer_name(jist.beerName.val(), jist.beerName, jist.svgBeerName)
  });

  jist.beerColor.on('keyup change', () => {
    update_beer_color(jist.beerColor.val(), jist.beerColor, jist.svgBeer)
  });

  jist.beerOg.on('keyup change', () => {
    update_beer_og(jist.beerOg.val(), jist.beerOg)
  });

  jist.beerSubmit.on('click', () => {
    submit_beer_details(jist);
    return false;
  });

  socket.on('tilt-meas', (msg) => {
    const meas = JSON.parse(msg);
    update_fermenter_tilt(jist, meas);
  });

  socket.on('beer-details', (msg) => {
    const deets = JSON.parse(msg);
    update_beer_details(jist, deets);
  });
});
