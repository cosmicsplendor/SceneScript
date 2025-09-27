import { staticFile } from "remotion";

export const triassicAmb = {
    name: "nepal",
    sky: staticFile("backgrounds/galaxy1.jpg"),
    fog: "#000000",
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
            "#e68e3b",
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
    }
}

export const jurassicAmb = {
    ...triassicAmb,
    sky: staticFile("backgrounds/sky1.jpg"),
    "fog": "#82A6AA",
}