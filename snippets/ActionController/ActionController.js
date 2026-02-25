// https://studio-ui.teads.tv/studio/6753877077332014/editor/code/js

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
    events: eventsType,
    triggerName: 'onTime',
    element: Shape1,
    loopPercent: false
  })

  return percentController;
}

function PercentController(config) {
  const { getScrollPercent, getTimePercent, getMousePercent, triggerName, element, events, loopPercent } = config;

  const triggers = new Map([
    ['onScroll', [getScrollPercent]],
    ['onTime', [getTimePercent]],
    ['onSwipe', [getMousePercent]],
    ['onScrollAndSwipe', [getScrollPercent, getMousePercent]]
  ])

  currentTrigger = triggers.get(triggerName);

  let activeGetPercent = currentTrigger[0];

  let percentAtSwitch = activeGetPercent();
  let percent = activeGetPercent();
  let delta = 0;

  const getFinalPercent = (percent) => {
    if (loopPercent) return percent % 1;

    return Math.min(percent, 1)
  }

  this.getPercent = () => {
    const currentPercent = activeGetPercent();
    delta = currentPercent - percentAtSwitch;

    return getFinalPercent(percent + delta)
  }

  const switchToMouse = () => {
    if (!currentTrigger[1]) return;

    activeGetPercent = currentTrigger[1];
    percentAtSwitch = activeGetPercent();

    percent += delta;
  }

  const switchToScroll = () => {
    if (!currentTrigger[1]) return;

    activeGetPercent = currentTrigger[0];
    percentAtSwitch = activeGetPercent();

    percent += delta;
  }

  element.htmlElement.addEventListener(events.pointerDown, switchToMouse);

  element.htmlElement.addEventListener(events.pointerUp, switchToScroll);
  element.htmlElement.addEventListener(events.pointerCancel, switchToScroll);
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
      pointerDown: "touchstart",
      pointerUp: "touchend",
      pointerMove: "touchmove",
      pointerCancel: "touchcancel"
    }
  }

  return {
    pointerDown: "mousedown",
    pointerUp: "mouseup",
    pointerMove: "mousemove",
    pointerCancel: "mouseleave"
  }
}

function getMousePercent(element) {
  const events = getEventsType();
  const getCoords = getEventCoords();

  const remapRange = (val, fromRange, toRange) => {
    return Math.max(toRange[0], Math.min(toRange[1], (val - fromRange[0]) / (fromRange[1] - fromRange[0]) * toRange[1]))
  }

  const totalWidth = element.htmlElement.offsetWidth;
  const offset = Math.round(totalWidth / 100) * 5; // Maybe we need better here

  let startingXY = undefined;
  let percent = 0;

  function updatePercent(evt) {
    if (!startingXY) return;

    const currentXY = getCoords(evt);
    const adjustedX = remapRange(currentXY.x, [offset, totalWidth - offset], [0, totalWidth]);

    percent = adjustedX / totalWidth;
  }

  element.htmlElement.addEventListener(events.pointerDown, (evt) => { startingXY = getCoords(evt); updatePercent(evt); });
  document.addEventListener(events.pointerUp, (evt) => { startingXY = undefined });
  document.addEventListener(events.pointerCancel, (evt) => { startingXY = undefined });

  document.addEventListener(events.pointerMove, (evt) => { updatePercent(evt); });

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
