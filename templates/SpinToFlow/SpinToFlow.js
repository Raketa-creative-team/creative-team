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
            onShow: 'flipFromTop-oc',
            onHide: 'auto', // use auto to let the template decide the best animation when scrolling down or pick any of the animations above or adavance setup
        },
        previous: {
            onShow: 'auto', // use auto to let the template decide the best animation when scrolling down or pick any of the animations above or adavance setup
            onHide: 'auto', // use auto to let the template decide the best animation when scrolling down or pick any of the animations above or adavance setup
        }
    },
    scroll: {
        start: 0,
        end: 1,
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

flipFlowConfig.container.onshowAnimationEnd.addObserver(initFlipFlow.bind(null, flipFlowConfig));

function initFlipFlow(config) {
    const {animation} = config;

    const slides = config.container.eos.map(eos => eos.element)
    fixSize(slides);

    const getPercent = getPlayerBounds(0, 1);

    const anim = pickAnimation({...animation, preset: animationPresets})

    const ffConfig = {...flipFlowConfig, getPercent };
    ffConfig.animation.next = anim.next;
    ffConfig.animation.previous = anim.previous;

    const flipFlow = new FlipFlow(ffConfig);
    flipFlow.start();

    function loop() {
        bnt.requestAnimFrame(loop);

        flipFlow.update();
    }

    loop();
}

function FlipFlow(config) {
    const {container, getPercent, animation} = config;

    const slides = container.eos.map(eos => eos.element);
    const len = slides.length;
    const tracking = [];

    let percent = getPercent();
    let prevIdx;

    this.getPercent = () => percent;
    this.setPercent = newPercent => percent = newPercent;

    this.beforeUpdate = () => { }

    this.setDuration = (duration) => {
        slides.forEach(slide => {
            //seems to be a probleme with studio config so i added both
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

    this.gotToSlide = (index) => {
        const nextAnimation = this.findAnimation(index);

        this.setAnimation(index, nextAnimation);

        slides[index].show();

        if (prevIdx === undefined) return;

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
        const animated = slides.filter(slide=> slide.htmlElement.querySelector('.animation').classList.contains('animated'));
        
        return animated.length ? true : false
    }

    this.update = () => {
        if (this.isAnimated()) return;

        percent = getPercent();

        const index = this.getIndex(percent, len);

        if (index === prevIdx) return;

        this.gotToSlide(index);
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

function remapRange(val, fromRange, toRange) {
    return Math.max(toRange[0], Math.min(toRange[1], (val - fromRange[0]) / (fromRange[1] - fromRange[0]) * toRange[1]))
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

const flowConfig = {
	flowType: 'onScroll', // onScroll, onSwipe, onTime
 
	image: {
		studioElement: Placeholder, // Name of the element from the studio that contains the images
		assetName: 'img_#_jpg',     // Naming convention for the images in your library (e.g., img_1_jpg, img_2_jpg, etc.)
		start: 1, 
		end: 30 
	},
	preloadStep: 3, // Flow will start after preloading a minimum number of assets (as a percentage of total assets)
 
	onTime: {
		speed: 1000, // Duration of the full animation cycle in milliseconds (applies only for flowType 'onTime')
		reverse: true, // If set to true, it will start from the last frame when ending a cycle. Eg: From 1 -> 2-> 3-> etc -> 32 -> 31 -> 30 -> etc -> 1 if set to true. 
                       // If set to false,it will always restart from 1 after the last frame.
	},
	onScroll: {
		inViewStart: -0.5, // When to start the flow compared to player in view. 
		                   // To start earlier use a value between -0.5 and 0. 
					       // To make the flow start later use a value over 0
		inViewEnd: 1       // When to end the flow compared to player in view. 
		                   // To end later use a value between 1 and 1.5. 
						   // To make it end earlier use a value under 1
	}
}
 
flowConfig.image.studioElement.onshowAnimationStart.addObserver(initFlow.bind(null, flowConfig));
flowConfig.image.studioElement.onhideAnimationStart.removeObserver(initFlow);
 
async function initFlow(config) {
	const {
		flowType,
		image: {studioElement, assetName, start, end},
		preloadStep,
		onTime: {speed, reverse},
		onScroll: {inViewStart, inViewEnd},
	} = config;
 
	const assets = getLibraryAssets(assetName);
 
	const flowAssets = getFlowAssets(start, end, assets);
 
	const minAssets = getMinAsssets(flowAssets, preloadStep);
	const preloadAssets = minAssets.map(assset => loadImage(assset, studioElement));
	const preloadedImages = await Promise.all(preloadAssets);
 
	hideDefaultImage(studioElement);
 
	const getPercent = getFlowType(flowType);
	const percentParams = getPercentParams({ flowType, speed, reverse, inViewStart, inViewEnd, imageFrame: studioElement });
 
	const flow = new Flow({
		getPercent: getPercent(...percentParams),
		images: sortImages(preloadedImages)
	})
 
	flow.animate();
 
	if (preloadStep === 1 || preloadStep === 0) return;
 
	const remaningAssets = getFilteredAssets(flowAssets, minAssets);
 
	if (!remaningAssets) return;
 
	const afterPreload = remaningAssets.map(asset => loadImage(asset, studioElement));
 
	await Promise.all(afterPreload);
 
	const flowImages = getFlowImages(studioElement);
	const sortedFlowImages = sortImages(flowImages);
 
	flow.setImages(sortedFlowImages);
	flow.updateImages(getPercent(...percentParams)()); // IOS fix opacity and rendering
}
 
function Flow(config) {
	let {getPercent, images} = config;
 
	let lastPercent = undefined;
 
	const tracking = [];
 
	//Added this in case you want to simulate a reveal animation and do not wanna track that
	let shouldTrack = true;
 
	this.preventTracking = track => shouldTrack = track;	
 
	this.onUpdate = () => { }
	//Dev only. To do something when the flow udpated. 
	//You can user percent as param to use the same percent as the flow. 
	//Use this function outside flow.update (percent) = {something with percent here}
 
	this.setGetPercent = newGetPercent => getPercent = newGetPercent;
	// Le wild dev only
	// Use this to change how the update. Eg. from swipe to scroll after the creative has been inited
 
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
 
	this.animate = () => {
		bnt.requestAnimFrame(this.animate)
		const percent = getPercent();
 
		if (percent === lastPercent) return;
 
		lastPercent = percent;
 
		this.updateImages(percent);
		shouldTrack && this.track(percent);
	}
}
 
function getFlowType(flowType) {
	switch (flowType) {
		case 'onTime':
			return getPercentOnTime
			break;
		case 'onSwipe':
			return getMousePercent
			break;
		default:
			return getPlayerBounds
	}
}
 
function getPercentParams(config) {
	const {flowType, speed, reverse, inViewStart, inViewEnd, imageFrame} = config;
 
	switch (flowType) {
		case 'onTime':
			return [speed, reverse]
			break;
		case 'onSwipe':
			return [imageFrame]
			break;
		default:
			return [inViewStart, inViewEnd]
	}
}
 
function getMousePercent(element) {
	const events = getEventsType();
	const getCoords = getEventCoords();

	const totalWidth = element.htmlElement.offsetWidth;

	let startingXY = undefined;
	let percent = 0;
	let startPercent = 0;

	element.htmlElement.addEventListener(events.pointerDown, (evt) => {
		startingXY = getCoords(evt);
		startPercent = percent;
	});

	element.htmlElement.addEventListener(events.pointerUp, () => { startingXY = undefined; });
	element.htmlElement.addEventListener(events.pointerCancel, () => { startingXY = undefined; });

	element.htmlElement.addEventListener(events.pointerMove, (evt) => {
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
 
function remapRange(val, fromRange, toRange) {
	return Math.max(toRange[0], Math.min(toRange[1], (val - fromRange[0]) / (fromRange[1] - fromRange[0]) * toRange[1]))
}
 
/************************************************************
 * ==> Set Events for device
 ***********************************************************/
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
 
/************************************************************
 * ==> Get Event page X
 ***********************************************************/
function getEventCoords() {
	if (DeviceContext.isTablet() || DeviceContext.isMobile()) {
		return function (evt) {
			var scale = creative.canvases[0].config.width / window.innerWidth
 
			return {
				x: evt.pageX = evt.touches.length ? evt.touches[0].pageX * scale : evt.changedTouches[0].pageX * scale,
				y: evt.pageY = evt.touches.length ? evt.touches[0].pageY * scale : evt.changedTouches[0].pageY * scale,
			}
		}
	}
 
	return function (evt) {
		var scale = creative.canvases[0].config.width / window.innerWidth;
 
		return {
			x: evt.pageX * scale,
			y: evt.pageY * scale
		}
	}
}
 
function getPercentOnTime(timeframe, shouldReverse) {
	let percent = 0;
	let reversed = false;
 
	const stopwatch = new bnt.Stopwatch()
	stopwatch.play()
 
	adController.onsuspend.addObserver(() => stopwatch.pause())
	adController.onresume.addObserver(() => stopwatch.play())
 
	return function () {
		const delta = stopwatch.getTime();
 
		if (delta > timeframe) {
			stopwatch.stop();
			stopwatch.play();
		};
 
		percent = delta / timeframe;
 
		if (shouldReverse && reversed) {
			percent = 1 - percent;
		}
 
		if (percent > 1 || percent < 0) reversed = !reversed;
 
		if (percent < 0) percent = 0;
		if (percent > 1) percent = 1;
 
		return percent;
	}
}
 
function getPlayerBounds(start, end) {
	let percent = 0;
 
	const getTeadsApi = () => {
		let teadsApi;
		bnt.TeadsPlayerAddons.apiProxy.addObserver(api => teadsApi = api);
		return teadsApi;
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
 
			// percent = percent > 1 ? 1 : percent < 0 ? 0 : percent;			
		});
 
		return percent;
	};
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
 
	img.classList.add('flow')
 
	bnt.setSrc(img, "asset://" + asset, creative.getCanvases()[0].config.width);
 
	var parentHtml = parent.htmlElement.querySelector('.animation div');
	parentHtml.appendChild(img);
 
	bnt.setupWebkitResponsiveImageFix(img);
 
	return new Promise((resolve, reject) => {
		img.onload = img.onerror = img.onabort = () => resolve(img)
	})
}
 
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
        if (!initialPosition ?.x || !evt.cancelable) return;
 
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
        if (!initialPosition ?.x) return;
 
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