const socket = io();

function update_details(meas) {
  $('#temperature').text(`${meas.temperature.toFixed(1)}C`)
  $('#gravity').text(`${meas.gravity.toFixed(3)}SG`)
}


function update_airlock(svg, meas) {
  const liquidPath = svg.find("#Liquid");
}


function update_tilt(svg, meas) {
  const tilt = svg.find("#Tilt");
  const tiltText = svg.find("#TiltText");

  const text = `${meas.temperature.toFixed(1)}C, ${meas.gravity.toFixed(3)}SG`;
  tiltText.text(text);

  var tiltAngle = 10.0 + (meas.gravity - 1.000)*600.0;
  if (tiltAngle > 70.0) {
    tiltAngle = 70.0;
  }
  
  const newRotation = 90.0 - tiltAngle;
  tilt.attr('transform', `translate(38, 78) rotate(${newRotation})`);
}

function update_fermenter_svg(image, contents) {
  console.log(image);
  const tmp = $('svg', contents);
  image.svg(tmp.html());
  image.viewbox(0, 0, 80, 130);

  console.log(`image height=${image.height()}, width=${image.width()}`);
}

$(document).ready(() => {

  const image = SVG('#svgimage');

  $.get('/images/fermenter.svg', (content) => {
    update_fermenter_svg(image, content)
  }, 'xml');


  socket.on('tilt-meas', (msg) => {
    meas = JSON.parse(msg);
    update_details(meas);
    update_tilt(image, meas);
    update_airlock(image, meas);
  });
});



