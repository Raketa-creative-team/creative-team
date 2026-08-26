function preRenderCT(list = []) {
    const isVideo = (el) => el.element instanceof bnt.Video;
    const hasVideo = list.filter(el => isVideo(el)).length || creative.screens[0].deepGetEosByType(bnt.Video).length;

    if (hasVideo) return;

    const elements = list.length ? list : creative.screens[0].eos.map(eos => eos.element);

    function render(el) {
        const shouldRender = el.configs.get(bnt.get(bnt.State)).visible;

        if (!shouldRender) return;

        el.htmlElement.hidden = false;

        const currentState = bnt.get(bnt.State);
        const elemConfig = creative.screens[0].deepGetEos(el).getConfig(currentState);
        bnt.ElementRendererRegistry.rendererFor(el).applyScreenConfig(currentState, elemConfig);

        if (el.eos) el.eos.forEach(eos => render(eos));
    }

    if (typeof bntAd !== 'undefined' && bntAd) {
        bntAd.subscribe(function (e) {
            //AdLoaded
            bnt.logger.log('VPAID ADLOADED');
            adController.renderer.render(adController.element).map(function () {

                document.body.firstChild.hidden = false;
                bnt.get(bnt.MainStage).renderersMap.get(Screen1).screenElement.hidden = false;

                elements.forEach(el => render(el.element))

                bnt.TeadsPlayerAddons.apiProxy.addObserver(function (api) {
                    if (api) {
                        if (typeof api['setStartScreenVisibility'] == 'function') {
                            api.setStartScreenVisibility(false);
                        }
                    }
                });
            });
        }, 'AdLoaded');

        Screen1.onshow.addObserver(function () {
            bnt.get(bnt.MainStage).htmlElement.hidden = true;
            bnt.get(bnt.MainStage).htmlElement = document.body.querySelector('div');

            Screen1.onshow.removeObserver(arguments.callee);
        });
    }
}

preRenderCT();