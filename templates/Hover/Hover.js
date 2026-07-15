// https://studio-ui.teads.tv/studio/6753877077358492/editor/code/js

const hoverConfig = {
  screen: Screen1,

  autoRevealAt: false,        // Percentage (10-100) of canvas area that must be revealed to trigger autoReveal, false if auto reveal not needed

  ui: {
    container: CanvasBox,   // Studio HTML element
    brushGroup: Brushes,      // Group containing brush images, hidden
    frontElement: FrontElement, // Image that gets "scratched off" (starts hidden, drawn on canvas)
    backElement: BackElement,   //Image revealed underneath
    hintElement: HoverAnimationElement, //  Visual hint/icon showing users where to interact (auto-hides on interaction)
  },

  smoke: {
    size: 200,                  // Initial diameter of each brush stroke in pixels
    alphaDuration: 1000,          // Time in milliseconds for brush growth before fading (higher = slower size increase)
    sizeDuration: 1000,      // Time in milliseconds for Opacity reduction per frame (higher = slower fade out)
  },

  preview: {
    duration: 1800,             // Animation duration in milliseconds, 0 to deactivate preview
    delay: 2000,                // Milliseconds of inactivity before preview starts
  },

};

hoverConfig.screen.onshow.addObserver(function () {
  if (isVertical(hoverConfig.ui.container.htmlElement)) return displayErrorMessage();

  initHover(hoverConfig);
  hoverConfig.screen.onshow.removeObserver(arguments.callee);
})

async function initHover(config) {
  const { autoRevealAt, ui, smoke, preview } = config;
  const { container, brushGroup, frontElement, backElement, hintElement } = ui;
  let raf, getCoords;

  const canvas = createCanvas(container);
  const ctx = canvas.getContext('2d');
  const canvasSize = { width: canvas.offsetWidth, height: canvas.offsetHeight };

  const events = getEventsType();
  const scaleCoords = getScaledCoords();

  const hintDelay = smoke.sizeDuration + smoke.alphaDuration;
  toggleHint({ container, canvas, events, hintElement, hintDelay });

  const getUserCoords = getPageXY({ element: container, events, scaleCoords });

  const getPercent = getHoverPercent();
  const trackHover = getHoverTracking();

  const brushes = await loadImages(brushGroup.eos.map(eos => eos.element));
  const front = await loadImages([frontElement]);

  frontElement.hide();

  if (preview.duration)
    getCoords = new PathGenerator({ duration: preview.duration, delay: preview.delay, points: getPoints(canvasSize) }).getPathCoords;
  else
    getCoords = getUserCoords;

  canvas.addEventListener(events.start, () => getCoords = getUserCoords);

  const getNewConfig = () => {
    const c = { ...smoke };

    const index = Math.round(Math.random() * (brushes.length - 1));

    c.img = brushes[index];
    c.coords = getCoords();

    c.ctx = ctx;
    return c;
  }

  function loop() {
    raf = bnt.requestAnimFrame(loop);

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(front[0], 0, 0, canvasSize.width, canvasSize.height);
    ctx.globalCompositeOperation = "destination-out";

    new Smoke(getNewConfig()).update();

    const percent = getPercent(canvas, getUserCoords());

    if (!percent) return;

    trackHover(percent);

    onHoverEnd(autoRevealAt, percent, container);
  }

  container.onhideAnimationEnd.addObserver(() => {
    bnt.cancelAnimFrame(raf)
    if (backElement instanceof bnt.Video) backElement.play();
  });

  loop();
}

function toggleHint(config) {
  const { canvas, events, hintElement, hintDelay } = config;
  let hintTO;

  canvas.addEventListener(events.start, () => {
    clearTimeout(hintTO);
    hintElement.hide();
  });

  canvas.addEventListener(events.up, () => hintTO = setTimeout(hintElement.show, hintDelay));
  canvas.addEventListener(events.cancel, () => hintTO = setTimeout(hintElement.show, hintDelay));

  container.onhideAnimationEnd.addObserver(() => clearTimeout(hintTO));
}

function getPageXY(config) {
  const { element, events, scaleCoords } = config;
  const offsetL = element.htmlElement.offsetLeft;
  const offsetT = element.htmlElement.offsetTop;
  let coords = {};

  element.htmlElement.addEventListener(events.move, (e) => {
    e.preventDefault();
    const { x, y } = scaleCoords(e);
    coords = { x: x - offsetL, y: y - offsetT };
  }, { passive: false });

  element.htmlElement.addEventListener(events.up, (e) => coords = { x: null, y: null });
  element.htmlElement.addEventListener(events.cancel, (e) => coords = { x: null, y: null });

  return () => coords
}

function onHoverEnd(autoRevealAt, percent, container) {
  if (autoRevealAt && percent >= autoRevealAt) container.hide();
}

function getHoverPercent() {
  const gridCols = 3;
  const gridRows = 3;
  const tracking = new Map();
  const totalCells = gridCols * gridRows;

  return (canvas, coords) => {
    if (coords?.y == null || coords?.x == null) return null;

    const x = Math.floor(coords.x / (canvas.offsetWidth / gridCols));
    const y = Math.floor(coords.y / (canvas.offsetHeight / gridRows));

    const key = '' + x + y;

    if (tracking.has(key)) return null;
    tracking.set(key, true);

    const values = tracking.size;

    const percent = values / totalCells;
    return Math.floor(percent * 10) * 10;
  }
}

function getHoverTracking() {
  let lastPercent = null;

  return (percent) => {
    if (!percent || percent == lastPercent) return;
    lastPercent = percent;

    trackEvent('#seen: ' + percent + '%', false, true);
  }
}

function createCanvas(element) {
  const parent = element.htmlElement.querySelector('.animation > div');

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  canvas.width = element.htmlElement.offsetWidth;
  canvas.height = element.htmlElement.offsetHeight;

  parent.appendChild(canvas);

  return canvas;
}

function isVertical(canvas) {
  const screenIsVertical = creative.canvases[0].getAspectRatio() < 0.8;
  const canvasIsVertical = (canvas.offsetWidth / canvas.offsetHeight) < 0.8;

  return screenIsVertical && canvasIsVertical
}

function loadImages(studioImages) {
  const imgElements = studioImages.map(img => img.htmlElement.querySelector("img"));

  const loadImage = async (img) => {
    return new Promise((resolve, reject) => {
      if (img.complete)
        resolve(img)
      else
        img.onload = () => resolve(img);

      img.onerror = reject;
    });
  }
  return Promise.all(imgElements.map(loadImage));
}

function getPoints(canvasSize) {
  const { width, height } = canvasSize;

  return [
    { start: { x: 0, y: height / 2 }, end: { x: width / 2, y: 0 } },
    { start: { x: 0, y: height / 2 }, end: { x: width / 2, y: height } },
    { start: { x: width, y: height / 2 }, end: { x: width / 2, y: 0 } },
    { start: { x: width, y: height / 2 }, end: { x: width / 2, y: height } },
  ];
}

function PathGenerator(config) {
  const { delay, duration, points } = config;

  const stopwatch = new bnt.Stopwatch();
  stopwatch.play();

  this.getStartingPoint = () => {
    const newPointId = Math.floor(Math.random() * points.length);
    
    return points[newPointId];

  };

  this.shouldReset = () => {
    return stopwatch.getTime() > delay + duration;
  };

  this.reset = () => {
    stopwatch.stop();
    stopwatch.play();

    currentPoint = this.getStartingPoint();
  }

  let currentPoint = this.getStartingPoint();

  this.getPathCoords = () => {
    if (this.shouldReset()) this.reset();

    const percent = (stopwatch.getTime() - delay) / duration;

    const totalDistanceX = currentPoint.end.x - currentPoint.start.x;
    const totalDistanceY = currentPoint.end.y - currentPoint.start.y;

    const curveFactor = 2 - percent;

    const progressX = percent;
    const progressY = percent * curveFactor;

    return {
      x: currentPoint.start.x + totalDistanceX * progressX,
      y: currentPoint.start.y + totalDistanceY * progressY
    };
  };

}

function Smoke(config) {
  const { size, sizeDuration, alphaDuration, ctx, coords, img } = config;

  const maxSize = size * 2;
  const angle = Math.random() * 360;

  const sw = new bnt.Stopwatch();
  sw.play();

  this.getAlpha = function () {
    return 1 - Math.max(sw.getTime() - sizeDuration, 0) / alphaDuration;
  }

  this.getSize = function () {
    return maxSize * Math.min(sw.getTime() / sizeDuration, 1)
  }

  this.hasFinished = function () {
    return sw.getTime() - sizeDuration - alphaDuration > 0;
  }

  this.update = function () {
    if (coords?.x == null || coords?.y == null) return;

    if (this.hasFinished()) return sw.stop();

    bnt.requestAnimFrame(() => this.update())

    const size = this.getSize();
    const alpha = this.getAlpha();

    ctx.save();
    ctx.translate(coords.x, coords.y);
    ctx.rotate(angle);

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, - size / 2, - size / 2, size, size);

    ctx.restore();
  }
}

function getScaledCoords() {
  return (evt) => {
    const scale = creative.canvases[0].config.width / window.innerWidth;

    const x = evt.touches?.[0]?.pageX ? evt.changedTouches[0].pageX : evt.pageX;
    const y = evt.touches?.[0]?.pageY ? evt.changedTouches[0].pageY : evt.pageY;

    return { x: x * scale, y: y * scale }
  }
}

function getEventsType() {
  if (DeviceContext.isTablet() || DeviceContext.isMobile()) {
    return {
      start: "touchstart",
      up: "touchend",
      move: "touchmove",
      cancel: "touchcancel"
    }
  }

  return {
    start: "mouseenter",
    up: "mouseup",
    move: "mousemove",
    cancel: "mouseleave"
  }
}


const trackEvent = (() => {
  const trackedActions = [];
  const debug = false;
  return (actionName, engagement, trackOnce) => {
    if (trackOnce && trackedActions.includes(actionName)) return;

    bntTracking.trackEvent(actionName, null);
    if (engagement)
      adController.interaction.update(actionName);

    if (trackOnce)
      trackedActions.push(actionName);

    if (debug)
      console.log(actionName);
  }
})();


function displayErrorMessage() {
  const errorContainer = document.createElement("div");
  errorContainer.textContent = "Hover Cannot Be Displayed on Vertical Demos";
  errorContainer.classList.add("errorMessage");

  document.body.firstChild.appendChild(errorContainer);
}
