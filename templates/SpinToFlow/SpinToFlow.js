// https://studio-ui.teads.tv/studio/6753877077385208/editor/code/js

// Make sure to check both configs. There are two below

const spinToFlowConfig = {
    flow: {
      studioElement: Placeholder, // Name of the element from the studio that contains the images
      assetName: 'img__#__jpg',     // Naming convention for the images in your library (e.g., img_1_jpg, img_2_jpg, etc.)
      start: 1,
      end: 16
    },
  scroll: {
    start: 0, //can be < 0
    end: 1, // can be > 1
  },

  intervals: [
    { element: Slide1, start: 0 }, //values between 0 and 1; Element has to be the name of the group
    { element: FlowSlide, start: 0.2 } //values between 0 and 1; Element has to be the name of the group
  ]
}

/*******************************************************
 * SHOW ANIMATIONS
 ******************************************************/
// flipFromLeft-oc, flipFromRight-oc, flipFromTop-oc, flipFromBottom-oc, 
// flipFromBackLeft, flipFromFrontLeft, flipFromBackRight, flipFromFrontRight, 
// flipFromBackTop, flipFromFrontTop, flipFromBackBottom, flipFromFrontBottom,
// slideFromLeft, slideFromRight, slideFromTop, slideFromBottom,
// expandFromLeft, expandFromRight, expandFromTop, expandFromBottom


/*******************************************************
 * hide ANIMATIONS
 ******************************************************/
// flipToLeft-oc, flipToRight-oc, flipToTop-oc, flipToBottom-oc,
// flipToBackLeft, flipToFrontLeft, flipToBackRight, flipToFrontRight
// flipToBackTop, flipToFrontTop, flipToBackBottom, flipToFrontBottom
// slideToLeft, slideToRight, slideToTop, slideToBottom
// shrinkToLeft, shrinkToRight, shrinkToTop, shrinkToBottom

const flipFlowConfig = {
  container: SlideShowContainer,
  animation: {
    duration: 0.4,
    ease: 'none',

    next: {
      onShow: 'flipFromRight-oc',
      onHide: 'auto', // use auto to let the template decide the best animation when scrolling down or pick any of the animations above or adavance setup
    },
    previous: {
      onShow: 'auto', // use auto to let the template decide the best animation when scrolling down or pick any of the animations above or adavance setup
      onHide: 'auto', // use auto to let the template decide the best animation when scrolling down or pick any of the animations above or adavance setup
    }
  },
}

/*******************************************************
 * DO NOT TOUCH
 ******************************************************/
const animationPresets = new Map([
  ['flipFromLeft-oc', { nextShow: 'flipFromLeft-oc', nextHide: 'flipToRight-oc', prevShow: 'flipFromRight-oc', prevHide: 'flipToLeft-oc' }],
  ['flipFromRight-oc', { nextShow: 'flipFromRight-oc', nextHide: 'flipToLeft-oc', prevShow: 'flipFromLeft-oc', prevHide: 'flipToRight-oc' }],
  ['flipFromTop-oc', { nextShow: 'flipFromTop-oc', nextHide: 'flipToBottom-oc', prevShow: 'flipFromBottom-oc', prevHide: 'flipToTop-oc' }],
  ['flipFromBottom-oc', { nextShow: 'flipFromBottom-oc', nextHide: 'flipToTop-oc', prevShow: 'flipFromTop-oc', prevHide: 'flipToBottom-oc' }],

  ['flipFromBackLeft', { nextShow: 'flipFromBackLeft', nextHide: 'slideToRight', prevShow: 'slideFromRight', prevHide: 'flipToBackLeft' }],
  ['flipFromFrontLeft', { nextShow: 'flipFromFrontLeft', nextHide: 'slideToRight', prevShow: 'slideFromRight', prevHide: 'flipToFrontLeft' }],
  ['flipFromBackRight', { nextShow: 'flipFromBackRight', nextHide: 'slideToLeft', prevShow: 'slideFromLeft', prevHide: 'flipToBackRight' }],
  ['flipFromFrontRight', { nextShow: 'flipFromFrontRight', nextHide: 'slideToLeft', prevShow: 'slideFromLeft', prevHide: 'flipToFrontRight' }],

  ['flipFromBackTop', { nextShow: 'slideFromBottom', nextHide: 'flipToBackTop', prevShow: 'flipFromBackTop', prevHide: 'slideToBottom' }],
  ['flipFromFrontTop', { nextShow: 'slideFromBottom', nextHide: 'flipToFrontTop', prevShow: 'flipFromFrontTop', prevHide: 'slideToBottom' }],
  ['flipFromBackBottom', { nextShow: 'slideFromTop', nextHide: 'flipToBackBottom', prevShow: 'flipFromBackBottom', prevHide: 'slideToTop' }],
  ['flipFromFrontBottom', { nextShow: 'slideFromTop', nextHide: 'flipToFrontBottom', prevShow: 'flipFromFrontBottom', prevHide: 'slideToTop' }],

  ['slideFromLeft', { nextShow: 'slideFromLeft', nextHide: 'slideToRight', prevShow: 'slideFromRight', prevHide: 'slideToLeft' }],
  ['slideFromRight', { nextShow: 'slideFromRight', nextHide: 'slideToLeft', prevShow: 'slideFromLeft', prevHide: 'slideToRight' }],
  ['slideFromTop', { nextShow: 'slideFromTop', nextHide: 'slideToBottom', prevShow: 'slideFromBottom', prevHide: 'slideToTop' }],
  ['slideFromBottom', { nextShow: 'slideFromBottom', nextHide: 'slideToTop', prevShow: 'slideFromTop', prevHide: 'slideToBottom' }],

  ['expandFromLeft', { nextShow: 'expandFromLeft', nextHide: 'shrinkToRight', prevShow: 'expandFromRight', prevHide: 'shrinkToLeft' }],
  ['expandFromRight', { nextShow: 'expandFromRight', nextHide: 'shrinkToLeft', prevShow: 'expandFromLeft', prevHide: 'shrinkToRight' }],
  ['expandFromTop', { nextShow: 'expandFromTop', nextHide: 'shrinkToBottom', prevShow: 'expandFromBottom', prevHide: 'shrinkToTop' }],
  ['expandFromBottom', { nextShow: 'expandFromBottom', nextHide: 'shrinkToTop', prevShow: 'expandFromTop', prevHide: 'shrinkToBottom' }],
]);

function mapPercentForSlide(externalPercent, intervals) {
  const clone = [...intervals].sort((a, b) => a.start - b.start);
  const totalSlides = clone.length;
  if (!totalSlides) return externalPercent;

  const activeIndex = clone.findLastIndex(slide => externalPercent >= slide.start);
  if (activeIndex === -1) return externalPercent;

  const currentStart = clone[activeIndex].start;
  const nextStart = clone[activeIndex + 1]?.start || 1;

  const slideProgress = (externalPercent - currentStart) / (nextStart - currentStart);

  return (activeIndex + slideProgress) / totalSlides;
}

function getSlideNameFor(container, element) {
  const slides = container.eos.map(eos => eos);

  function crawlEos(slide, target) {
    if (slide.element === target) return true;

    return slide.element.eos?.some(slide => crawlEos(slide, target));
  }

  const slide = slides.find(eos => crawlEos(eos, element));
  
  return slide.element;
}

function getFlowInterval(flowGroup, intervals) {
  
  const totalIntervals = intervals.length;

  const index = intervals.findIndex(item => item.element === flowGroup);

  if (index === -1) return null;

  const start = intervals[index].start;
  const end = index + 1 < totalIntervals ? intervals[index + 1].start : 1;

  return [start, end];
}

function handleVideo(container) {
  const hasVideo = container.eos.filter(eos => eos.element.deepGetEosByType(bnt.Video).length)

  if (!hasVideo.length) return;

  const video = hasVideo[0].element.deepGetEosByType(bnt.Video)[0].element;

  video.onshowAnimationEnd.addObserver(() => video.play());
  video.onhideAnimationEnd.addObserver(() => video.pause());
}

flipFlowConfig.container.onshowAnimationEnd.addObserver(async () => {
  const getPercent = getPlayerBounds(0, 1);

  const ffConfig = { ...flipFlowConfig, scroll: spinToFlowConfig.scroll }

  handleVideo(flipFlowConfig.container)

  const flipFlow = createFlipFlow(ffConfig);
  flipFlow.start();

  const flow = await createFlow(spinToFlowConfig);

  const sortedIntervals = [...spinToFlowConfig.intervals].sort((a, b) => a.start - b.start);

  const flowSlide = getSlideNameFor(flipFlowConfig.container, spinToFlowConfig.flow.studioElement);

  const flowInterval = getFlowInterval(flowSlide, sortedIntervals);

  function loop() {
    bnt.requestAnimFrame(loop);

    const percent = getPercent();

    const ffPercent = mapPercentForSlide(percent, sortedIntervals);
    const flowPercent = remapRange(percent, flowInterval, [0, 1]);

    flipFlow.update(ffPercent);
    flow.update(flowPercent);
  }

  loop();
});


function pickAnimation(config) {
  const { next, previous, preset } = config;

  function isAuto(animation) { return animation === 'auto'; }

  function findAnimation(animation, version) {

    if (!preset.has(animation)) {
      console.warn('Unknown animation:', animation);
      return null;
    }
    return preset.get(animation)[version];
  }

  return {
    next: {
      onShow: findAnimation(next.onShow, 'nextShow'),
      onHide: isAuto(next.onHide) ? findAnimation(next.onShow, 'nextHide') : next.onHide,
    },
    previous: {
      onShow: isAuto(previous.onShow) ? findAnimation(next.onShow, 'prevShow') : previous.onShow,
      onHide: isAuto(previous.onHide) ? findAnimation(next.onShow, 'prevHide') : previous.onHide,
    }
  };
}

function createFlipFlow(config) {
  const { animation } = config;

  const slides = config.container.eos.map(eos => eos.element)
  fixSize(slides);

  const anim = pickAnimation({ ...animation, preset: animationPresets })

  const ffConfig = { ...flipFlowConfig };

  ffConfig.animation.next = anim.next;
  ffConfig.animation.previous = anim.previous;

  const flipFlow = new FlipFlow(ffConfig);

  return flipFlow;
}

function FlipFlow(config) {
  const { container, animation } = config;

  const slides = container.eos.map(eos => eos.element);
  const len = slides.length;
  const tracking = [];

  let prevIdx = 0;

  this.beforeUpdate = () => { }

  this.setDuration = (duration) => {
    slides.forEach(slide => {
      //seems to be a problem with studio config so i added both
      slide.htmlElement.querySelector('.animation').style.animationDuration = `${duration}s`
      container.getEos(slide).configs.get(bnt.get(bnt.State)).onShow.duration = duration;
      container.getEos(slide).configs.get(bnt.get(bnt.State)).onHide.duration = duration;
    })

  }

  this.setEase = (ease) => {
    slides.forEach(slide => {
      container.getEos(slide).configs.get(bnt.get(bnt.State)).onShow.ease = ease;
      container.getEos(slide).configs.get(bnt.get(bnt.State)).onHide.ease = ease;
    })
  }

  this.findAnimation = (currentIdx) => {
    if (prevIdx === undefined) return { onShow: 'none', onHide: 'none' };
    if (currentIdx > prevIdx) {
      return animation.next;
    } else {
      return animation.previous;
    }
  }

  this.setAnimation = (currentIdx, animation) => {
    container.getEos(slides[currentIdx]).configs.get(bnt.get(bnt.State)).onShow.name = animation.onShow;

    if (prevIdx === undefined) return;

    container.getEos(slides[prevIdx]).configs.get(bnt.get(bnt.State)).onHide.name = animation.onHide;
  }

  this.goToSlide = (index) => {
    const nextAnimation = this.findAnimation(index);

    this.setAnimation(index, nextAnimation);

    slides[index].show();

    slides[prevIdx].hide();
  }

  this.clamp = (num, min, max) => {
    return num <= min ? min : num >= max ? max : num;
  }

  this.getIndex = (percent, length) => {
    const float = percent * length;
    return this.clamp(Math.floor(float), 0, length - 1);
  }

  this.track = (index) => {
    if (tracking.includes(index)) return;
    tracking.push(index);

    bntTracking.trackEvent(`#${slides[index].elementId}: inView`, null);
  }

  this.isAnimated = () => {
    const animated = slides.filter(slide => slide.htmlElement.querySelector('.animation').classList.contains('animated'));

    return animated.length ? true : false
  }

  this.update = (percent) => {
    if (this.isAnimated()) return;

    const index = this.getIndex(percent, len);

    if (index === prevIdx) return;

    this.goToSlide(index);
    this.track(index);

    prevIdx = index;
  }

  this.addClassList = (list) => {
    container.htmlElement.classList.add(...list)
  }

  this.start = () => {
    this.setDuration(animation.duration);
    this.setEase(animation.ease)
    this.addClassList(['ss']);
  }
}

function fixSize(list) {
  list.forEach(el => {
    const child = el.htmlElement.querySelector('.animation > div')
    const parentStyle = { width: child.style.width, height: child.style.height }
    const animationStyle = { height: child.style.height }

    Object.assign(el.htmlElement.style, parentStyle);
    Object.assign(el.htmlElement.querySelector('.animation').style, animationStyle)
  })
}

/****************************************************
 * Flow code
 ***************************************************/

async function createFlow(config) {
	const {
		flowType,
		flow: {studioElement, assetName, start, end},
	} = config;
 
	const assets = getLibraryAssets(assetName);
 
	const flowAssets = getFlowAssets(start, end, assets);
 
	const preloadAssets = flowAssets.map(assset => loadImage(assset, studioElement));
	const preloadedImages = await Promise.all(preloadAssets);

	hideDefaultImage(studioElement);
 
	const flow = new Flow({
		images: sortImages(preloadedImages)
	})

  return flow;
}
 
function Flow(config) {
  let { images } = config;
 
	let lastPercent = undefined;
 
	const tracking = [];
 
	//Added this in case you want to simulate a reveal animation and do not wanna track that
	let shouldTrack = true;
 
	this.preventTracking = track => shouldTrack = track;	
 
	this.onUpdate = () => { }
	//Dev only. To do something when the flow udpated. 
	//You can user percent as param to use the same percent as the flow. 
	//Use this function outside flow.update (percent) = {something with percent here}
 
	this.setImages = newImages => images = newImages;
	// Le wild dev only
	// You can use this to also limit the number of assets that will animate if you need to do a pre-animation. Use your brains😅
 
	this.track = (percent) => {
		if (percent <= 0) return;
		const track = Math.floor(percent * 3);
 
		if (tracking.includes(track)) return;
		tracking.push(track);
 
		const quartile = 25;
		const name = tracking.length * quartile;
 
		bntTracking.trackEvent("#Percent seen: " + name, null);
	}
 
	this.getImages = () => images;
	//In case we need :D
 
	this.clamp = (num, min, max) => {
		return num <= min ? min : num >= max ? max : num;
	}
 
	this.getIndex = (percent, length) => {
		const float = percent * length;
		return this.clamp(Math.floor(float), 0, length - 1);
	}
 
	this.updateImages = (percent) => {
		const len = images.length;
 
		const currentIndex = this.getIndex(percent, len);
 
		for (let i = 0; i < len; i++) {
			if (currentIndex === i) { images[i].style.opacity = 1 }
			else { images[i].style.opacity = 0; }
		}
	}
 
	this.update = (percent) => {
		if (percent === lastPercent) return;
 
		lastPercent = percent;
 
		this.updateImages(percent);
		shouldTrack && this.track(percent);
	}
}

function hideDefaultImage(parent) {
	parent.htmlElement.querySelector('img').style.opacity = 0;
}
 
function sortImages(images) {
	return images.sort((a, b) => getIdFromURL(a.src) - getIdFromURL(b.src))
}
 
function getIdFromURL(url) {
	const pattern = /\/\w+?(\d+)-/;
	const match = url.match(pattern);
 
	return parseInt(match[1]);
}
 
function getFlowImages(parent) {
	return [...parent.htmlElement.querySelectorAll('.flow')];
}
 
function getMinAsssets(assets, step) {
	return assets.filter((asset, idx) => idx % step === 0)
}
 
function getFilteredAssets(assets, toFilterOut) {
	return assets.filter(asset => !toFilterOut.includes(asset))
}
 
function getLibraryAssets(assetName) {
	var regex = new RegExp(assetName.replace('#', '(\\d+)'));
 
	return Object.keys(bnt.LIBRARY).filter(function (image) {
		return regex.exec(image);
	}).sort();
}
 
function getFlowAssets(min, max, assets) {
	const start = min - 1 >= 0 ? min - 1 : min;
	const end = max;
	return [...assets].splice(start, end)
}
 
function loadImage(asset, parent) {
	const img = new Image();
	img.style.position = 'absolute';
	img.style.top = 0;	
	img.style.width = '100%';
	img.style.height = '100%';
	img.style.zIndex = -1;
	img.style.pointerEvents = 'none';
  img.style.opacity = 0;
 
	img.classList.add('flow')
 
	bnt.setSrc(img, "asset://" + asset, creative.getCanvases()[0].config.width);
 
	var parentHtml = parent.htmlElement.querySelector('.animation div');
	parentHtml.appendChild(img);
 
	bnt.setupWebkitResponsiveImageFix(img);
 
	return new Promise((resolve, reject) => {
		img.onload = img.onerror = img.onabort = () => resolve(img)
	})
}

function getPlayerBounds(start, end) {
  let percent = 0;

  const getTeadsApi = () => {
    let teadsApi;
    bnt.TeadsPlayerAddons.apiProxy.addObserver(api => teadsApi = api);
    return teadsApi;
  }

  const teadsApi = getTeadsApi()

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

/************************************************************
* ==> Check if Display viewable
************************************************************/
function isDisplayViewable() {
  if (!creative.screens[0].deepGetEosByType(bnt.Video).length) {
    bnt.TeadsPlayerAddons.apiProxy.addObserver(function (api) {
      if (api) {
        api.getStudioData().map(function (data) {
          if (data) data.display = true; else data = { display: true };
          api.setStudioData(data).map(function () {
            var state = bnt.get(bnt.State);
            if (state) {
              api.sendVideoMetadata({ width: state.canvas.config.width, height: state.canvas.config.height });
            } else {
              var fixStage = function (state) {
                api.sendVideoMetadata({ width: state.canvas.config.width, height: state.canvas.config.height }); // force player to resize slot in case it got a different size from the vast tag
                bnt.get(bnt.StateChangeDetector).stateUpdated.removeObserver(fixStage); // we do this only once -
              };
              bnt.get(bnt.StateChangeDetector).stateUpdated.addObserver(fixStage);
            }
          });
        });
      }
      if (window.parent.adApi && window.parent.adApi.bntAd) {
        window.parent.adApi.bntAd.environment.videoSlot = null;
      }
      bnt.TeadsPlayerAddons.brandingModeOnVoidClick = false;
    });
  }
}

isDisplayViewable();