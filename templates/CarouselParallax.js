//Demo: https://demo.teads.com/?content=publishers%252Fteads-tech_english.html&vast=https%3A%2F%2Fs8t.teads.tv%2Fvast%2F6753877077246497

/***********************************************************
• Obs1: BackgroundImg - wide background which will move with the parallax elements
• Obs2: scrollStart / scrollEnd - These control when the parallax effect starts and ends based on scroll percentage.
   - 0 % scroll = When 50 % of the ad is visible.
   - Parallax groups appear evenly spaced between scrollStart and scrollEnd.
• Obs3: stack - when new parallax groups are shown, keep previously shown parallax groups(true) or hide them(false) to the direction specified at "movementDirection" using a parallax effect 
• Obs4: parallaxDistancesLeft / Right - Default values for parallax effects(no need to modify unless needing to adjust elements' speeds within groups)
                                      These control how far elements travel when entering or exiting the screen
                                      A larger value means a greater travel distance and faster movement(values applied to each element in each parallax group, in order)
                                      Distance is relative to the canvas width.Values must be ≥ 1.
***********************************************************/

const parallaxConfig = {
        screen: Screen1,
        groupName: Parallax_carousel, // name of the group containing parallax slides
        backgroundImg: Background, // null if not used 
        animationTime: 1500, // time it takes for elements to move into position
        movementDirection: "toLeft", // toRight, toLeft
        ease: "ease-in-out", // ease-in, ease-out, ease-in-out, or "" if ease is not desired 
        arrows: {
            left: arrowLeft, // set to false if not needed
            right: arrowRight, // set to false if not needed
        },

        scrollStart: 0.25, // values recommended for SQ ratio (0.25/0.8), LS ratio (0.3/0.8), VT ratio (0.35/0.6) - Tested with 3 to 4 Slides
        scrollEnd: 0.8,

        stack: false, // false, true

        // Higher values = faster movement, values must be ≥ 1
        parallaxDistancesLeft: [2, 2.2, 1.98, 1, 1.2],
        parallaxDistancesRight: [1.3, 1.5, 1.2, 1, 1.2],
    }


/***********************************************************
    * => DO NOT CHANGE CODE BELOW THIS LINE
   ***********************************************************/


function Parallax(config) {
    const { screen, groupName, backgroundImg, animationTime, movementDirection, movingLeft = movementDirection == "toLeft", ease, arrows, scrollStart, scrollEnd, stack, parallaxDistancesLeft, parallaxDistancesRight } = config;
    const parallaxGroups = groupName.getEosByType(bnt.Group).map(group => group.element);
    const getPercent = getPlayerBounds(0, 1);
    const tracking = new Array();
    const canvasWidth = creative.canvases[0].config.width;
    let currentIndex, lastPercent;

    const [arrowNext, arrowPrev] = movingLeft ? [arrows.right, arrows.left] : [arrows.left, arrows.right];

    let indexModifier = 0;
    let raf;

    const publicMethods = {
        stopLoop: stopLoop,
        loop: loop,
        callOnSlideChange: function (index) { },
        getParallaxIndex: function () { return currentIndex },
    }

    //Hide all slides so they don't appear overlapping before calling init
    setParallaxElementsVisibility("hide");

    screen.onshow.addObserver(init);
    screen.onhide.addObserver(handleScreenHide);

    return publicMethods;

    function init() {
        addListeners();
        handleScreenShow();

        screen.onshow.removeObserver(arguments.callee);
        screen.onshow.addObserver(handleScreenShow);
    }

    function handleScreenShow() {
        const percent = getPercent();
        const index = getSlideIndex(percent);
        resetElementPositions(index);
        manageArrowVisibility(index);
        updateZindex();
        loop();
    }

    function resetElementPositions(index) {
        setParallaxElementsVisibility("hide");
        updateParallaxTransition("none");
        updateParallaxGroupsPositions(index);

        bnt.requestAnimFrame(() =>
            updateParallaxTransition(getTransitionCSS(animationTime, ease))
        );
        setParallaxElementsVisibility("show");
    }

    function handleScreenHide() {
        stopLoop();
        currentIndex = -1;
        updateParallaxTransition("none");
        setParallaxElementsVisibility("hide");
    }

    function updateZindex() {
        parallaxGroups.forEach((group, idx) =>
            updateCSSProperty(group, "zIndex", idx + 1)
        );
    }

    function updateParallaxTransition(css) {
        parallaxGroups
            .map(group => group.eos)
            .flat()
            .forEach(layer => updateCSSProperty(layer.element, "transition", css));

        if (backgroundImg) {
            updateCSSProperty(backgroundImg, "transition", css);
        }
    }

    function getTransitionCSS(animationTime, ease) {
        return "transform " + animationTime + "ms " + ease;
    }

    function getTranslateX(x) {
        return "translateX(" + x + "px)";
    }

    function updateCSSProperty(element, property, value) {
        element.htmlElement.style[property] = value;
    }

    function addListeners() {
        const addClickListener = (arrow, step) => {
            if (!arrow) return;

            arrow.htmlElement.addEventListener("click", () => {
                const newIndex = currentIndex + step;

                if (newIndex >= 0 && newIndex < parallaxGroups.length) {
                    indexModifier += step;
                    lastPercent = undefined;
                }
                trackEvent("#" + arrow.elementId + ": clicked", "onclick");
            });
        };

        addClickListener(arrowNext, 1);
        addClickListener(arrowPrev, -1);
    }

    function loop() {
        raf = bnt.requestAnimFrame(loop);

        const percent = getPercent();
        if (percent == lastPercent) return;

        const index = getSlideIndex(percent);

        updateParallaxGroupsPositions(index);
        manageArrowVisibility(index);
        publicMethods.callOnSlideChange(index);
        trackSlide(index);

        currentIndex = index;
        updateIndexModifier(percent);

        lastPercent = percent;
    }

    function stopLoop() {
        bnt.cancelAnimFrame(raf);
    }


    function getScrollIndex(percent) {
        const float = percent * (parallaxGroups.length - 1);
        return Math.round(float);
    }

    function getSlideIndex(percent) {
        const scrollIndex = getScrollIndex(percent);
        let index = scrollIndex + indexModifier;
        index = clamp(index, 0, parallaxGroups.length - 1);

        return index
    }

    function updateIndexModifier(percent) {
        const scrollIndex = getScrollIndex(percent);

        //index will be equal scrollIndex
        if (scrollIndex == currentIndex && indexModifier != 0)
            indexModifier = 0;
    }

    function setParallaxElementsVisibility(visibility) {
        parallaxGroups.forEach(function (group) {
            group[visibility]();
        });

        if (backgroundImg)
            backgroundImg[visibility]();
    }

    function manageArrowVisibility(index) {
        const atEnd = index >= parallaxGroups.length - 1;
        const atStart = index === 0;

        if (arrowNext)
            atEnd ? arrowNext.hide() : arrowNext.show();

        if (arrowPrev)
            atStart ? arrowPrev.hide() : arrowPrev.show();
    }

    function updateParallaxGroupsPositions(index) {
        //Moves slides: hides to left/right and shows the index
        showGroup(index);

        if (backgroundImg)
            updateBackgroundPosition(index);

        hideOtherGroups(index);
    }

    function showGroup(index) {
        parallaxGroups[index].eos.forEach(layer =>
            updateCSSProperty(layer.element, "transform", getTranslateX(0))
        );
    }

    function hideOtherGroups(newIndex) {
        parallaxGroups.forEach((element, idx) => {
            //Hide only slides other than current slide, or slides before current slide if stack is true
            const shouldKeepVisible = idx === newIndex || (idx < newIndex && stack);
            if (shouldKeepVisible) return;

            hideGroupSlides(idx, newIndex);
        });
    }

    function hideGroupSlides(groupIdx, newIndex) {
        const slideIsBeforeNewIndex = groupIdx < newIndex;
        const hideToLeft = movingLeft ? slideIsBeforeNewIndex : !slideIsBeforeNewIndex;
        const distanceArray = hideToLeft ? parallaxDistancesLeft : parallaxDistancesRight;

        parallaxGroups[groupIdx].eos.forEach((layer, idx) => {
            const distanceIndex = Math.min(idx, distanceArray.length - 1);
            const distanceMultiplier = distanceArray[distanceIndex];
            const distance = hideToLeft ?
                -(distanceMultiplier * canvasWidth + canvasWidth) :
                distanceMultiplier * canvasWidth;

            updateCSSProperty(layer.element, "transform", getTranslateX(distance));
        });
    }

    function updateBackgroundPosition(index) {
        const leftPos = getBackgroundLeftPos(index);
        updateCSSProperty(backgroundImg, "transform", getTranslateX(leftPos));
    }

    function getBackgroundSizes() {
        const backgroundWidth = backgroundImg.configs.get(bnt.get(bnt.State)).imageWidth;
        const slideWidth = (backgroundWidth - canvasWidth) / (parallaxGroups.length - 1);

        return { backgroundWidth, slideWidth };
    }

    function getBackgroundLeftPos(index) {
        const { backgroundWidth, slideWidth } = getBackgroundSizes();
        const offset = slideWidth * index;

        return movingLeft ? -offset : -backgroundWidth + canvasWidth + offset;
    }

    function trackSlide(index) {
        if (tracking[index]) return;

        trackEvent("#" + parallaxGroups[index].elementId + ": shown", false);
        tracking[index] = true;
    }

    function trackEvent(name, engagement) {
        bntTracking.trackEvent(name, null);
        if (engagement) {
            adController.interaction.update(engagement);
        }
    }

    function clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

    function remapRange(val, from, to) {
        return Math.max(to[0], Math.min(to[1], (val - from[0]) / (from[1] - from[0]) * to[1]));
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

}

const parallaxCarousel = new Parallax(parallaxConfig);