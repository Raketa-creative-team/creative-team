// https://studio-ui.teads.tv/studio/6753877077328886/editor/code/js

/******************************************
 * Sound Icon config
 *****************************************/
var soundConfig = {
    css: {
        'left': '20', //Position on X axis.
        'top': '20', //Position on Y axis.
        'background-image': '', //Name of the svg file goes between the quotes. Leave just the quotes if you don't wish to change sound color
    },
    'screensToHideSoundIcon': [Screen1, Screen2], //Name of the screens the sound icon should not be displayed; Separate them with comma. Leave it empty for default
    'videosToShowSoundIconOn': [MainVideo] //Name of the Video the sound icon should be displayed; Separate them with comma. Leave it empty for default
}

/******************************************
 * Sound Icon visibile calcs
 *****************************************/
function getCss(config) {
    const clone = new Map(Object.entries(config));

    function scaleProp(prop) {
        if (isNaN(prop)) return prop;
        const scale = window.innerWidth / creative.canvases[0].config.width;

        return parseInt(prop) * scale;
    }

    function addPx(prop) {
        if (isNaN(prop)) return prop;

        return prop + 'px';
    }

    const addImportant = prop => `${prop} !important`;

    clone.keys().forEach(k => {
        const prop = clone.get(k);

        const scaled = scaleProp(prop);
        const px = addPx(scaled);
        const important = addImportant(px);

        clone.set(k, important);
    })

    const css = [...clone.keys()].map(k => `${k}: ${clone.get(k)};`).join(' ');

    return `{ ${css} }`
}

const getTeadsApi = () => {
    let teadsApi;
    bnt.TeadsPlayerAddons.apiProxy.addObserver(api => teadsApi = api);
    return teadsApi;
}

function addSoundIcon(config) {
    const { css, screensToHideSoundIcon, videosToShowSoundIconOn } = config;

    const soundBtnHiddenCss = { display: 'none', width: 10 }
    const additionalCss = { right: 'auto', bottom: 'auto', transform: 'translateX(-50%) translateY(-50%)', padding: '10px 8px' }
    const soundBntVisibleCss = { ...css, ...additionalCss }

    delete soundBntVisibleCss['background-image'];

    const { left, top, ...soundIconVisbleCss } = css;

    const url = `url( ${bnt.LIBRARY[soundIconVisbleCss['background-image']]?.link})`
    if (soundIconVisbleCss['background-image'].trim().length) soundIconVisbleCss['background-image'] = url;

    const teadsApi = getTeadsApi();

    if (!teadsApi) return;

    const defaultCallPlayerApiMethod = teadsApi.callPlayerApiMethod;

    teadsApi.callPlayerApiMethod = function (...args) {
        if (args[0] === 'customizeUI') return;

        const finalArgs = [...args];
        if (finalArgs[0] === 'customizeUI2') finalArgs[0] = 'customizeUI';

        return defaultCallPlayerApiMethod.apply(this, finalArgs);
    };

    //CN = className
    const soundBtnVissibleCN = `div.teads-ui-component-soundbutton ${getCss(soundBntVisibleCss)}`;
    const soundBtnHiddenCN = `div.teads-ui-component-soundbutton ${getCss(soundBtnHiddenCss)}`;

    const soundIconVisibleCN = `.icon-muteoff, .icon-muteon ${getCss(soundIconVisbleCss)}`;

    // Apply custom sound icon if screen1 does not have other rules
    teadsApi.callPlayerApiMethod('customizeUI2', [soundBtnVissibleCN + soundIconVisibleCN]);

    hideSound = () => { teadsApi.callPlayerApiMethod('customizeUI2', [soundBtnHiddenCN]); }
    showSound = () => teadsApi.callPlayerApiMethod('customizeUI2', [soundBtnVissibleCN + soundIconVisibleCN])

    screensToHideSoundIcon.forEach(screen => {
        screen.onshow.addObserver(hideSound);
        screen.onhide.addObserver(showSound);
    })

    videosToShowSoundIconOn.forEach(video => {
        video.onplay.addObserver(showSound);
        video.onpause.addObserver(hideSound);
        video.onend.addObserver(hideSound);
    })
}

addSoundIcon(soundConfig)