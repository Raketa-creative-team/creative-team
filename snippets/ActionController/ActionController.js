Screen1.onshow.addObserver(() => {
  const percentController = getPercentController();

  function loop() {
    bnt.requestAnimFrame(loop);

    console.log(percentController.getPercent().toFixed(2));
  }

  loop();

})

function getPercentController() {
  const scrollPercent = getScrollPercent(0, 1);
  const timePercent = getTimePercent(10000, true);
  const mousePercent = getMousePercent(Shape1);
  const eventsType = getEventsType();

  const percentController = new PercentController({
    getScrollPercent: scrollPercent,
    getTimePercent: timePercent,
    getMousePercent: mousePercent,
    pointers: eventsType,
    eventName: 'onTimeToSwipe',
    element: Shape1,
    loopPercent: true
  })

  return percentController;
}

function PercentController(config) {
  const { eventName, element, pointers, loopPercent, getScrollPercent, getTimePercent, getMousePercent } = config

  const triggers = {
    Scroll: [getScrollPercent],
    Time: [getTimePercent],
    Swipe: [getMousePercent],
    ScrollSwipe: [getScrollPercent, getMousePercent],
    TimeSwipe: [getTimePercent, getMousePercent],
  }

  const triggerName = eventName.replace(/on|To|And/g, "");
  const toggle = eventName.includes('And')

  const currentTriggers = triggers[triggerName]

  if (!currentTriggers) return alert(`Invalid trigger: ${triggerName}`)

  let getCurrentPercent = currentTriggers[0]
  let percent = getCurrentPercent()
  let percentAtSwitch = percent

  const clamp = (p) => {
    if (loopPercent) return ((p % 1) + 1) % 1
    return Math.max(0, Math.min(1, p))
  }

  this.getPercent = () => {
    const delta = getCurrentPercent() - percentAtSwitch
    return clamp(percent + delta)
  }

  const switchTo = (trigger) => {
    if (!trigger) return

    percent = this.getPercent()
    getCurrentPercent = trigger
    percentAtSwitch = getCurrentPercent()
  }

  element.htmlElement.addEventListener(pointers.down, () => switchTo(currentTriggers[1]))

  if (toggle) {
    element.htmlElement.addEventListener(pointers.up, () => switchTo(currentTriggers[0]))
    element.htmlElement.addEventListener(pointers.cancel, () => switchTo(currentTriggers[0]))
  }
}

function getTimePercent(timeframe, shouldReverse) {
  let percent = 0;

  const stopwatch = new bnt.Stopwatch()
  stopwatch.play()

  adController.onsuspend.addObserver(() => stopwatch.pause())
  adController.onresume.addObserver(() => stopwatch.play())

  const remapPercent = (val) => {
    return 1 - Math.abs(2 * val - 1)
  }

  return function () {
    const delta = stopwatch.getTime();

    if (delta > timeframe) {
      stopwatch.stop();
      stopwatch.play();
    };

    percent = delta / timeframe;

    if (shouldReverse) percent = remapPercent(percent);

    return Math.min(Math.abs(percent), 1);
  }
}

function getEventCoords() {
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
      down: "touchstart",
      up: "touchend",
      move: "touchmove",
      cancel: "touchcancel"
    }
  }

  return {
    down: "mousedown",
    up: "mouseup",
    move: "mousemove",
    cancel: "mouseleave"
  }
}

function getMousePercent(element) {
  const events = getEventsType();
  const getCoords = getEventCoords();

  const totalWidth = element.htmlElement.offsetWidth;

  let startingXY = undefined;
  let percent = 0;
  let startPercent = 0;

  element.htmlElement.addEventListener(events.down, (evt) => {
    startingXY = getCoords(evt);
    startPercent = percent;
  });

  element.htmlElement.addEventListener(events.up, () => { startingXY = undefined; });
  element.htmlElement.addEventListener(events.cancel, () => { startingXY = undefined; });

  document.addEventListener(events.move, (evt) => {
    if (!startingXY) return;

    const currentXY = getCoords(evt);
    const deltaX = currentXY.x - startingXY.x;

    const newPercent = startPercent + deltaX / totalWidth;
    const loopedPercent = ((newPercent % 1) + 1) % 1;

    percent = loopedPercent;

    startingXY = currentXY;
    startPercent = percent;
  });

  return function () { return percent; }
}

function getScrollPercent(start, end) {
  let percent = 0;

  const getTeadsApi = () => {
    let teadsApi;
    bnt.TeadsPlayerAddons.apiProxy.addObserver(api => teadsApi = api);
    return teadsApi;
  }

  const remapRange = (val, fromRange, toRange) => {
    return Math.max(toRange[0], Math.min(toRange[1], (val - fromRange[0]) / (fromRange[1] - fromRange[0]) * toRange[1]))
  }

  let teadsApi = getTeadsApi()

  return function () {
    const api = teadsApi || getTeadsApi();

    if (!api) return percent;

    api.getSlotBounds().map(function (slotBounds) {
      const topWindowHeight = slotBounds.viewportHeight;
      const playerTop = slotBounds.top;
      const playerHeight = slotBounds.height;

      const playerSizeInPerc = playerHeight / topWindowHeight;

      const minEdge = -playerSizeInPerc;
      const maxEdge = 1 + playerSizeInPerc;

      const minPerc = Math.max(minEdge, start + playerSizeInPerc);
      const maxPerc = Math.min(maxEdge, end);

      percent = 1 - playerTop / topWindowHeight;

      percent = remapRange(percent, [minPerc, maxPerc], [0, 1])
    });

    return percent;
  };
}
