// https://studio-ui.teads.tv/studio/6753877077330085/editor/code/js

/*******************************
 * SPARKLES CONFIGURATION
 * ----------------------------
 * name:      the id for the asset in the library (e.g., 'image_png').
 * size:      scale multiplier (0.5 = 50% of original asset size, 1 = 100%).
 * opacity:   transparency range (0 = invisible, 1 = fully opaque);'start' is the baseline; it fades in/out based on duration.
 * rotations: range of the rotation arc in DEGREES. Note: 90 = quarter turn, 180 = half turn, 360 = full circle.
 * duration:  the time (in ms) for one complete cycle.
 * density:   total number of sparkle instances to be rendered on canvas.
 * delay:     the stagger time (in ms) between the appearance of each sparkle.
 ******************************/

const sparklesConfig = {
    htmlBox: sparkles_canvas, // Name of your htmlBox here
    images: [
        { name: 'pacman_png', size: { min: 0.1, max: 1 }, opacity: { min: 0, max: 1 }, rotations: { min: 0, max: 360 }, duration: 1000 },
        { name: 'ellipse1_png', size: { min: 0, max: 1 }, opacity: { min: 0, max: 1 }, rotations: { min: 0, max: 180 }, duration: 1000 },
        { name: 'icon_1639167753744_151_png', size: { min: 0.2, max: 1 }, opacity: { min: 0, max: 0.8 }, rotations: { min: 0, max: 90 }, duration: 1500 },
        { name: 'icon_png', size: { min: 0.2, max: 0.8 }, opacity: { min: 0, max: 1 }, rotations: { min: 0, max: 90 }, duration: 2500 }
    ],
    density: 40,
    delay: 150,
    keepOnScreen: true,
}

sparklesConfig.htmlBox.onshowAnimationEnd.addObserver(function () {

    if (sparklesConfig.keepOnScreen) keepOnScreens(sparklesConfig.htmlBox);

    setStyle(sparklesConfig.htmlBox);

    initSparkle(sparklesConfig);

    sparklesConfig.htmlBox.onshowAnimationEnd.removeObserver(arguments.callee);
});

async function initSparkle(config) {
    const {
        htmlBox,
        images,
        density,
        delay,
    } = config;

    const canvas = createCanvas();

    setCanvasSize(canvas, htmlBox);

    appendCanvas(htmlBox, canvas);

    const ctx = canvas.getContext('2d');

    const loadImages = images.map(img => getAsset(img));

    const loadedAssets = await Promise.all(loadImages);

    const listCount = Math.ceil(density / loadImages.length);

    const densityList = new Array(listCount).fill(loadedAssets).flat().slice(0, density);

    let bntLoop;

    const sparkles = densityList.map((dItem, index) => {
        return new Sparkle({
            ctx,
            canvas,
            asset: dItem.img,
            imgConfig: dItem.el,
            startDelay: index * delay
        });
    });

    sparkles.forEach((sparkle, index) => {
        setTimeout(() => {
            sparkle.setPlayStatus(true);
        }, index * delay);
    });

    function loop() {
        bntLoop = bnt.requestAnimFrame(loop);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        sparkles.forEach(sparkle => sparkle.animate());
    }

    function stopLoop(bntLoop) {
        cancelAnimationFrame(bntLoop)
    }

    loop();

    htmlBox.onhideAnimationEnd.addObserver(function () { stopLoop(bntLoop) })
}

function Sparkle({ ctx, canvas, asset, imgConfig }) {
    const { size, opacity, rotations, duration } = imgConfig;

    const stopwatch = new bnt.Stopwatch();

    let playStatus = false;

    this.setPlayStatus = (status) => {
        playStatus = status;

        if (playStatus === false) stopwatch.pause();
        if (playStatus === true) stopwatch.play();
    }

    this.getFromRange = (size) => {
        return Math.random() * (size.max - size.min) + size.min;
    }

    this.getSize = (asset, scale) => {
        return {
            height: asset.height * scale,
            width: asset.width * scale
        }
    }

    this.getCoords = (canvas) => {
        return {
            x: canvas.width * Math.random(),
            y: canvas.height * Math.random()
        }
    }

    this.remapPercent = (percent) => {
        return 1 - Math.abs(2 * percent - 1)
    }

    const scale = this.getFromRange(size);
    const assetSize = this.getSize(asset, scale);

    const alpha = this.getFromRange(opacity);
    const angle = this.getFromRange(rotations);

    let coords = this.getCoords(canvas);

    let currentOpacity, currentRotation;

    this.updateSparkle = () => {
        let time = stopwatch.getTime();
        time = time % duration;

        let percent = time / duration;

        if (percent > 1) {
            coords = this.getCoords(canvas);
            percent = 0;
        }

        const rPercent = this.remapPercent(percent);

        currentOpacity = alpha * rPercent;
        currentRotation = angle * percent;
    };

    this.drawSparkle = () => {
        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.translate(coords.x, coords.y);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.drawImage(asset, -assetSize.width / 2, -assetSize.height / 2, assetSize.width, assetSize.height);
        ctx.restore();
    };

    this.animate = () => {
        if (!playStatus) return;

        this.updateSparkle();
        this.drawSparkle();
    };
}

function getAsset(el) {
    const img = new Image();
    img.style.width = '100%';
    img.style.height = '100%';
    img.src = bnt.LIBRARY[el.name].link;

    const asset = {
        img,
        el
    }

    return new Promise((resolve, reject) => {
        img.onload = img.onerror = img.onabort = () => resolve(asset)
    })
}

function appendCanvas(htmlBox, canvas) {
    const childElement = htmlBox.htmlElement.querySelector(".animation div");

    childElement.appendChild(canvas);
}

function setCanvasSize(canvas, htmlBox) {
    canvas.width = htmlBox.htmlElement.offsetWidth;
    canvas.height = htmlBox.htmlElement.offsetHeight;

    canvas.style.position = "absolute";
    canvas.style.top = 0;
}

function createCanvas() {
    const canvas = document.createElement("canvas");

    return canvas;
}

function setStyle(sparkle) {
    sparkle.htmlElement.style.zIndex = 1000;

    sparkle.htmlElement.style.pointerEvents = "none";
}

function keepOnScreens(sparkle) {
    const firstScreen = creative.screens[0];
    const parent = document.getElementById(firstScreen.name).parentNode;

    firstScreen.removeElement(sparkle);
    parent.appendChild(sparkle.htmlElement);
}