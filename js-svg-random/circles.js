const animation = makeAnimation({
  delayTime: 0.05,
  maxCircles: 10,
  container: document.body,
});
animation.start();
window.setTimeout(animation.help, 2000);

/**
 * @typedef {Object} AnimationConfig
 * @property {number} delayTime - seconds until a new circle appears
 * @property {number} maxCircles - maximum circles to have in SVG at same time
 * @property {HTMLElement} container - a <svg> will be added to this element
 */

/**
 * main function, holds the animation state, sets keyboard listeners
 * @param {AnimationConfig} config
 */
function makeAnimation(config) {
  const drawingContainer = create("svg");
  config.container.append(drawingContainer);

  const frameRate = 30;
  const framePeriod = 1 / frameRate;
  let count = 0;
  let dx = -1;
  let dy = 1;
  let frame = 0;
  let lastTimestamp = 0;
  let stopped = false;

  const moveCircles = (circle) =>
    applyAttributes(circle, {
      cx: +circle.getAttribute("cx") + dx,
      cy: +circle.getAttribute("cy") + dy,
    });

  const animation = (timestamp) => {
    if (stopped) return;
    // use timestamp to determine if enough time has passed to produce a frame
    const elapsed = timestamp - lastTimestamp;
    if (elapsed < framePeriod * 1000)
      return window.requestAnimationFrame(animation);
    // we are good to produce a new frame
    lastTimestamp = timestamp;
    frame++;
    // moveCircles happens every frame
    Array.from(drawingContainer.querySelectorAll("circle")).forEach(
      moveCircles
    );
    // adding/removing circles takes a variable number of frames to occur
    if (frame % framesPerAnimation(framePeriod, config.delayTime) === 0) {
      ++count;
      if (count > config.maxCircles) {
        drawingContainer.removeChild(drawingContainer.firstChild);
      }
      drawingContainer.append(createRandomCircle());
    }
    window.requestAnimationFrame(animation);
  };

  const start = () => {
    stopped = false;
    window.requestAnimationFrame(animation);
  };
  const stop = () => {
    stopped = true;
  };

  const helpText =
    "? to display help\n" +
    "spacebar to start/stop\n" +
    "arrow keys to change movement\n" +
    "shift + up/down to change circle add/remove delay";

  const help = () => window.alert(helpText);

  const handleKeydown = ({ key, shiftKey }) => {
    switch (key) {
      case "?":
        help();
        return;
      case " ":
        stopped = !stopped;
        if (!stopped) start();
        return;
      case "j":
      case "ArrowDown":
        if (shiftKey) config.delayTime += 0.1;
        else ++dy;
        return;
      case "k":
      case "ArrowUp":
        if (shiftKey) {
          if (config.delayTime > 0.1) config.delayTime -= 0.1;
        } else --dy;
        return;
      case "h":
      case "ArrowLeft":
        --dx;
        return;
      case "l":
      case "ArrowRight":
        ++dx;
        return;
      default:
        return;
    }
  };

  config.container.addEventListener("keydown", handleKeydown);

  return { help, start, stop };
}

/**
 * Wrapper for HTMLElement.setAttribute
 * @param {HTMLElement} element
 * @param {{[k: string]: number | string}} attributes
 */
function applyAttributes(element, attributes = {}) {
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/**
 * @param {string} name
 * @param {{[k: string]: number | string}} attributes
 * @returns {HTMLElement | SVGElement} element
 */
function create(name, attributes = {}) {
  if (isSvgName(name)) {
    return applyAttributes(
      document.createElementNS("http://www.w3.org/2000/svg", name),
      attributes
    );
  }
  return applyAttributes(document.createElement(name), attributes);
}

/**
 * Creates a new SVG circle object with random size and color
 * @returns {SVGCircleElement}
 */
function createRandomCircle() {
  const randomX = randomRange({ min: 0, max: window.innerWidth });
  const randomY = randomRange({ min: 0, max: window.innerHeight });
  const randomRadius = randomRange({ min: 10, max: 100 });
  return create("circle", {
    cx: randomX(),
    cy: randomY(),
    r: randomRadius(),
    fill: randomHexColorString(),
  });
}

/**
 * Helper to use a delay in seconds with frames
 * @param {number} frameRate
 * @param {number} delay
 * @returns {number} frames per animation
 */
function framesPerAnimation(frameRate, delay) {
  return Math.floor(delay / frameRate);
}

/**
 * Helper for the `create` function to register which names are SVG
 * @param {string} name
 * @returns {boolean}
 */
function isSvgName(name) {
  switch (name) {
    case "svg":
    case "circle":
      return true;
    default:
      return false;
  }
}

/**
 * Generate random non-negative integers from a given range
 * @param {{min: number; max: number}} options
 */
function randomRange({ min = 1, max = 10 } = {}) {
  return function () {
    return randomNumber({ min, max });
  };
}

/**
 * Generate random non-negative integers
 * @param {{min: number; max: number}} options
 */
function randomNumber({ min = 0, max = 1 } = {}) {
  return Math.round(Math.random() * (max - min) + min);
}

/**
 * @returns {string} hex color string, e.g. "#FFFFFF"
 */
function randomHexColorString() {
  return `#${randomNumber({ min: 0, max: 16 ** 6 - 1 }).toString(16)}`;
}
