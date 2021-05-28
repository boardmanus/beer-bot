const $ = require('jquery');

const { SVG, registerWindow } = require('@svgdotjs/svg.js/dist/svg.node.js')
registerWindow(window, document);

const io = require('socket.io-client');
const socket = io();

const DEFAULT_BEER_DETAILS = {
  name: "Beer",
  color: "#d97556",
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


function submit_beer_details(beerName, beerColor, beerOg) {
  socket.emit('update-details', JSON.stringify({
    name: beerName, color: beerColor, og: beerOg
  }));
  return false;
}


function update_beer_details(svg, deets) {
  console.log('update-beer-details: ', deets);
  const name = svg.find("#BeerName");
  const beer = svg.find("#Beer");
  name.text(deets.name);
  beer.fill(deets.color);
  lastBeerDetails = deets;
}


function update_meas(meas) {
  console.log('update-meas: ', meas);
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
  console.log(image);
  const tmp = $('svg', contents);
  image.svg(tmp.html());
  image.viewbox(0, 0, 80, 130);

  console.log(`image height=${image.height()}, width=${image.width()}`);
  update_beer_details(image, lastBeerDetails);
  update_fermenter_tilt(image, lastTiltMeas);
}


$(() => {
  const image = SVG('#svgimage');

  $.get('/images/fermenter.svg', (content) => {
    update_fermenter_svg(image, content)
  }, 'xml');

  socket.on('tilt-meas', (msg) => {
    const meas = JSON.parse(msg);
    update_fermenter_tilt(image, meas);
  });

  socket.on('beer-details', (msg) => {
    const deets = JSON.parse(msg);
    update_beer_details(image, deets);
  });
});
