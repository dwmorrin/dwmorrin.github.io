const width = 1000;
const height = 600;

/**
 * @param {HTMLInputElement} el
 */
const reverseRangeValue = (el) => {
  const {min, max, value} = el;
  return +min + (max - value); // find dx and apply to other value
}

const randF = (max) => Math.random() * max;
const randRad = () => randF(2 * Math.PI);
const rand = (min, max) => Math.floor(randF(max)) + min;
const coinToss = () => rand(0, 2) == 0;

class WanderingVector {
  constructor(x, y, width, height) {
    this.turn();
    this.nextRadius();
    this.x0 = width / 2;
    this.y0 = height / 2;
    this.x1 = x;
    this.y1 = y;
    this.width = width;
    this.height = height;
  }

  nextRadius() {
    this.radius = rand(50, 150);
  }

  nextBearing() {
    // adjust bearing along a restricted range
    this.bearing += randF(Math.PI / 6) * (coinToss() ? 1 : -1);
    this.bearing %= 2 * Math.PI;
  }

  turn() {
    // unrestricted bearing change
    this.bearing = randRad();
  }

  wander() {
    // get new target
    this.nextBearing();
    this.nextRadius();
    // convert to rect and test
    // if we leave the bounds: rotate a bit, shrink a bit, and try again
    let x = -1;
    let y = -1;
    let spin = 0;
    const spinDirection = coinToss() ? 1 : -1;
    while (true) {
      this.bearing += spin;
      this.bearing %= 2 * Math.PI;
      x = this.x1 + this.radius * Math.cos(this.bearing);
      y = this.y1 + this.radius * Math.sin(this.bearing);
      if (this.isInBounds(x, y))
        break;
      spin += spinDirection * Math.PI / 8;
      this.radius *= .8;
    }
    // save last coordinates
    this.x0 = this.x1;
    this.y0 = this.y1;
    // update new coordinates
    this.x1 = x;
    this.y1 = y;
  }

  isInBounds(x, y) {
    if (x <= 10 || x >= this.width - 10)
      return false;
    if (y <= 10 || y >= this.height - 10)
      return false;
    return true;
  }

  get start() {
    return [this.x0, this.y0];
  }

  get end() {
    return [this.x1, this.y1];
  }

}

const canvas = document.querySelector("canvas");
const speedCtrl = document.querySelector('input[name="speed"]');
const segmentCtrl = document.querySelector('input[name="segments"]');
const blankingCtrl = document.querySelector('input[type="checkbox"]');

if (!canvas || !speedCtrl || !blankingCtrl) throw new Error("missing HTML");

const ctx = canvas.getContext("2d");

function blank() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
}

function dot(x, y, color = "white") {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function line(x0, y0, x1, y1, color = "white") {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function makeWalk() {
  // initialize; create closure
  const vector = new WanderingVector(width / 2, height / 2, width, height);
  blank();
  dot(...vector.start, "red");
  let count = 0;

  const walk = () => {
    const segments = +segmentCtrl.value;
    let color = "white";
    // change dominate direction every 5th; mark it with a red dot
    ++count;
    if (count > segments) {
      // reset and pause (don't walk here)
      count = 0;
      color = "red";
      vector.turn();
      if (blankingCtrl.checked)
        blank();
    } else {
      // mark the ends in red
      if (count === segments)
        color = "red";
      vector.wander();
      line(...vector.start, ...vector.end);
    }
    dot(...vector.end, color);
    setTimeout(walk, reverseRangeValue(speedCtrl))
  }
  return walk;
}

setTimeout(makeWalk(), reverseRangeValue(speedCtrl))