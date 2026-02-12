// https://studio-ui.teads.tv/studio/6753877077328886/editor/code/js

/******************************************
 * Sound Icon config
 *****************************************/
var soundConfig = {
    css: {
        'left': 60, //Position on X axis. Leave just the quotes for default
        'top': 60, //Position on Y axis. Leave just the quotes for default
        'background-image': 'blackSoundIcon_svg', //Name of the svg file goes between the quotes. Leave just the quotes if you don't wish to change sound color
    },
    'screensToHideSoundIcon': [Screen1, Screen2], //Name of the screens the sound icon should not be displayed; Separate them with comma. Leave it empty for default
    'videosToShowSoundIconOn': [MainVideo] //Name of the Video the sound icon should be displayed; Separate them with comma. Leave it empty for default
}

/******************************************
 * Sound Icon visibile calcs
 *****************************************/
function getCss(config) {
    const clone = new Map(Object.entries(config));

    const isNumber = prop => typeof prop === 'number';

    function scaleProp(prop) {
        if (!isNumber(prop)) return prop;

        const scale = window.innerWidth / creative.canvases[0].config.width;
        return prop * scale;
    }

    function addPx(prop) {
        if (!isNumber(prop)) return prop;

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

    const soundBtnHiddenCss = { left: 2000, top: 2000 }
    const additionalCss = {right: 'auto', bottom: 'auto', transform: 'translateX(-50%) translateY(-50%)', padding: '10px 8px'}
    const soundBntVisibleCss = { ...css, ... additionalCss }

    delete soundBntVisibleCss['background-image'];

    const { left, top, ...soundIconVisbleCss } = css;

    soundIconVisbleCss['background-image'] = `url( ${bnt.LIBRARY[soundIconVisbleCss['background-image']].link}) !important`;

    const teadsApi = getTeadsApi();

    if (!teadsApi) return;

    //CN = className
    const soundBtnVissibleCN = `div.teads-ui-component-soundbutton ${getCss(soundBntVisibleCss)}`;
    const soundBtnHiddenCN = `div.teads-ui-component-soundbutton ${getCss(soundBtnHiddenCss)}`;

    const soundIconVisibleCN = `.icon-muteoff, .icon-muteon ${getCss(soundIconVisbleCss)}`;

    // Apply custom sound icon if screen1 does not has other rulles
    teadsApi.callPlayerApiMethod('customizeUI', [soundBtnVissibleCN + soundIconVisibleCN]);

    hideSound = () => { teadsApi.callPlayerApiMethod('customizeUI', [soundBtnHiddenCN]); console.log('asas')}
    showSound = () => teadsApi.callPlayerApiMethod('customizeUI', [soundBtnVissibleCN + soundIconVisibleCN])

    screensToHideSoundIcon.forEach(screen => {
        screen.onshow.addObserver(hideSound, {once: true});
        screen.onhide.addObserver(showSound, {once: true});
    })

    videosToShowSoundIconOn.forEach(video => {
        video.onplay.addObserver(showSound, {once: true});
        video.onpause.addObserver(hideSound, {once: true});
        video.onend.addObserver(hideSound, {once: true});
    })
}

addSoundIcon(soundConfig)