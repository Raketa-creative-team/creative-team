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