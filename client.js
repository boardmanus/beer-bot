const $ = require('jquery');

const { SVG, registerWindow } = require('@svgdotjs/svg.js/dist/svg.node.js')
registerWindow(window, document);

const io = require('socket.io-client');
const socket = io();

const utils = require('./utils.js');

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

function validate_beer_name(name, fallbackName) {
  return is_valid_beer_name(name) ? name : fallbackName;
}

function validate_beer_color(srm, fallback) {
  return is_valid_beer_color(srm) ? srm : fallback;
}

function validate_beer_og(og, fallback) {
  return is_valid_beer_og(og) ? og : fallback;
}

function update_beer_name(name, svg) {
  const beername = $('#beername');
  if (!is_valid_beer_name(name)) {
    if (!beername.hasClass('invalid')) {
      beername.addClass('invalid');
    }
    return;
  }

  beername.removeClass('invalid');
  beername.val(name);

  const svgname = svg.find("#BeerName");
  svgname.text(name);
}

function update_beer_color(srm, svg) {
  const beercolor = $('#beercolor');
  if (!is_valid_beer_color(srm)) {
    if (!beercolor.hasClass('invalid')) {
      beercolor.addClass('invalid');
    }
    return;
  }

  const beerRgb = utils.srm_to_rgb(srm);

  beercolor.removeClass('invalid');
  beercolor.val(srm);
  //beercolor.css({ 'background-color': `rgba(${beerRgb[0]},${beerRgb[1]},${beerRgb[2]},0.1)` });

  const beer = svg.find("#Beer");
  const beerColor = `rgba(${beerRgb[0]},${beerRgb[1]},${beerRgb[2]},1.0)`
  beer.fill(beerColor);
}

function update_beer_og(og) {
  const beerog = $('#og');
  if (!is_valid_beer_og(og)) {
    if (!beerog.hasClass('invalid')) {
      beerog.addClass('invalid');
    }
    return;
  }

  beerog.removeClass('invalid');
  beerog.val(og);
}

function update_beer_details(svg, deets) {
  console.log('update-beer-details: ', deets);
  update_beer_name(deets.name, svg);
  update_beer_color(deets.color_srm, svg);
  update_beer_og(deets.og);

  lastBeerDetails = deets;
}


function update_meas(meas) {
  $('#temperature').text(`${meas.temperature.toFixed(1)}C`)
  $('#gravity').text(`${meas.gravity.toFixed(3)}SG`)
  lastTiltMeas = meas;
}


function update_airlock(svg, meas) {
  const liquidPath = svg.find("#Liquid");
  const animation = svg.find("#Animation");
  //animation.attr("dur", `${meas.temperature}s`);
}


function update_tilt(svg, meas) {
  const tilt = svg.find("#Tilt");
  const tiltText = svg.find("#TiltDetails");
  const tiltFrame = svg.find("#TiltFrame");

  tiltFrame.fill(TILT_COLOR_TO_FILL[meas.color]);

  const text = `${meas.temperature.toFixed(1)}C, ${meas.gravity.toFixed(3)}SG`;
  tiltText.text(text);

  var tiltAngle = 10.0 + (meas.gravity - 1.000)*600.0;
  if (tiltAngle > 70.0) {
    tiltAngle = 70.0;
  }
  
  const newRotation = 90.0 - tiltAngle;
  tilt.attr('transform', `translate(38, 78) rotate(${newRotation})`);
}


function update_fermenter_tilt(image, meas) {
  update_meas(meas);
  update_tilt(image, meas);
  update_airlock(image, meas);
}


function update_fermenter_svg(image, contents) {
  const tmp = $('svg', contents);
  image.svg(tmp.html());
  image.viewbox(0, 0, 80, 130);

  update_beer_details(image, lastBeerDetails);
  update_fermenter_tilt(image, lastTiltMeas);
}


function submit_beer_details(svg) {
  const beerName = $('#beername').val();
  const beerColorSrm = $('#beercolor').val();
  const beerOg = $('#og').val();

  update_beer_name(beerName, svg);
  update_beer_color(beerColorSrm, svg);
  update_beer_og(beerOg);

  //socket.emit('update-details', JSON.stringify({ deets }));
}


$(() => {
  const image = SVG('#svgimage');

  $.get('/images/fermenter.svg', (content) => {
    update_fermenter_svg(image, content)
  }, 'xml');

  $('#beername').on('keyup change', () => {
    update_beer_name($('#beername').val(), image)
  });

  $('#beercolor').on('keyup change', () => {
    update_beer_color($('#beercolor').val(), image)
  });

  $('#og').on('keyup change', () => {
    update_beer_og($('#og').val())
  });

  $('#beersubmit').on('click', () => {
    submit_beer_details(image);
    return false;
  });

  socket.on('tilt-meas', (msg) => {
    const meas = JSON.parse(msg);
    update_fermenter_tilt(image, meas);
  });

  socket.on('beer-details', (msg) => {
    const deets = JSON.parse(msg);
    update_beer_details(image, deets);
  });
});
