/***********************************************************
• Obs1: List each element on a new line to modify its position, scale, or opacity.
• Obs2: triggerScrollInterval - Defines the scroll percentage range which trigger the changes.
   - Outside this range, the element keeps its original scale, opacity and position.
   - 0% scroll → When 50% of the ad is visible.
   - Example: [0.3, 0.8] → Changes occur between 30%-80% scroll; outside this range, elements revert back to original.
• Obs3: horizontal / vertical - Controls the element's movement in pixels.
   - Positive horizontal → Moves right | Negative → Moves left.
   - Positive vertical → Moves down | Negative → Moves up.
   - Use 0 for no movement.
• Obs4: scale / opacity - Defines the element's scale/opacity outside and inside the triggerScrollInterval.
   - First value → Applied outside the interval.
   - Second value → Applied inside the interval.
   - Use [1,1] for no scale / opacity
• Obs5: animationTime - animation duration in milliseconds.
• Obs6: progressive - controls if changes occur instantly (with animation) or proportionally to the scroll percentage.
    - true → changes occur gradually, in proportion to the scroll percentage.
    - false → changes occur instantly once the scroll percentage is in the range defined by triggerScrollInterval.
***********************************************************/


const moveConfig = [
    { element: title, horizontal: 0, vertical: 0, scale: [1, 1], opacity: [1, 1], triggerScrollInterval: [0.1, 0.9], animationTime: 2400, progressive: false, },
    { element: title2, horizontal: 0, vertical: 0, scale: [1, 1], opacity: [1, 1], triggerScrollInterval: [0.15, 1], animationTime: 100, progressive: true, },
];

const mos = new MoveOnScroll(moveConfig);

function MoveOnScroll(elements) {

    let raf, lastPercent;
    const getScrollPercent = getPlayerPos();

    const init = () => {
        this.loop();
        resetElementsPositions();
        monitorScreenChange();

        creative.screens[0].onshow.removeObserver(init);
    }

    function monitorScreenChange() {
        creative.onscreenchange.addObserver(() => { resetElementsPositions(); });
    }

    this.loop = () => {
        raf = bnt.requestAnimFrame(this.loop);

        const percent = getScrollPercent();
        if (percent === lastPercent)
            return;

        arrangeElements(percent);

        lastPercent = percent;
    }

    this.stopLoop = function () {
        bnt.cancelAnimFrame(raf);
    }

    function updatePosition(el, percent) {
        let transformCSS = "";
        transformCSS += getTranslateX(el, percent);
        transformCSS += getTranslateY(el, percent);
        transformCSS += getScale(el, percent);

        if (transformCSS !== "")
            applyStyle(el, "transform", transformCSS);
        
        const opacity = getOpacityValue(el, percent);

        applyStyle(el, 'opacity', opacity);
    }

    function getTranslateX(el, percent) {
        if (!el.horizontal)
            return "";

        const translateX = el.horizontal * percent;
        return percent ? "translateX(" + translateX + "px) " : "translateX(0px)";
    }

    function getTranslateY(el, percent) {
        if (!el.vertical)
            return "";

        const translateY = el.vertical * percent;
        return percent ? "translateY(" + translateY + "px) " : "translateY(0px)";
    }

    function getScale(el, percent) {
        if (el.scale === false || el.scale === null)
            return "";

        const [startScale, endScale] = el.scale;
        let currentScale;

        if (el.progressive)
            currentScale = startScale + (endScale - startScale) * percent;
        else
            currentScale = percent ? endScale : startScale; //Percent == 1 => jump to endScale

        return "scale(" + currentScale + ")";
    }

    function getOpacityValue(el, percent) {
        if (el.opacity === false || el.opacity === null) return 1;

        const [startOpacity, endOpacity] = el.opacity;
        let currentOpacity;

        if (el.progressive)
            currentOpacity = startOpacity + (endOpacity - startOpacity) * percent;
        else
            currentOpacity = percent ? endOpacity : startOpacity; //Percent == 1 => jump to endOpacity

        return currentOpacity;
    }

    function applyStyle(el, styleProperty, value) {
        el.element.htmlElement.style[styleProperty] = value;
    }

    function arrangeElements(percent) {
        elements.forEach(function (el, idx) {
            if (!el.element.htmlElement)
                return;

            //percent calculated relative to element scroll interval. 
            //In case of progressive: false, it return 1 (inside triggerScrollInterval) or 0 (outside)
            const elementPercent = getElementPercent(el, percent);

            //Move element to position
            updatePosition(el, elementPercent);
        });
    }

    function getElementPercent(el, percent) {
        const [minTrigger, maxTrigger] = el.triggerScrollInterval;

        if (el.progressive)
            return remapRange(percent, [minTrigger, maxTrigger], [0, 1]);

        const isInRange = percent >= minTrigger && percent <= maxTrigger;
        if (isInRange)
            return 1;

        return 0;
    }

    //At screen change, reset elements positions
    function resetElementsPositions() {
        const percent = getScrollPercent();
        
        toggleElementTransitions(false);
        arrangeElements(percent); 
        toggleElementTransitions(true);
    }

    function toggleElementTransitions(shouldEnable){
        elements.forEach(function (el, idx) {
            //Skip element if HTML element not yet loaded, or if progressive (transition not needed) 
            // if (!el.element.htmlElement || el.progressive)
                // return;

            if(shouldEnable)
                bnt.requestAnimFrame(function () { addElementTransition(el); });
            else
                removeElementTransition(el);
        });
    }

    function getPlayerPos() {
        let percent = 0;

        function updateScrollPercent(api) {
            if (!api) return percent;

            api.getSlotBounds().map(function (slotBounds) {
                const topWindowHeight = slotBounds.viewportHeight;
                const playerTop = slotBounds.top;
                percent = 1 - playerTop / (topWindowHeight - window.innerHeight);
                percent = Math.max(0, Math.min(1, percent));
            });

            return percent;
        }

        function getTeadsApi() {
            let teadsApi;

            const setTeadsApi = api => teadsApi = api;
            bnt.TeadsPlayerAddons.apiProxy.addObserver(setTeadsApi);

            if (teadsApi) return teadsApi;

            bnt.TeadsPlayerAddons.apiProxy.removeObserver(setTeadsApi);

            bnt.requestAnimFrame(getTeadsApi)
        }

        const teadsApi = getTeadsApi();

        return function () {
            return updateScrollPercent(teadsApi);
        };
    };

    function addElementTransition(el) {
        const transitionPropertiesList = [];

        if ((el.scale !== false && el.scale !== null) || el.horizontal || el.vertical)
            transitionPropertiesList.push("transform");

        if (el.opacity !== false && el.opacity !== null)
            transitionPropertiesList.push("opacity");

        applyTransition(el, transitionPropertiesList);
    }

    function removeElementTransition(el) {
        const transitionPropertiesList = [];
        applyTransition(el, transitionPropertiesList);
    }

    function applyTransition(el, transitionPropertiesList) {
        let transitionCSS = "";

        transitionPropertiesList.forEach(function (property, idx) {
            transitionCSS += property + " " + el.animationTime + "ms";
            if (idx != transitionPropertiesList.length - 1)
                transitionCSS += ",";
        });
        el.element.htmlElement.style.transition = transitionCSS;
    }

    function remapRange(val, from, to) {
        return Math.max(to[0], Math.min(to[1], (val - from[0]) / (from[1] - from[0]) * to[1]))
    }

    creative.screens[0].onshow.addObserver(init);
}