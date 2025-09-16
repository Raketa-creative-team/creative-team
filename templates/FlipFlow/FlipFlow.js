const flipFlowConfig = {
	container: SlideShowContainer,
	animation: {
		duration: 0.4,
		ease: 'ease-in',
		next: {
			onShow: 'slideFromTop',
			onHide: 'slideToBottom',
		},
		previous: {
			onShow: 'slideFromBottom',
			onHide: 'slideToTop',
		}
	},
	scroll: {
		start: 0,
		end: 1,
	},
}

flipFlowConfig.container.onshowAnimationEnd.addObserver(initFlipFlow);

function initFlipFlow() {
	const getPercent = getPlayerBounds(0, 1);

	const config = {...flipFlowConfig, getPercent };

	const flipFlow = new FlipFlow(config);
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


		console.log(container.getEos(slides[0]).configs.get(bnt.get(bnt.State)).onHide)
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

	this.update = () => {
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