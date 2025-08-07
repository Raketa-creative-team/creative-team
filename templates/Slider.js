// https://studio-ui.teads.tv/studio/6753877077236308/editor/code/js

const sliderConfig = {
	sliderType: 'onSwipe', // onScroll, onSwipe
	slideTo: 'left', // use left, right, top, bottom. top and bottom do not work with onSwipe type;
	container: SliderContainer,
	frontElement: FrontSlide,
	backgroundElement: BackgroundSlide,

	onScroll: {
		inViewStart: 0, // when to start the slider compared to player in view. To start earlier use a value between -0.5 and 0. You and also use this to make the flow start later by using a value over 0
		inViewEnd: 1 // when to end the slider compared to player in view. To end later use a value between 1 and 1.5. You can also make this end earlier by using a value under 1
	},

	onSwipe: {
		autoReveal: {
			after: 1000,  //Change this to a number in order to reveal the background slide after a period of time. Set to null to stop auto reveal
			transition: 400 //
		},
		dragElement: Drag,
		snap: true, // Set this to false if you don't need;        
		animation: {
			reps: 3,                    // No of repetitions of the slider animation. Change here if you need less or more.
			duration: 2000,              // Travel distance duration. Change here is you need a different duration.
			travelDistance: -180,       // Travel distance of the slider animation, in px. Change here if you need a different distance. Can use negative values
		}
	},
	getPlayerStatus: getPlayerStatus(),
}

sliderConfig.container.onshowAnimationEnd.addObserver(function () {
	initSlider(sliderConfig);
	sliderConfig.container.onshowAnimationEnd.removeObserver(arguments.callee);
});

function initSlider(config) {
	const {
		sliderType,
		slideTo,
		frontElement,
		backgroundElement,
		onScroll,
		onSwipe,
		container,
		getPlayerStatus,
	} = config;

	if (hasWrongConfiguration(sliderType, slideTo)) return displayMessage();

	if (sliderType === 'onSwipe') {
		addDrag(onSwipe.dragElement, onSwipe.snap);
		togglePreviewAnimation(onSwipe);
	}

	if (sliderType === "onScroll") {
		onSwipe.dragElement && onSwipe.dragElement.hide();
	}

	applyRecursiveStyle({frontElement, style: getStyle(slideTo)})

	const getPercent = getCallbackByType(sliderType);
	const percentParams = getPercentParams({ sliderType, onScroll, onSwipe, slideTo });

	const slider = new Slider({
		getPercent: getPercent(...percentParams),
		frontElement,
		backgroundElement,
		slideTo,
		container,
		getPlayerStatus
	});

	frontElement.htmlElement.style.opacity = 0.9999; //render issue fix
	slider.animate();
	// slider.onUpdate = percent => console.log(percent) // example

	onSwipe.autoReveal.after && autoReveal({...onSwipe, slideTo}) //E prea vechi editorul, dar merge
}

function Slider(config) {
	let {getPercent, frontElement, backgroundElement, slideTo, container, getPlayerStatus} = config;

	let lastPercent = undefined;

	const frontVideo = frontElement.deepGetEosByType(bnt.Video)[0];
	const backVideo = backgroundElement.deepGetEosByType(bnt.Video)[0];

	const playVideoAt = 0.5 //play pause videos

	const tracking = [];

	const isVertical = slideTo === 'top' || slideTo === 'bottom';
	const dimension = isVertical ? 'height' : 'width';

	//Added this in case you want to simulate a reveal animation and do not wanna track that
	let shouldTrack = true;

	this.preventTracking = track => shouldTrack = track;

	this.onUpdate = (percent) => { }
	//Dev only. To do something when the flow udpated. 
	//You can user percent as param to use the same percent as the flow. 
	//Use this function outside flow.update (percent) = {something with percent here}

	this.setGetPercent = newGetPercent => getPercent = newGetPercent;
	// Le wild dev only
	// Use this to change how the update. Eg. from swipe to scroll after the creative has been inited

	this.track = (percent) => {
		if (percent <= 0) return;
		const track = Math.floor(percent * 3);

		if (tracking.includes(track)) return;
		tracking.push(track);

		const quartile = 25;
		const name = tracking.length * quartile;

		bntTracking.trackEvent("#Percent seen: " + name, null);
	}

	this.updateFrontCover = (percent) => {
		frontElement.htmlElement.style[dimension] = percent * creative.canvases[0].config[dimension] + 'px';
	}

	this.toggleVideo = (percent) => {
		const playerStatus = getPlayerStatus();

		if (playerStatus === 'suspended') return;
		
		const isPreviewOn = !!container.htmlElement.querySelector('.togglePreview');

		if (isPreviewOn) return;
		
		if (frontVideo) {
			const shouldPlayVideo = percent > playVideoAt;
			shouldPlayVideo ? frontVideo.element.play() : frontVideo.element.pause();
		}
		if (backVideo) {
			const shouldPlayVideo = percent < playVideoAt;
			shouldPlayVideo ? backVideo.element.play() : backVideo.element.pause();
		}
	}

	this.animate = () => {
		bnt.requestAnimFrame(this.animate);
		const percent = getPercent();

		this.toggleVideo(percent);

		if (percent === lastPercent) return;

		lastPercent = percent;
	
		this.updateFrontCover(percent);
		shouldTrack && this.track(percent);

		this.onUpdate(percent);
	}

	frontElement.htmlElement.style.overflow = 'hidden';
}

function getPlayerStatus() {
	let status = 'suspended';

	adController.onsuspend.addObserver(() => status = 'suspended');
	adController.onstart.addObserver(() => status = 'playing');	
	adController.onresume.addObserver(() => status = 'playing');
	adController.onplay.addObserver(() => status = 'playing');	

	return () => status;
}

this.getTeadsPlayerStatus = getPlayerStatus;

function getCallbackByType(sliderType) {
	const types = new Map([
		['onSwipe', getMousePercent],
		['onScroll', getPlayerBounds]
	])

	return types.get(sliderType)
}

function getPercentParams(config) {
	const {
		sliderType,
		slideTo,
		onScroll: {inViewStart, inViewEnd},
		onSwipe: {dragElement},
	} = config;

	const params = new Map([
		['onSwipe', [dragElement, slideTo]],
		['onScroll', [inViewStart, inViewEnd]]
	])

	return params.get(sliderType)
}

function hasWrongConfiguration(flowType, slideTo) {
	const isVertical = slideTo === 'top' || slideTo === 'bottom';
	const onSwipe = flowType === 'onSwipe';

	return isVertical && onSwipe;
}

function displayMessage() {
	const message = document.createElement('div');

	const style = {
		zIndex: '100000',
		width: '100%',
		height: '100%',
		background: 'white',
		padding: '50px',
		fontSize: '36px',
		position: 'absolute',
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
	}

	const text = `Please review the configuration, as the current setup is incorrect. 
		The swipe variant does not support top and bottom resizing due to the nature of the creative, 
		which could result in high engagement rates from unintentional user interaction
	`

	message.textContent = text;
	Object.assign(message.style, style);

	document.getElementById(creative.screens[0].name).appendChild(message);
}

function autoReveal(config) {
	const {dragElement, autoReveal, slideTo} = config;
	const events = getEventsType()
	const elementSize = dragElement.htmlElement.offsetWidth;
	const start = -elementSize / 2;
	const end = creative.canvases[0].config.width - elementSize / 2;

	const left = slideTo === 'left' ? start : end;

	dragElement.htmlElement.addEventListener('animationend', async () => {
		Object.assign(dragElement.htmlElement.style, { transition: `left ${autoReveal.transition}ms linear` });

		await sleep(autoReveal.after);
		Object.assign(dragElement.htmlElement.style, { left: `${left}px` });
	})

	dragElement.htmlElement.addEventListener(events.pointerDown, () => {
		Object.assign(dragElement.htmlElement.style, { transition: `left 0ms linear` });
	})
}

function sleep(millisec) {
	return new Promise((res, rej) => {
		setTimeout(() => res(true), millisec)
	})
}

function getStyle(slideTo) {
	const styles = new Map([
		['top',{ bottom: 0, top: 'auto' }],
		['bottom', { top: 0, bottom: 'auto' }],
		['right', { right: 0, left: 'auto' }],
		['left', {}]
	])

	return styles.get(slideTo);
}

function applyRecursiveStyle(config) {
	const {frontElement, style} = config;

	const divs = [frontElement.htmlElement, frontElement.htmlElement.querySelector('div')];

	divs.forEach(div => Object.assign(div.style, style))
}

function togglePreviewAnimation(config) {
	const {dragElement, animation: {reps, duration, travelDistance}} = config;
	const events = getEventsType();

	const startLeft = dragElement.htmlElement.offsetLeft;
	const endLeft = startLeft + travelDistance;

	const style = document.createElement('style');

	style.textContent = `
		.togglePreview {
			animation: preview ${duration}ms ${reps};
		}

		@keyframes preview {
			0%, 100% {left: ${startLeft}px}
			49%, 51% {left: ${endLeft}px}	
		}
	`
	style.type = 'text/css';
	document.head.appendChild(style);

	dragElement.htmlElement.classList.add('togglePreview');

	dragElement.htmlElement.addEventListener(events.pointerDown, () => {
		dragElement.htmlElement.classList.remove('togglePreview');
	}, false)

	dragElement.htmlElement.addEventListener('animationend', () => {
		dragElement.htmlElement.classList.remove('togglePreview');		
	})
}

function addDrag(element, snap) {
	const events = getEventsType();
	const getCoords = getEventCoords();

	let pointerDown = false;

	function onEnd() {
		if (!pointerDown) return;
		pointerDown = false;

		if (!snap) return;

		const snapPoint = getSnapPoint(element);

		element.htmlElement.style.left = snapPoint + 'px';
	}

	function setPosition(evt) {
		const half = element.htmlElement.offsetWidth / 2;

		const currentXY = getCoords(evt);
		const left = Math.max(0, Math.min(currentXY.x, creative.canvases[0].config.width));

		element.htmlElement.style.left = left - half + 'px';
	}

	element.htmlElement.addEventListener(events.pointerDown, (evt) => {
		pointerDown = true;
		setPosition(evt);
	});
	element.htmlElement.addEventListener(events.pointerUp, (evt) => onEnd());

	document.addEventListener(events.pointerUp, (evt) => onEnd());
	document.addEventListener(events.pointerCancel, (evt) => onEnd());

	document.addEventListener(events.pointerMove, (evt) => {
		if (!pointerDown) return;

		setPosition(evt);
	});
}

function getSnapPoint(element) {
	const elWidth = element.htmlElement.offsetWidth;
	const elHalf = elWidth / 2;
	const elCenter = element.htmlElement.offsetLeft + elHalf;

	const cWidth = creative.canvases[0].config.width;
	const cHalf = cWidth / 2;

	const startRange = [0, elWidth];
	const middleRange = [cHalf - elHalf, cHalf + elHalf];
	const endRange = [cWidth - elWidth, cWidth];

	const ranges = new Map([
		[startRange, -elHalf],
		[middleRange, cHalf - elHalf],
		[endRange, cWidth - elHalf]
	])

	const range = [...ranges.keys()].filter(range => isInRange(elCenter, range));

	if (!range.length) return element.htmlElement.offsetLeft;

	return ranges.get(range[0])
}

function isInRange(current, range) {
	return current > range[0] && current < range[1];
}

function getMousePercent(element, slideTo) {
	const half = element.htmlElement.offsetWidth / 2;

	return () => {
		const left = element.htmlElement.offsetLeft;
		const middle = left + half;

		const percent = middle / creative.canvases[0].config.width;
		const absPercent = slideTo === 'left' ? percent : Math.abs(1 - percent);

		return absPercent;
	}
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

		return 1 - percent;
	};
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

/************************************************************
* ==> Check if multipleVideo
************************************************************/
function handleMultipleVids() {
	const vids = creative.screens[0].deepGetEosByType(bnt.Video);
	const origin = window.location.origin;

	const status = false;
	if (origin === 'https://demo.teads.com' || origin === 'https://studio-ui.teads.tv') status = true;

	if (vids.length > 1 && status) {
		const msg = `More than 1 video elemet was found. \;
		Adding more than 1 video per screen will cause the unit to malfunction.
		Functionality will be limited to desktop and android devices`;

		alert(msg)
	}
}

handleMultipleVids();
/************************************************************
* ==> Check if Display viewable
************************************************************/
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