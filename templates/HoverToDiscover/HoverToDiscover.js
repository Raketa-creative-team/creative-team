// https://studio-ui.teads.tv/studio/6753877077299551/editor/code/js
const hoverConfig = {
    screen: Screen1,

    ui: {
        container: CanvasBox,   // Studio HTML element
        brushGroup: Brush,      // Group containing brush images, hidden
        frontImage: FrontImage, // Image that gets "scratched off" (starts hidden, drawn on canvas)
        backImage: BackImage,   //Image revealed underneath
        hintElement: HoverAnimationElement, //  Visual hint/icon showing users where to interact (auto-hides on interaction)
        hoverIconTime: 2000,                //  Milliseconds before hint reappears after user stops interacting (false = never reappear)
        autoRevealOnThreshold: true,        // If true, automatically hide container and fully reveal backImage when threshold is reached
        revealThreshold: 70,                // Percentage (0-100) of canvas area that must be revealed to trigger autoReveal
        interactionType: "hover",            // "drag" = mouse down + move | "hover" = movement only (no click required)
    },

    smoke: {
        size: 190,                  // Initial diameter of each brush stroke in pixels
        animationSpeed: 5,          // Pixels per frame that brush grows before fading
        opacitySpeed: 0.02,         // Opacity reduction per frame (higher = faster fade out)
        frequency: 10,              // Minimum milliseconds between creating new brush strokes, higher value => slower animation
        maxSmokes: 400,             // Maximum number of simultaneous brush strokes on canvas (limits performance impact)
    },

    preview: {
        enabled: true,              // true, to Reveal parts of backImage if user doesn't interact
        delay: 3000,                // Milliseconds of inactivity before preview starts
        maxPreviewSmokes: 20,       // max number of simultaneous brushes drawn when showing preview
    },
};

hoverConfig.screen.onshow.addObserver(() => { initHover(hoverConfig); });


async function initHover(config) {
    const IC = await interactiveCanvas(config.ui);

    const anim = getHoverAnim({
        smoke: config.smoke,
        preview: config.preview,
        ...IC.elements
    });

    IC.setAnimation(anim);

    const trackingFn = getHoverTracking();

    IC.onProgress((canvas, coords) => {
        const { autoRevealOnThreshold, revealThreshold, container } = config.ui;
        const percent = trackingFn(canvas, coords);

        if (percent !== null && autoRevealOnThreshold && percent >= revealThreshold) {
            IC.stopAnimation();
            container.hide();
            trackEvent("#BackImage revealed", false, false);
        }
    });
}



async function interactiveCanvas(config) {
    const { container, brushGroup, frontImage, backImage, hintElement, hoverIconTime, autoRevealOnThreshold, interactionType } = { ...config };
    let raf, progressTracking = null;


    const loadedAssets = await listenForStudioImagesLoad([frontImage, ...brushGroup.eos.map(eos => eos.element)]);
    const [frontImg, ...brushList] = await cloneImages(loadedAssets);

    const { canvas, ctx } = createCanvas(container);

    const coordsFunctions = getCoordFns();
    const uiHandlers = getInteractionHanders(interactionType);

    //Merge handler keys (start, move, end)
    const handlerKeys = [...new Set([...Object.keys(coordsFunctions.handlers), ...Object.keys(uiHandlers)])];

    //Merge handlers
    const allHandlers = Object.fromEntries(
        handlerKeys.map(key => [key, [coordsFunctions.handlers[key], uiHandlers[key]].filter(v => v !== undefined)])
    );

    //Setup Default listeners & handlers
    setupListeners(canvas, allHandlers, interactionType);

    // Initial state: front hidden until painting occurs
    frontImage.hide();
    backImage.show();

    return {
        setAnimation: (animate) => setAnimLoop(animate, coordsFunctions.getCoords, canvas, uiHandlers),
        stopAnimation: stopAnim,
        onProgress: (fn) => progressTracking = fn,
        //Setup custom listeners & handlers
        setExtraHandlers: (handlers, interactionType) => setupListeners(canvas, handlers, interactionType),
        getCoords: coordsFunctions.getCoords,
        elements: {
            canvas,
            ctx,
            brushList,
            frontImg,
        }
    };


    function setAnimLoop(animate, getCoords, canvas, uiHandlers) {
        loop();

        function loop() {
            raf = bnt.requestAnimFrame(loop);
            const coords = uiHandlers.isActive() ? getCoords() : null;
            animate(coords);

            if (progressTracking)
                progressTracking(canvas, coords);
        }
    }

    function stopAnim() {
        bnt.cancelAnimFrame(raf);
        raf = false;
    }


    function listenForStudioImagesLoad(studioImages) {
        const imgElements = studioImages.map(img => img.htmlElement.querySelector("img"));
        return Promise.all(imgElements.map(waitForImage));
    }


    function waitForImage(img) {
        return new Promise((resolve, reject) => {
            img.complete ? resolve(img) : img.onload = () => resolve(img), img.onerror = reject;
        });
    }


    function cloneImages(assets) {
        return Promise.all(assets.map(img => cloneImage(img)));
    }


    function cloneImage(originalImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = originalImage.src;
        return waitForImage(img);
    }


    function createCanvas(parent) {
        const canvas = document.createElement('canvas');
        canvas.width = parent.htmlElement.offsetWidth;
        canvas.height = parent.htmlElement.offsetHeight;
        parent.htmlElement.querySelector(".animation > div").appendChild(canvas);

        const ctx = canvas.getContext('2d');

        return { canvas, ctx };
    }


    function getInteractionHanders(interactionType) {
        let userInteracted = false; //Used to hide hintElement for hover type interaction
        let hintTimeout;
        let isActive = interactionType === "hover"; // hover is always active, drag needs mousedown

        return {
            start: () => {
                isActive = true; // Activate for drag mode
                if (hintElement) hintElement.hide();

                if (!userInteracted) {
                    trackEvent(`#${interactionType} started`, true, false);
                    userInteracted = true;
                }
            },

            end: () => {
                isActive = interactionType === "hover"; // Deactivate for drag, keep active for hover
                if (hoverIconTime) userInteracted = false;
                const isAnimating = (raf !== false);

                //if hintElement specified & backImage wasn't revealed
                if (hintElement && hoverIconTime && (!autoRevealOnThreshold || isAnimating)) {
                    hintTimeout = setTimeout(() => {
                        hintElement.show();
                    }, hoverIconTime);
                }
            },

            move: (evt) => {
                if(!isActive) return;

                evt.preventDefault();

                if (hintElement && !userInteracted) {
                    hintElement.hide();
                    userInteracted = true;
                }

                clearTimeout(hintTimeout);
            },

            isActive: () => isActive
        }
    }


    function setupListeners(canvas, eventHandlers, interactionType) {
        const userEvents = getUserEvents(interactionType);

        //eg. Get eventNames of the "start" eventType (eg. touchStart) and add listeners for each start handler from eventHandlers list
        Object.entries(userEvents).forEach(([eventType, eventNames]) => {
            if (eventType in eventHandlers) {
                eventHandlers[eventType].forEach((handler) => {
                    eventNames.forEach(eventName => canvas.addEventListener(eventName, handler));
                })
            }
        });
    }


    function getCoordFns() {
        const scale = creative.canvases[0].config.width / window.innerWidth;
        const isMobile = DeviceContext.isTablet() || DeviceContext.isMobile();

        let coords = null;

        const updateCoords = (evt) => {

            if (isMobile) {
                const touch = evt?.touches?.length ? evt.touches[0] : evt.changedTouches[0];
                coords = { x: touch.pageX * scale, y: touch.pageY * scale };
            }
            else
                coords = { x: evt.pageX * scale, y: evt.pageY * scale };
        };

        const resetCoords = () => { coords = null; };

        return {
            updateCoords,
            resetCoords,

            getCoords: () => coords,

            handlers: {
                start: (evt) => { updateCoords(evt); return coords },
                move: (evt) => {updateCoords(evt); return coords },
                end: () => { resetCoords(); return coords },
            }
        }
    }

    function getUserEvents(interactionType) {
        const deviceType = (DeviceContext.isTablet() || DeviceContext.isMobile()) ? 'mobile' : 'desktop';
        const events = {
            mobile: {
                drag: { start: ["touchstart"], move: ["touchmove"], end: ["touchend", "touchcancel"] },
                hover: { start: [], move: ["touchmove"], end: ["touchend", "touchcancel"], }
            },
            desktop: {
                drag: { start: ["mousedown"], move: ["mousemove"], end: ["mouseup", "mouseleave"], },
                hover: { start: [], move: ["mousemove"], end: ["mouseup", "mouseleave"], }
            }
        };

        return events[deviceType][interactionType];
    }
}




function getHoverAnim(config) {
    const { smoke: smokeConfig, preview: previewConfig, canvas, ctx, frontImg, brushList } = config;

    //will manage all smoke animations & lifecycle
    const smokeM = new SmokeManager(smokeConfig, previewConfig, ctx, brushList);

    function animate(coords) {
        clearCanvas(canvas, ctx);
        drawFrontImage(canvas, ctx, frontImg);

        //Draw Smokes
        smokeM.animateSmokes(coords);
    }

    const clearCanvas = (canvas, ctx) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
    }

    const drawFrontImage = (canvas, ctx, frontImg) => {
        ctx.drawImage(frontImg, 0, 0, canvas.width, canvas.height);
    }

    return animate;
}


function SmokeManager(smokeConfig, previewConfig, ctx, brushList) {
    const {
        size: initialSize,
        animationSpeed,
        opacitySpeed,
        frequency,
        maxSmokes,
    } = smokeConfig;

    const {
        enabled: previewEnabled,
        delay: previewDelay,
        maxPreviewSmokes: maxPreviewSmokes
    } = previewConfig;
    

    let smokes = [];
    let userInteracted = false;
    let lastPreviewActive = Date.now();
    let previewCoords = null;
    let previewCount = 0;

    const canAddSmoke = () => {
        if (smokes.length >= maxSmokes) return false;
        const lastSmoke = smokes[smokes.length - 1];
        if (!lastSmoke?.createdAt) return true;
        return Date.now() - lastSmoke.createdAt >= frequency;
    }

    const createSmoke = (coords, isPreview = false) => {
        const brush = brushList[Math.floor(Math.random() * brushList.length)];
        let currentSize = isPreview ? initialSize : (initialSize * 2);
        const maxSize = currentSize * 2;
        const angle = Math.round(Math.random() * 360);

        let currentOpacity = 1;

        return {
            createdAt: Date.now(),
            isPreview,
            getOpacity: () => currentOpacity,
            animate: () => {
                ctx.save();
                ctx.translate(coords.x, coords.y);
                ctx.rotate(angle);
                ctx.globalCompositeOperation = "destination-out";
                ctx.globalAlpha = currentOpacity;
                ctx.drawImage(brush, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
                ctx.restore();

                if (currentSize < maxSize)
                    currentSize += animationSpeed;
                else
                    currentOpacity = Math.max(0, currentOpacity - opacitySpeed);
            }
        };
    }

    const getRandomCoords = () => ({
        x: Math.floor(Math.random() * creative.canvases[0].config.width),
        y: Math.floor(Math.random() * creative.canvases[0].config.height)
    });

    const handlePreviewSmoke = () => {
        if (!previewEnabled || userInteracted) return;

        const now = Date.now();
        const activePreviewSmokes = smokes.filter(smoke => smoke.isPreview).length;

        //Reset after all preview smokes expire
        if (activePreviewSmokes === 0 && previewCount >= maxPreviewSmokes) {
            previewCoords = null;
            previewCount = 0;
            lastPreviewActive = now;
        }

        // Add preview smokes after delay
        const timePassedFromLastPreview = now - lastPreviewActive;
        if (timePassedFromLastPreview >= previewDelay && previewCount < maxPreviewSmokes) {

            if (!previewCoords) previewCoords = getRandomCoords();
            if (canAddSmoke()) {
                smokes.push(createSmoke(previewCoords, true));
                previewCount++;
            }
        }
    }

    function animateSmokes(coords) {
        if (coords) {
            userInteracted = true;
            if (canAddSmoke()) smokes.push(createSmoke(coords, false));
        } else {
            handlePreviewSmoke();
        }

        smokes = smokes.filter(smoke => smoke.getOpacity() > 0);
        smokes.forEach(smoke => smoke.animate());
    }

    return { animateSmokes };
}


function getHoverTracking() {
    const gridCols = 5;
    const gridRows = 2;
    const tracking = new Map();
    const totalCells = gridCols * gridRows;
    let coveredCells = 0;
    let lastReportedPercent = 0;

    const coordsOutOfBounds = (canvas, coords) => {
        return (coords.y < 0 || coords.y >= canvas.offsetHeight ||
            coords.x < 0 || coords.x >= canvas.offsetWidth);

    }

    return function (canvas, coords) {
        if (!coords || coordsOutOfBounds(canvas, coords)) return null;

        const x = Math.floor(coords.x / (canvas.offsetWidth / gridCols));
        const y = Math.floor(coords.y / (canvas.offsetHeight / gridRows));
        const key = '' + x + y;

        if (tracking.has(key)) return null;

        tracking.set(key, true);
        coveredCells++;

        const percentCovered = Math.floor((coveredCells / totalCells) * 100);

        // Only report when percentage changes
        if (percentCovered !== lastReportedPercent) {
            lastReportedPercent = percentCovered;
            trackEvent('#seen: ' + percentCovered + '%', false, true);
            return percentCovered;
        }

        return null;
    }
}


const trackEvent = (() => {
    let trackedActions = [];
    debug = false;
    return (actionName, engagement, trackOnce) => {
        if(trackOnce && trackedActions.includes(actionName)) return;

        bntTracking.trackEvent(actionName, null);
        if(engagement)
            adController.interaction.update("onclick");

        if(trackOnce)
            trackedActions.push(actionName);

        if(debug)
            console.log(actionName);
    }
})();


