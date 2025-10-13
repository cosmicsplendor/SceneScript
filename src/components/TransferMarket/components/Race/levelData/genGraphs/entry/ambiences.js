import { staticFile } from "remotion";

export const iceAgeAmb = {
    name: "iceage",
    sky: staticFile("backgrounds/sunrise1.png"),
    sky: staticFile("backgrounds/iceage_sky.jpg"),
    fog: "#e6e6e6",
    // fog: "#feecba",
    sky: staticFile("backgrounds/sky1.jpg"),
    fog: "#487f85",
    fogDensity: 0.5,
    "road": {
        "light": "#bebebe",
        "colors": [
            "#f1f1f1",
            "#f8f5f5"
        ],
        "lf": -0.71
    },
    "roadside": {
        "light": "#bebebe",
        "colors": [
            "#f1f1f1",
            "#f8f5f5"
        ],
        "lf": -0.71
    },

    "laneMarkings": {
        "num": 2,
        "color": "#dbdbdb",
        "scale": 2,
        "light": "#ffffff",
        "lf": 0.55
    }
}
export const iceageRiver = {
    ...iceAgeAmb,
    name: "ice_river",
    roadside: null,
    "leftRoadside": {
        "light": "#68b9a0",        // gentle pond highlight
        "colors": [
            "#3a7e6d",             // balanced green-blue
            "#3c7568"              // slightly darker tone, close in hue
        ],
        "lf": 0.8,
        scale: 6,
        sea: true
    },
    "rightRoadside": {
        "light": "#bebebe",
        "colors": [
            "#f1f1f1",
            "#f8f5f5"
        ],
        "lf": -0.71
    },
}

export const jurassicAmb = {
    name: "triassic",
    sky: staticFile("backgrounds/sky1.jpg"),
    fog: "#eef1f1",
    fogDensity: 0.002,
    "road": {
        "light": "#5a5a5a",
        "colors": [
            "#020202",
            "#131313",
        ],
        "lf": 0.55
    },
    "roadside": {
        "light": "#f0c18b",
        "colors": [
            "#e68e3b",
            "#e68e3b"
        ],
        "lf": 0.71
    },
    "road": {
        "light": "#f0c18b",
        "colors": [
            "#e6a23b",
            "#df7615"
        ],
        "lf": 0.71
    },
    // "roadEdge": {
    //     "light": "#6b6b6b",
    //     "colors": [
    //         "#d16902",
    //         "#e24111"
    //     ],
    //     "lf": 0.3,
    //     scale: 2,
    //     raise: true
    // },
    "laneMarkings": {
        "num": 2,
        "color": "#dbdbdb",
        "scale": 2,
        "light": "#ffffff",
        "lf": 0.55
    },
    name: "jurassic",
}