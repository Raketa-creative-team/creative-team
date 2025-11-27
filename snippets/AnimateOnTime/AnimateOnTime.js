//https://studio-ui.teads.tv/studio/6753877077300297/editor/code/js

const timelineConfig = {
    screen: Screen1,
    transitionDuration: 0.3,
    steps: [
        { name: Video1, triggerAt: 5, top: '0px', left: '0px', width: '800px' },
        { name: Video1, triggerAt: 8, top: '100px', left: '100px', width: '1000px' },
    ]
}

adController.onstart.addObserver(() => setPrerenderPosition(timelineConfig))

function setPrerenderPosition(config) {
    const { screen } = config;
    const configs = getConfigsById(config);

    configs.forEach(conf => {
        const firstStep = conf.steps.sort((a, b) => a.triggerAt - b.triggerAt)[0]

        if (firstStep.triggerAt !== 0) return;

        const state = screen.getEos(firstStep.name).configs.get(bnt.get(bnt.State));
        const statePos = { x: parseInt(firstStep.left), y: parseInt(firstStep.top) };

        Object.assign(state, statePos)
    })
}

timelineConfig.screen.onshow.addObserver(() => initTimeline(timelineConfig));

function initTimeline(config) {
    const { screen } = config;

    const configs = getConfigsById(config);

    const timelines = configs.map(conf => new AnimTimeline(conf));

    function loop() {
        bnt.requestAnimFrame(loop);

        const time = getTime(screen);

        timelines.forEach(tl => tl.animate(time))
    }

    loop();
}

function getConfigsById(config) {
    const { transitionDuration, steps } = config

    const ids = [...new Set(steps.map(step => step.name.elementId))];

    const configs = ids.map(id => {
        const idSteps = steps.filter(step => step.name.elementId === id);

        return { transitionDuration, steps: idSteps };
    })

    return configs;
}

function getTime(screen) {
    const hasVideo = !!screen.deepGetEosByType(bnt.Video).length;

    if (hasVideo) return document.getElementById(screen.name).querySelector('video').currentTime;
    else return screen.timeMillisec.value;
}

function AnimTimeline(config) {
    const { transitionDuration, steps } = config;

    let lastTrigger = 0;

    this.setDefaultStep = () => {
        const initialState = {
            name: steps[0].name,
            triggerAt: 0,
            top: steps[0].name.htmlElement.style.top,
            left: steps[0].name.htmlElement.style.left,
            width: steps[0].name.htmlElement.offsetWidth + 'px',
        }

        const firstStep = steps.sort((a, b) => a.triggerAt - b.triggerAt)[0];
        if (firstStep !== 0) steps.push(initialState);
    }

    this.fixSize = (element) => {
        const height = element.htmlElement.offsetHeight + 'px';
        const width = element.htmlElement.offsetWidth + 'px';

        const nodes = [
            element.htmlElement.querySelector('.animation'),
            element.htmlElement.querySelector('.animation > div'),
            element.htmlElement.querySelector('.animation > div')?.firstChild,
        ].filter(node => node !== null);

        Object.assign(element.htmlElement.style, { height, width });
        nodes.forEach(node => Object.assign(node.style, { width: '100%', height: '100%' }));
    }

    this.setTrasition = (steps) => {
        steps.forEach(step => {
            Object.assign(step.name.htmlElement.style, { transition: `all ${transitionDuration}s` });
        })
    }

    this.updateStyle = (config) => {
        const { name, top, left, width } = config;

        const ratio = name.htmlElement.offsetWidth / name.htmlElement.offsetHeight;

        const height = parseInt(width) / ratio + 'px';
        const style = { top, left, width, height };

        Object.assign(name.htmlElement.style, style);
    }

    this.getNextStep = (trigger) => {
        const possibleSteps = steps.filter(step => step.triggerAt <= trigger);
        const closestSteps = possibleSteps.sort((a, b) => b.triggerAt - a.triggerAt);

        return closestSteps[0];
    }

    this.animate = (trigger) => {
        const nextStep = this.getNextStep(trigger);

        if (!nextStep) return

        if (nextStep.triggerAt === lastTrigger) return;
        lastTrigger = nextStep.triggerAt;

        this.updateStyle(nextStep);
    };

    this.setDefaultStep();
    this.fixSize(steps[0].name);
    this.setTrasition(steps);
}