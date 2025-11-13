import { staticFile } from "remotion";

export const ambience1 = {
   name: "triassic",
    sky: staticFile("backgrounds/sunrise1.png"),
    sky: staticFile("backgrounds/blue_sky.png"),
    // sky: staticFile("backgrounds/nightsky2.png"),
    fog: "#fef1b5",
    fog: "#eef1f1",
    // fog: "#242d3c",
    fogDensity: 0.01,
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
    }
}