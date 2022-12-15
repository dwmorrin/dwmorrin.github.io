const width = 1000;
const height = 600;

const rand = (min, max) => Math.floor(Math.random() * max) + min;
const coinToss = () => rand(0, 2) == 0;
const randV = (min, max) => rand(min, max) * (coinToss() ? 1 : -1);
// prevent line from leaving the canvas
const normalize = (result, max) => {
  if (result <= 0) return 10;
  if (result >= max) return max - 10;
  return result;
};

const canvas = document.querySelector("canvas");

if (!canvas) throw new Error("no canvas found");

const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.fillRect(0, 0, width, height);
ctx.strokeStyle = "white";
ctx.fillStyle = "red";

const origin = [width / 2, height / 2];

function dot(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
}

dot(...origin);

let cursor = [...origin];
let count = 0;
let dominate = coinToss() ? 'x' : 'y';
let direction = coinToss() ? 1 : -1;

function walk() {
  ctx.beginPath();
  ctx.moveTo(...cursor);
  const dx = dominate === 'x' ? (rand(50, 75) * direction) : randV(10,40);
  const dy = dominate === 'y' ? (rand(50, 75) * direction) : randV(10,40);
  cursor = [normalize(cursor[0] + dx, width), normalize(cursor[1] + dy, height)];
  ctx.lineTo(...cursor);
  ctx.stroke();
  ++count;
  if (count % 4 === 0) {
    count = 0;
    dominate = coinToss() ? 'x' : 'y';
    direction = coinToss() ? 1 : -1;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "red";
  }
  else
    ctx.fillStyle = "white";
  dot(...cursor);
}

setInterval(walk, 100);