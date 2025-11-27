// https://studio-ui.teads.tv/studio/6753877077279498/editor/create

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