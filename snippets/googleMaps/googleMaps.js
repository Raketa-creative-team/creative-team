// false/null for unused options
const mapConfig = {
    mapElement: MapElement,
    mapAssetName: 'gmap_html',
    customIcon: {
        iconAssetName: "map_marker_png",
        size: 40,
    },
    zoom: 14,
    mapStyle: getMapStyle(),
    google_map_id: "AIzaSyDe4AsA7y_plNGFuCddW_zPyrl7CEjtnzg",
}

mapConfig.mapElement.onshowAnimationStart.addObserver(async function () {
    mapConfig.mapElement.onshowAnimationStart.removeObserver(arguments.callee);

    const { mapElement, mapAssetName, customIcon, zoom, mapStyle, google_map_id } = mapConfig;
    let userLocation = await getUserLocation();
    
    if(customIcon)
        customIcon.url = bnt.LIBRARY[customIcon.iconAssetName].link;

    const map = await addMap(mapElement, mapAssetName);
    listenMapEvents(map);

    initMap({ map, userLocation, customIcon, zoom, mapStyle, google_map_id });
});

function addMap(parent, mapAssetName) {
    const mapURL = bnt.LIBRARY[mapAssetName].link;
    const iframe = createIframe();

    const parentNode = parent.htmlElement.querySelector('.animation > div');
    parentNode.appendChild(iframe);

    return new Promise((resolve, reject) => {
        iframe.src = mapURL;
        window.addEventListener("message", function (msg) {
            if (!msg.origin.includes("s8t.teads.tv")) return;

            try {
                const data = JSON.parse(msg.data);
                const iframeReady = data?.type == "gmap" && data.data == "ready";
                if (iframeReady) {
                    window.removeEventListener("message", arguments.callee);
                    resolve(iframe);
                }
            } catch (e) {
                reject("Error loading map");
            }
        });
    });
}

function initMap({ map, userLocation, customIcon, zoom, mapStyle, google_map_id }){
    map.contentWindow.postMessage(JSON.stringify({ type:"initMap", data: { userLocation, customIcon, zoom, mapStyle, google_map_id } }), "*");
}

function createIframe(){
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    return iframe;
}

function listenMapEvents(map) {
    window.addEventListener("message", function (msg) {
        var data = JSON.parse(msg.data);

        if (data.type == "gmap" && data.data == "ready")
            initMap({ map, userLocation, customIcon, zoom, mapStyle, google_map_id })

        switch (data.data) {
            case "track":
                trackMapEvent(data.content)
                break;
            // case "closestStore":
            // displayClosestStore(data.content);
            // break;
            default:
        }
    });
}

function sendMapMessage(map, data) {
    map.contentWindow.postMessage(JSON.stringify(data), "*");
}

function trackMapEvent(event) {
    // console.log("trackmap ", event);
    bntTracking.trackEvent(event, null);
}

async function getUserLocation() {
    const url = "https://tag.brainient.com/geoip";
    try {
        const response = await fetch(url);
        const responseText = await response.text();
        const dataList = responseText.split('|');

        return { countryName: dataList[1], cityName: dataList[2], cityCode: dataList[3], zipCode: dataList[4], lat: dataList[5], lon: dataList[6] };
    } catch (error) {
        console.error(error.message);
    }
}

function getMapUrl(src, options) {
    const keys = Object.keys(options);
    let initialURL = bnt.LIBRARY[src].link + "?";
    return keys.reduce((acc, cur) => `${acc}${cur}=${options[cur]}&`, initialURL);
}

function getMapStyle() {
    return [{
        'featureType': 'administrative.locality',
        'elementType': 'all',
        'stylers': [{
            'hue': '#2c2e33'
        }, {
            'saturation': 7
        }, {
            'lightness': 19
        }, {
            'visibility': 'on'
        }]
    }, {
        'featureType': 'landscape',
        'elementType': 'all',
        'stylers': [{
            'hue': '#ffffff'
        }, {
            'saturation': -100
        }, {
            'lightness': 100
        }, {
            'visibility': 'simplified'
        }]
    }, {
        'featureType': 'poi',
        'elementType': 'all',
        'stylers': [{
            'hue': '#ffffff'
        }, {
            'saturation': -100
        }, {
            'lightness': 100
        }, {
            'visibility': 'off'
        }]
    }, {
        'featureType': 'road',
        'elementType': 'geometry',
        'stylers': [{
            'hue': '#bbc0c4'
        }, {
            'saturation': -93
        }, {
            'lightness': 31
        }, {
            'visibility': 'simplified'
        }]
    }, {
        'featureType': 'road',
        'elementType': 'labels',
        'stylers': [{
            'hue': '#bbc0c4'
        }, {
            'saturation': -93
        }, {
            'lightness': 31
        }, {
            'visibility': 'on'
        }]
    }, {
        'featureType': 'road.arterial',
        'elementType': 'labels',
        'stylers': [{
            'hue': '#bbc0c4'
        }, {
            'saturation': -93
        }, {
            'lightness': -2
        }, {
            'visibility': 'simplified'
        }]
    }, {
        'featureType': 'road.local',
        'elementType': 'geometry',
        'stylers': [{
            'hue': '#e9ebed'
        }, {
            'saturation': -90
        }, {
            'lightness': -8
        }, {
            'visibility': 'simplified'
        }]
    }, {
        'featureType': 'transit',
        'elementType': 'all',
        'stylers': [{
            'hue': '#e9ebed'
        }, {
            'saturation': 10
        }, {
            'lightness': 69
        }, {
            'visibility': 'on'
        }]
    }, {
        'featureType': 'water',
        'elementType': 'all',
        'stylers': [{
            'hue': '#e9ebed'
        }, {
            'saturation': -78
        }, {
            'lightness': 67
        }, {
            'visibility': 'simplified'
        }]
    }];
}
