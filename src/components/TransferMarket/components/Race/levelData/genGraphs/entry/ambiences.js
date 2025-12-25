import { staticFile } from "remotion";
export const ambience = {
    name: "iceage",
    fog: "#487f85",
    fog: "#b7854f",
    fog: "#ebebeb",
    fog: "#000000",
    fog: "#fff4c9",
    sky: staticFile("backgrounds/vibrant1.png"),
    sky: staticFile("backgrounds/iceage_sky.jpg"),
    sky: staticFile("backgrounds/sky4.jpg"),
    sky: staticFile("backgrounds/nightsky2.png"),
    sky: staticFile("backgrounds/fuzi.png"),
    sky: staticFile("backgrounds/blacksky.png"),
    sky: staticFile("backgrounds/sunrise1.png"),
    fogDensity: 0.1,
    "road": {
        "light": "#5a5a5a",
        "colors": [
            "#020202",
            "#131313",
        ],
        "lf": 0.55
    },
    "rightRoadside": {
        "light": "#3fa6a1",
        "colors": [
            "#247475",
            "#247475"
        ],
        "lf": 1,
        sea: true
    },
    "roadside": {
       "light": "#f0c18bf1",
        "colors": [
            "#d3853b",
            "#c0752f"
        ],
        "lf": 1
    },
    "road": {
        "light": "#b97339",
        "colors": [
            "#4b2817",
            "#583521"
        ],
        "lf": 0.75
    },
    "laneMarkings": {
        "num": 2,
        "color": "#dbdbdb",
        "scale": 2,
        "light": "#ffffff",
        "lf": 0.55
    }
}

// import { staticFile } from "remotion";

// export const ambience = {
//    name: "triassic",
//    sky: staticFile("backgrounds/sunrise1.png"),
//    sky: staticFile("backgrounds/nightsky2.png"),
//    sky: staticFile("backgrounds/blue_sky.png"),
//    sky: staticFile("backgrounds/iceage_sky.jpg"),
//    sky: staticFile("backgrounds/sunrise1.png"),
//     fog: "#1e2a3b",
//     fog: "#242d3c",
//     fog: "#efefef",
//     fog: "#fef1b5",
//     fogDensity: 1,
//     "road": {
//         "light": "#5a5a5a",
//         "colors": [
//             "#020202",
//             "#131313",
//         ],
//         "lf": 0.55
//     },
//     "roadside": {
//         "light": "#f0c18b",
//         "colors": [
//             "#da924f",
//             "#da924f"
//         ],
//         "lf": 0.71
//     },
//     "road": {
//         "light": "#f0c18b",
//         "colors": [
//           "#da924f",
//             "#da924f"
//         ],
//         "lf": 0.71
//     },
//     // "roadEdge": {
//     //     "light": "#6b6b6b",
//     //     "colors": [
//     //         "#d16902",
//     //         "#e24111"
//     //     ],
//     //     "lf": 0.3,
//     //     scale: 2,
//     //     raise: true
//     // },
//     "laneMarkings": {
//         "num": 2,
//         "color": "#dbdbdb",
//         "scale": 2,
//         "light": "#ffffff",
//         "lf": 0.55
//     }
// }