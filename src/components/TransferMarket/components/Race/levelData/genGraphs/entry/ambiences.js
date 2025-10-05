import { staticFile } from "remotion";

export const iceAgeAmb = {
    name: "iceage",
    sky: staticFile("backgrounds/sky1.jpg"),
    fog: "#487f85",
    fog: "#e6e6e6",
    sky: staticFile("backgrounds/iceage_sky.jpg"),
    fogDensity: 1,
    "road": {
        "light": "#000000",
        "colors": [
            "#2c2c2c",
            "#252525",
        ],
        "lf": 0
    },
    "roadside": {
        "light": "#bebebe",
        "colors": [
            "#f1f1f1",
            "#f8f5f5"
        ],
        "lf": -0.71
    },
   
    "roadEdge": {
        "light": "#6b6b6b",
        "colors": [
            "#ffffff",
            "#000000"
        ],
        "lf": 0.3,
        scale: 2,
        raise: true,
        stripe: true
    },
    "laneMarkings": {
        "num": 2,
        "color": "#dbdbdb",
        "scale": 2,
        "light": "#ffffff",
        "lf": 0.55
    }
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