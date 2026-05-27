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
    duration: 1800,             // Animation duration in milliseconds
    enabled: true,              // true, to Reveal parts of backImage if user doesn't interact
    delay: 3000,                // Milliseconds of inactivity before preview starts
  },

};

hoverConfig.screen.onshow.addObserver( function (){
  initHover(hoverConfig);
  hoverConfig.screen.onshow.removeObserver(arguments.callee);
})

async function initHover(config) {
  const { autoRevealAt, ui, smoke, preview } = config;
  const { container, brushGroup, frontElement, backElement, hintElement } = ui;
  let raf;

  const canvas = createCanvas(container);
  const ctx = canvas.getContext('2d');
  const canvasSize = { width: canvas.offsetWidth, height: canvas.offsetHeight };

  const events = getEventsType();
  const scaleCoords = getScaledCoords();

  const hintDelay = smoke.sizeDuration + smoke.alphaDuration;
  toggleHint({canvas, events, hintElement, hintDelay});

  const getUserCoords = getPageXY({ element: container, events, scaleCoords });

  const getPercent = getHoverPercent();
  const trackHover = getHoverTracking();

  const brushes = await loadImages(brushGroup.eos.map(eos => eos.element));
  const front = await loadImages([frontElement]);

  frontElement.hide();

  const coordsGenerator = new PathGenerator({ duration: preview.duration, delay: preview.delay, points: getPoints(canvasSize) })
  let getCoords = coordsGenerator.getPathCoords.bind(coordsGenerator);

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
  const { canvas, events, hintElement, delay } = config;
  let hintTO;

  canvas.addEventListener(events.start, () => {
    clearTimeout(hintTO);
    hintElement.hide();
  });

  canvas.addEventListener(events.up, () => hintTO = setTimeout(hintElement.show, delay));
  canvas.addEventListener(events.cancel, () => hintTO = setTimeout(hintElement.show, delay));
}

function getPageXY(config) {
  const { element, events, scaleCoords } = config;
  const offsetL = element.htmlElement.offsetLeft;
  const offsetT = element.htmlElement.offsetTop;
  let coords = {};
  
  element.htmlElement.addEventListener(events.move, (e) => {
    const {x, y} = scaleCoords(e);
    coords = {x: x - offsetL, y: y - offsetT};
   });

  element.htmlElement.addEventListener(events.up, (e) => coords = { x: null, y: null });
  element.htmlElement.addEventListener(events.cancel, (e) => coords = { x: null, y: null });

  return () => coords
}

function onHoverEnd(autoRevealAt, percent, container) {
  if (autoRevealAt && percent >= autoRevealAt) container.hide();
}

const coordsOutOfBounds = (element, coords) => {
  return (coords.y == null || coords.y < 0 || coords.y > element.offsetHeight ||
    coords.x == null || coords.x < 0 || coords.x > element.offsetWidth);
}

function getHoverPercent() {
  const gridCols = 5;
  const gridRows = 5;
  const tracking = new Map();
  const totalCells = gridCols * gridRows;

  return (screenNode, coords) => {
    if (coordsOutOfBounds(screenNode, coords)) return null;

    const x = Math.floor(coords.x / (screenNode.offsetWidth / gridCols));
    const y = Math.floor(coords.y / (screenNode.offsetHeight / gridRows));

    const key = '' + x + y;

    if (tracking.has(key)) return null;
    tracking.set(key, true);

    const values = [...tracking.values()].length;

    return percent = Math.floor((values / totalCells) * 100);
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
  let lastPointId = -1;

  const stopwatch = new bnt.Stopwatch();
  stopwatch.play();

  this.getStartingPoint = () => {
    const newPointId = Math.floor(Math.random() * points.length);

    if (newPointId == lastPointId) return this.getStartingPoint();

    lastPointId = newPointId;
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
    if (!coords || coords.x == null || coords.y == null) return;

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
  let trackedActions = [];
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



/************************************************************
 * ==> Prevent user accidental scrolly scroll
 ***********************************************************/
function preventAccidentalScroll() {
  let initialPosition, preventDecided = false;

  function addListeners() {
    const fsParent = document.getElementById(creative.screens[0].name).parentElement;

    fsParent.addEventListener("touchstart", touchStart, { capture: true });     // down
    fsParent.addEventListener("touchmove", touchMove);                          // move      
    fsParent.addEventListener("touchend", touchEnd, true);                      // up          
    fsParent.addEventListener("touchcancel", touchEnd);                         // cancel
  };

  function touchStart(evt) {
    initialPosition = getTouchXY(evt);
  }

  function touchMove(evt) {
    if (!initialPosition?.x || !evt.cancelable) return;

    const xy = getTouchXY(evt);
    const dX = Math.abs(xy.x - initialPosition.x);
    const dY = Math.abs(xy.y - initialPosition.y);

    const thresholdXY = 15;
    const thresholdX = 5;

    const movedEnough = dX + dY > thresholdXY;
    const isHorizontalMove = dX - dY > thresholdX;

    preventDecided = !preventDecided && movedEnough;

    if (preventDecided && isHorizontalMove) evt.preventDefault();
  }

  function touchEnd() {
    if (!initialPosition?.x) return;

    initialPosition.x = false;
    preventDecided = false;
  }

  function getTouchXY(evt) {
    const scale = creative.canvases[0].config.width / window.innerWidth;

    return {
      x: evt.touches[0].pageX * scale,
      y: evt.touches[0].pageY * scale,
    }
  }

  addListeners();
}

creative.screens[0].onshow.addObserver(function () {
  preventAccidentalScroll();

  creative.screens[0].onshow.removeObserver(arguments.callee);
});
