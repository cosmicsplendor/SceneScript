
import { staticFile } from "remotion";

export const ambience1 = {
    name: "iceage",
    sky: staticFile("backgrounds/blue_sky.png"),
    fog: "#e6e6e6",
    fog: "#feecba",
    // sky: staticFile("backgrounds/sky1.jpg"),
    fog: "#2c7d87",
    fogDensity: .05,
    "road": {
        "light": "#476c6a",
        "colors": [
            "#29413d",
            "#29413d"
        ],
        "lf": 1
    },
    "roadEdge": {
        "colors": [
            "#ffffff",
            "#29413d"
        ],
        stripe: true,
        scale: 3
    },
    "leftRoadside": {
        "light": "#3fa6a1",
        "colors": [
            "#247475",
            "#247475"
        ],
        "lf": 1,
        sea: true
    },
    "sidewalk": {
        light: "#e2c36e",
        "colors": [
            "#88794e",
            "#8a8156"
        ],
        "lf": 0.8,
        scale: 2
    },
    "rightRoadside": {
        "light": "#44773c",
        "colors": [
            "#015e42",
            "#6fab64"
        ],
        "lf": 0.95
    },
    "laneMarkings": {
        "num": 2,
        "color": "#dbdbdb",
        "scale": 2,
        "light": "#ffffff",
        "lf": 0.55
    }
}