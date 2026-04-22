// https://demo.teads.com/?content=publishers%252Fteads-tech_english.html&vast=https%3A%2F%2Fs8t.teads.tv%2Fvast%2F6753877077348970

const config = {
    closeBtn: CloseBtn,
    thumbs: Thumbs,
    overlays: Overlays,
    bgs: BGS,

    animateElements: [
        { name: BGS, x: -110, y: 0, showBetween: [0.5, 1], transitionTime: 400 },
        { name: Panel, x: -220, y: 0, showBetween: [0.5, 1], transitionTime: 400 },
        { name: Overlays, x: -110, y: 0, showBetween: [0.5, 1], transitionTime: 400 },
    ]
}

adController.onstart.addObserver(() => setPrerenderPosition(Panel));

initSelector(config);
initAnimation(config);

function setPrerenderPosition(element) {
    const state = creative.screens[0].getEos(element).configs.get(bnt.get(bnt.State));
    const statePos = { x: creative.canvases[0].config.width };

    Object.assign(state, statePos);
}

function initSelector(config) {
    creative.screens[0].onshow.addObserver(() => {
        const { closeBtn, thumbs, overlays, bgs } = config;

        const onIndexUpdate = 'onIndexUpdate';
        const indexUpdate = new CreateCustomEvent(onIndexUpdate);

        closeBtn.htmlElement.addEventListener('click', () => indexUpdate.dispatch(undefined))

        thumbs.eos.forEach((eos, idx) => {
            eos.element.htmlElement.addEventListener('click', () => indexUpdate.dispatch(idx))
        })

        document.addEventListener(onIndexUpdate, (event) => {
            const { detail: { current, previous } } = event;

            if (current === undefined) {
                restoreDefault(bgs);
                restoreDefault(overlays);

                closeBtn.hide();

                return bntTracking.trackEvent(`#${closeBtn.elementId}: onclick`, null);
            }

            onInteraction(bgs, current, previous);
            onInteraction(overlays, current, previous);

            closeBtn.show();

            return bntTracking.trackEvent(`#${thumbs.eos[current].element.elementId}: onclick`, null);
        });
    })
}

function initAnimation(config) {
    creative.screens[0].onshow.addObserver(() => {
        setTransition(config.animateElements);

        animateElements(config.animateElements);
    })

}

function onInteraction(parent, current, previous) {
    const defaultOption = parent.eos.filter(child => !child.element.eos)[0];
    const options = parent.eos.filter(child => child.element.eos)[0]

    defaultOption?.element.hide();

    options.element.eos[previous]?.element.hide();
    options.element.eos[current]?.element.show();
}

function restoreDefault(parent) {
    const defaultOption = parent.eos?.filter(child => !child.element.eos)[0];
    const options = parent.eos?.filter(child => child.element.eos)[0];

    defaultOption?.element.show();

    options?.element.eos.forEach(option => option.element.hide())
}


function CreateCustomEvent(eventName) {
    let index = undefined;

    const indexUpdateEvent = new CustomEvent(eventName, { bubbles: true, detail: { previous: null, current: null } });

    this.dispatch = (inputIndex) => {
        if (index === inputIndex) return;

        indexUpdateEvent.detail.previous = index;
        indexUpdateEvent.detail.current = inputIndex;

        index = inputIndex;
        document.dispatchEvent(indexUpdateEvent);
    }
}

function setTransition(elements) {
    elements.forEach(element => element.name.htmlElement.style.transition = `all ${element.transitionTime}ms linear`)
}

function animateElements(elements) {
    const getPercent = getScrollPercent(0, 1);
    const isBetween = (current, range) => current >= range[0] && current <= range[1];

    function loop() {
        bnt.requestAnimFrame(loop);

        const percent = getPercent();

        elements.forEach(element => {
            const shouldTranslate = isBetween(percent, element.showBetween);

            const x = shouldTranslate ? element.x + 'px' : '0px';

            element.name.htmlElement.style.transform = `translateX(${x})`;
        })
    }

    loop();
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

    let teadsApi = getTeadsApi();

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