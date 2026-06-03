// false/null for unused options
const mapConfig = {
    mapElement: MapElement,
    mapAssetName: 'gmap_html',
    customIcon: {
        iconAssetName: "map_marker_png",
        size: 40,
    },
    zoom: 14,
    locations: getLocations(),
    mapStyle: getMapStyle(),
    google_map_id: "AIzaSyDe4AsA7y_plNGFuCddW_zPyrl7CEjtnzg",
}

mapConfig.mapElement.onshowAnimationStart.addObserver(async function () {
    mapConfig.mapElement.onshowAnimationStart.removeObserver(arguments.callee);

    const { mapElement, mapAssetName, customIcon, zoom, locations, mapStyle, google_map_id } = mapConfig;
    let userLocation = await getUserLocation();
    
    if(customIcon)
        customIcon.url = bnt.LIBRARY[customIcon.iconAssetName].link;

    const map = await addMap(mapElement, mapAssetName);
    listenMapEvents(map);

    initMap({ map, userLocation, customIcon, zoom, locations, mapStyle, google_map_id });
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

function initMap({ map, userLocation, customIcon, zoom, locations, mapStyle, google_map_id }){
    map.contentWindow.postMessage(JSON.stringify({ type:"initMap", data: {userLocation, customIcon, zoom, locations, mapStyle, google_map_id } }), "*");
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
        console.log(msg);
        var data = JSON.parse(msg.data);

        if (data.type == "gmap" && data.data == "ready")
            map.contentWindow.postMessage(JSON.stringify({ type: "initMap", data: { userLocation, zoom, google_map_id, locations, mapStyle, customIcon } }));

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

function getLocations() {
    return [
        { "name": "Louis Vuitton Hong Kong Landmark", "address": "Shops B6-B10, B23-B24 & B27-B30, B1/F, Landmark Atrium, Central <br>HK 00852, Hong Kong Island, Hong Kong SAR", "lat": 22.282120014978, "lon": 114.158312429005 },
        { "name": "Louis Vuitton Hong Kong 5 Canton Road", "address": "Shop G005-006, Harbour City, TST <br>HK 00852, Kowloon, Hong Kong SAR", "lat": 22.2964767133108, "lon": 114.169076823713 },
        { "name": "Louis Vuitton Hong Kong Airport", "address": "Unit 6E196 & 7E153, Terminal 1, Hong Kong International Airport <br>HK 00852, New Territories, Hong Kong SAR", "lat": 22.3149040617267, "lon": 113.933720981385 },
        { "name": "Louis Vuitton Hong Kong Times Square", "address": "Shop 211-212, Level 2, Times Square,1 Matheson Street, Causeway Bay <br>HK 00852, Hong Kong Island, Hong Kong SAR", "lat": 22.2786185476679, "lon": 114.181830952784 },
        { "name": "Louis Vuitton Hong Kong Elements", "address": "Shop 1020-1022, Elements, TST <br>HK 00852, Kowloon, Hong Kong SAR", "lat": 22.3043550192316, "lon": 114.161001852549 },
        { "name": "Louis Vuitton Hong Kong Pacific Place", "address": "Shop 236 & Shop 351A, Pacific Place <br>HK 00852, Hong Kong Island, Hong Kong SAR", "lat": 22.2778262367903, "lon": 114.164935683468 },
        { "name": "Louis Vuitton Hong Kong Lee Gardens", "address": "Shop G01, Lee Garden One, CWB <br>HK 00852, Hong Kong Island, Hong Kong SAR", "lat": 22.278597366676, "lon": 114.184890379533 },
        { "name": "Louis Vuitton Hong Kong Peninsula", "address": "Shop E2-6, The Peninsula Hong Kong <br>HK 00852, Kowloon, Hong Kong SAR", "lat": 22.2953009149822, "lon": 114.171853694877 },
    ];
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
