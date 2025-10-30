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
export const ambience2 = {
    name: "iceage",
    sky: staticFile("backgrounds/sunrise1.png"),
    fog: "#e6e6e6",
    // fog: "#feecba",
    // sky: staticFile("backgrounds/iceage_sky.png"),
    fog: "#2c7d87",
    fogDensity: 0.05,
    "road": {
        "light": "#e29b60",
        "colors": [
            "#f1e198",
            "#f1e198"
        ],
        "lf": 0.4
    },
    "roadside": {
        "light": "#e29b60",
        "colors": [
            "#f1e198",
            "#f1e198"
        ],
        "lf": 0.4
    },

    "laneMarkings": {
        "num": 2,
        "color": "#dbdbdb",
        "scale": 2,
        "light": "#ffffff",
        "lf": 0.55
    }
}


// export const jurassicAmb = {
//     name: "triassic",
//     sky: staticFile("backgrounds/sky1.jpg"),
//     fog: "#eef1f1",
//     fogDensity: 0.002,
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
//             "#e68e3b",
//             "#e68e3b"
//         ],
//         "lf": 0.71
//     },
//     "road": {
//         "light": "#f0c18b",
//         "colors": [
//             "#e6a23b",
//             "#df7615"
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
//     },
//     name: "jurassic",
// }