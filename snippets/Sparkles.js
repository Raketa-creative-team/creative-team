// https://studio-ui.teads.tv/studio/6753877077330085/editor/code/js

/*******************************
 * SPARKLES CONFIGURATION
 * ----------------------------
 * name:      the id for the asset in the library (e.g., 'image_png').
 * size:      scale multiplier (0.5 = 50% of original asset size, 1 = 100%).
 * opacity:   transparency range (0 = invisible, 1 = fully opaque);'start' is the baseline; it fades in/out based on duration.
 * rotations: range of the rotation arc in DEGREES. Note: 90 = quarter turn, 180 = half turn, 360 = full circle.
 * duration:  the time (in seconds) for one complete cycle.
 * density:   total number of sparkle instances to be rendered on canvas.
 * delay:     the stagger time (in ms) between the appearance of each sparkle.
 ******************************/

const sparklesConfig = {
    htmlBox: sparkles_canvas, // Name of your htmlBox here
    images: [
        { name: 'pacman_png', size: { min: 0.1, max: 1 }, opacity: { start: 0, end: 1 }, rotations: { start: 0, end: 360 }, duration: 3 },
        { name: 'ellipse1_png', size: { min: 0.2, max: 0.9 }, opacity: { start: 0, end: 0.9 }, rotations: { start: 0, end: 180 }, duration: 3 },
        { name: 'icon_1639167753744_151_png', size: { min: 0.2, max: 1 }, opacity: { start: 0, end: 0.8 }, rotations: { start: 0, end: 90 }, duration: 1.5},
        { name: 'icon_png', size: { min: 0.2, max: 0.8 }, opacity: { start: 0, end: 1 }, rotations: { start: 0, end: 90 }, duration: 1.5 }
    ],
    density: 20,
    delay: 50,
}

sparklesConfig.htmlBox.onshowAnimationEnd.addObserver(function () {
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

    const canvas = createCvsElement(htmlBox);

    setCanvasSize(canvas);

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

function Sparkle({ ctx, canvas, asset, imgConfig, startDelay }) {

    const { size, opacity, rotations, duration } = imgConfig;

    const stopwatch = new bnt.Stopwatch();

    let playStatus = false;

    this.setPlayStatus = (status) => {
        playStatus = status;

        if (playStatus === false) stopwatch.pause();
        if (playStatus === true) stopwatch.play();
     }

    this.getFromRange = (size) => {
        return Math.random() * (size.max - size.min) + size.min
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

    this.getDimension = (dimension) => {
        return dimension.start + (dimension.end - dimension.start)
    }

    const scale = this.getFromRange(size);
    const wh = this.getSize(asset, scale);

    const durationMs = duration * 1000;

    let coords = this.getCoords(canvas);

    let currentOpacity, currentRotation;



    this.updateSparkle = () => {
        const time = stopwatch.getTime();

        let percent = time / durationMs;

        if (percent > 1) {
            stopwatch.stop();
            stopwatch.play();

            coords = this.getCoords(canvas);
            percent = 0;
        }

        const rPercent = this.remapPercent(percent);

        currentOpacity = this.getDimension(opacity) * rPercent;
        currentRotation = this.getDimension(rotations) * rPercent;
    };

    this.drawSparkle = () => {
        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.translate(coords.x, coords.y);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.drawImage(asset, -wh.width / 2, -wh.height / 2, wh.width, wh.height);
        ctx.restore();
    };

    this.animate = () => {
        if (!playStatus) return;

        this.updateSparkle();
        this.drawSparkle();
    };
}

function sortImages(images) {
    return images.sort()
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

function setCanvasSize(canvas) {
    canvas.width = creative.canvases[0].config.width;
    canvas.height = creative.canvases[0].config.height;

    canvas.style.position = "absolute";
    canvas.style.top = 0;
}

function createCvsElement(htmlBox) {
    const canvasCsv = document.createElement("canvas");

    htmlBox.htmlElement.appendChild(canvasCsv);

    return canvasCsv;
}