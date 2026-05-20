
(function preRender() {
    const isVideo = (el) => el.element instanceof bnt.Video;
    const allElements = creative.screens[0].getAllEos();

    const hasVideo = allElements.filter(isVideo).length > 0;
    if(hasVideo) return;

    const unhideElement = (el) => {
        let elementVisible = el.element.baseConfig.visible && el.element.baseConfig.width > 0;
        if (!elementVisible) return;

        el.element.htmlElement.hidden = false;

        let currentState = bnt.get(bnt.State);
        let elemConfig = creative.screens[0].deepGetEos(el.element).getConfig(currentState);
        bnt.ElementRendererRegistry.rendererFor(el.element).applyScreenConfig(currentState, elemConfig);
    }


    if (typeof bntAd !== 'undefined' && bntAd) {
        bntAd.subscribe(function (e) {
            adController.renderer.render(adController.element);
                bnt.get(bnt.MainStage).htmlElement.hidden = false;
                bnt.get(bnt.MainStage).renderersMap.get(creative.screens[0]).screenElement.hidden = false;

                allElements.forEach(unhideElement);

                bnt.TeadsPlayerAddons.apiProxy.addObserver(function (api) {
                    if (api) {
                        if (typeof api['setStartScreenVisibility'] == 'function') {
                            api.setStartScreenVisibility(false);
                        }
                    }
                });
        }, 'AdLoaded');
    }
}());