import { staticFile } from "remotion";

export const ambience1 = {
   name: "triassic",
   sky: staticFile("backgrounds/sunrise1.png"),
   sky: staticFile("backgrounds/nightsky2.png"),
   sky: staticFile("backgrounds/blue_sky.png"),
   sky: staticFile("backgrounds/sunrise1.png"),
   sky: staticFile("backgrounds/iceage_sky.jpg"),
    fog: "#1e2a3b",
    fog: "#fef1b5",
    fog: "#242d3c",
    fogDensity: 2,
    fog: "#efefef",
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
            "#da924f",
            "#da924f"
        ],
        "lf": 0.71
    },
    "road": {
        "light": "#f0c18b",
        "colors": [
          "#da924f",
            "#da924f"
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