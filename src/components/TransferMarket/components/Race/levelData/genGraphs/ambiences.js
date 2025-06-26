import Parallax from "../../lib/components/Parallax"

export const vibes = {
    mystique: {
        sky: "#7BB5BD",
        fogDensity: 1.5
    },
    emerald: {
        sky: "#88EEC0",
        fogDensity: 1
    },
    alien1: {
        sky: "#23b6ac",
        fogDensity: 1,
    },
    alien2: {
        sky: "#3aa39c",
        fogDensity: 1.5,
    },
    fog0: {
        sky: "#207E77",
        fogDensity: 0.5,
    },
    fog1: {
        sky: "#3b9b94",
        fogDensity: 0.875,
    },
    fog2: {
        sky: "#439792",
        fogDensity: 1.5,
    },
    fog00: {
        sky: "rgb(32, 121, 88)",
        fogDensity: 0.5,
    },
    fog01: {
        sky: "rgb(32, 121, 88)",
        fogDensity: 0.7,
    },
    fog02: {
        sky: "rgb(32, 121, 88)",
        fogDensity: 1.4,
    },
    breeze: {
        sky: "#000000",
        sky: "#ffffff",
        sky: "#000000",
        sky: "#000011",
        fogDensity: 0.5
    },
    egypt: {
        sky: "rgb(22, 61, 96)",
        fogDensity: 0.5
    },
    kherest: {
        sky: "#225F67",
        fogDensity: 0.6
    },
    np_light: {
        sky: "#306191",
        fogDensity: 0.1
    },
    mBeach: {
        sky: "rgb(13, 88, 119)",
        fogDensity: 0.5
    },
    khemet: {
        sky: "#277C76",
        fogDensity: 1.2
    },
    dawn: {
        sky: "#42688b",
        fogDensity: 0.75
    },
    nile: {
        sky: "rgb(15 76 126)",
        fogDensity: 0.25
    }
}

export const roads = {
    nile: {
        name: "nile",
        "road": {
            "light": "#436b8b",
            "colors": [
                "#1c3d5a",
                "#1c3d5a"
            ],
            "lf": 1
        },
        "leftRoadside": {
            "light": "#e29b60",
            "colors": [
                "#f1cc98",
                "#f1cc98"
            ],
            "lf": 0.4
        },
        "rightRoadside": {
            "light": "#e29b60",
            "colors": [
                "#f1cc98",
                "#f1cc98"
            ],
            "lf": 0.4,
            sea: true
        },
        "rightSidewalk": {
            "light": "#51ccc6",
            "colors": [
                "#20829d",
                "#227faa"
            ],
            "lf": 0.8,
            scale: 6
        },
        "roadEdge": {
            "colors": [
                "#c2cdd6",
                "#1c3d5a"
            ],
            scale: 1.5,
        },
        "laneMarkings": {
            "num": 2,
            "color": "#c2cdd6",
            "scale": 1.5
        }
    },
    causeway: {
        name: "causeway",
        "road": {
            "light": "#4c7b85",
            "colors": [
                "#224349",
                "#224349"
            ],
            "lf": 0.60
        },
        "leftRoadside": {
            "light": "#629a9e",
            "colors": [
                "#255c6a",
                "#255c6a"
            ],
            "lf": 1.16,
            sea: true
        },
        "roadEdge": {
            "colors": [
                "#ededed",
                "#1c4a59"
            ],
            "scale": 1.5,
            raise: false
        },
        "leftSidewalk": {
            "light": "#e8d6a3",
            "colors": [
                "#e0c885",
                "#e0c885"
            ],
            "lf": 1.02,
            "scale": 5
        },
        "rightRoadside": {
            "light": "#e8d6a3",
            "colors": [
                "#e0c885",
                "#e0c885"
            ],
            "lf": 1.02,
            "scale": 8
        },
        "laneMarkings": {
            "num": 2,
            "color": "#c5c5d6",
            "scale": 1.2
        }
    },
    beach: {
        name: "beach",
        "road": {
            "light": "#3d6c75",
            "colors": [
                "#224349",
                "#224349"
            ],
            "lf": 0.75
        },
        "leftRoadside": {
            "light": "#62929e",
            "colors": [
                "#255c6a",
                "#255c6a"
            ],
            "lf": 1.16,
            sea: true
        },
        "roadEdge": {
            "colors": [
                "#ededed",
                "#1c4a59"
            ],
            "scale": 1.5,
            raise: false,
            stripe: true,
        },
        "leftSidewalk": {
            "light": "#e8d6a3",
            "colors": [
                "#e0c885",
                "#e0c885"
            ],
            "lf": 1.02,
            "scale": 5
        },
        "rightRoadside": {
            "light": "#e8d6a3",
            "colors": [
                "#e0c885",
                "#e0c885"
            ],
            "lf": 1.02,
        },
        "laneMarkings": {
            "num": 2,
            "color": "#c5c5d6",
            "scale": 1.2
        }
    },
    lefSea: {
        name: "lefSea",
        "road": {
            "light": "#3d6c75",
            "colors": [
                "#224349",
                "#224349"
            ],
            "lf": 0.75
        },
        "leftRoadside": {
            "light": "#62929e",
            "colors": [
                "#255c6a",
                "#255c6a"
            ],
            "lf": 1.16,
            sea: true
        },
        "rightRoadside": {
            "colors": [
                "#447e55",
                "#427A52"
            ],
            sea: false
        },
        "roadEdge": {
            "colors": [
                "#bbbbcc",
                "#1E3F4E"
            ],
            "scale": 1.5,
            raise: false
        },
        "leftSidewalk": {
            "color": "#c2baa4",
            "scale": 5
        },
        "laneMarkings": {
            "num": 2,
            "color": "#ccccdd",
            "scale": 1.2
        }
    },
    np_grass: {
        "name": "np_grass",
        "road": {
            "light": "#5282a3",
            "colors": [
                "#343069",
                "#332e66"
            ],
            "lf": 0.64
        },
        "sidewalk": {
            "light": "#c8b892",
            "colors": [
                "#836e4e",
                "#837653"
            ],
            lf: 1,
            scale: 1.5
        },
        "roadside": {
            "light": "#8da63f",
            "colors": [
                "#255f29",
                "#1d5e22"
            ],
            "lf": 0.95
        },
        "laneMarkings": {
            "color": "#c5c5ed",
            scale: 1.1,
            num: 2
        },
        "roadEdge": {
            "colors": [
                "#232046",
                "#c5c5ed"
            ],
            "scale": 1,
        },
    },
    dunsar: {
        "name": "dunsar",
        "road": {
            "colors":  ["#474f5c", "#545a67"]
        },
        "roadside": {
            colors: ["#fac365", "#f8a941"]
        },
         "laneMarkings": {
            "color": "#FAECD1",
            scale: 1.1,
            num: 2
        },
        "roadEdge": {
            "colors": [
                "#2e343e",
                "#FAECD1"
            ],
            "scale": 1,
            stripe: true,
            raise: true
        },
    },
    np_river: {
        "name": "np_river",
        "road": {
            "light": "#5282a3",
            "colors": [
                "#343069",
                "#332e66"
            ],
            "lf": 0.64
        },
        "leftSidewalk": {
            "light": "#c8b892",
            "colors": [
                "#836e4e",
                "#837653"
            ],
            "lf": 1,
            scale: 3.5
        },
        "rightSidewalk": {
            "light": "#c8b892",
            "colors": [
                "#836e4e",
                "#837653"
            ],
            lf: 1,
            scale: 11
        },
        "leftRoadside": {
            "light": "#8da63f",
            "colors": [
                "#255f29",
                "#1d5e22"
            ],
            "lf": 0.95
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
        "laneMarkings": {
            "color": "#c5c5ed",
            scale: 1.1,
            num: 2
        },
        "roadEdge": {
            "colors": [
                "#232046",
                "#c5c5ed"
            ],
            "scale": 1,
            stripe: true,
            raise: true
        },
    },
    np_isle: {
        "name": "np_isle",
        "road": {
            "light": "#5282a3",
            "colors": [
                "#343069",
                "#332e66"
            ],
            "lf": 0.64
        },
        "sidewalk": {
            "light": "#c8b892",
            "colors": [
                "#836e4e",
                "#837653"
            ],
            "lf": 1,
            scale: 11
        },
        "roadside": {
            "light": "#3fa6a1",
            "colors": [
                "#247475",
                "#247475"
            ],
            "lf": 1,
            sea: true
        },
        "laneMarkings": {
            "color": "#c5c5ed",
            scale: 1.1,
            num: 2
        },
        "roadEdge": {
            "colors": [
                "#232046",
                "#c5c5ed"
            ],
            "scale": 1,
            stripe: true,
            raise: true
        },
    },
    nepal: {
        name: "nepal",
        "road": {
            "light": "#d46754",
            "colors": [
                "#842424",
                "#953737",
            ],
            "lf": 0.55
        },
        "roadside": {
            "light": "#cf6854",
            "colors": [
                "#8f2e2e",
                "#932f2f"
            ],
            "lf": 0.71
        },
        "roadEdge": {
            "light": "#ff5c5c",
            "colors": [
                "#823126",
                "#380000"
            ],
            "lf": 0.3,
            scale: 2,
            raise: true
        },
        "laneMarkings": {
            "num": 2,
            "color": "#842424",
            "scale": 2,
            "light": "#d46754",
            "lf": 0.55
        }
    },
    egypt: {
        name: "egypt",
        "road": {
            "colors": [
                "#1e4669ff",
                "#1e4669ff",
                // "#2a313d",
            ]
        },
        "roadEdge": {
            "colors": [
                "#d1d1cf",
                "#163550ff"
            ],
            "scale": 1,
            stripe: true,
            raise: true,
        },
        "laneMarkings": {
            "num": 2,
            "color": "#d1d1cf",
            "scale": 1.1
        },
        "roadside": {
            "light": "#e29b60",
            "colors": [
                "#f1cc98",
                "#f1cc98"
            ],
            "lf": 0.4
        },
        "sidewalk": {
            "color": "#ecc491ff",
            "scale": 0.75
        },
    },
    mBeach: {
        name: "mBeach",
        "road": {
            "light": "#3f5b6e",
            "colors": [
                "#191a2e",
                "#191a2e"
            ],
            "lf": 0.98
        },
        "leftSidewalk": {
            "colors": [
                "#88794e",
                "#8a8156"
            ],
            scale: 8
        },
        "roadEdge": {
            "colors": [
                "#9bb1bf",
                "#152941"
            ],
            scale: 1.25,
            raise: true,
            stripe: true
        },
        "roadside": {
            "light": "#489355",
            "colors": [
                "#276850",
                "#27634e"
            ],
            "lf": 0.73
        },
        "laneMarkings": {
            "color": "#8a97ad",
            "light": null,
            "lf": 0,
            num: 2
        }
    },
    jungleAlt: {
        name: "jungleAlt",
        "road": {
            "colors": [
                "#295670",
                "#295670"
            ],
            "lf": 0
        },
        "roadside": {
            "light": "#43894b",
            "colors": [
                "#1f3904",
                "#1a3a03"
            ],
            "lf": 1
        },
        "roadEdge": {
           "colors": [
                "#123549",
                "#a0bebd"
            ],
            "scale": 2
        },
        "sidewalk": {
            "colors": [
                "#88794e",
                "#8a8156"
            ],
            scale: 4
        },
        "laneMarkings": {
            "num": 2,
            "color": "#a0bebd",
            "scale": 1.2
        }
    },
    jungle: {
        name: "jungle",
        "road": {
            "colors": [
                "#295670",
                "#295670"
            ],
            "lf": 0
        },
        "roadside": {
            "light": "#43894b",
            "colors": [
                "#1f3904",
                "#1a3a03"
            ],
            "lf": 1
        },
        "roadEdge": {
            "colors": [
                "#123549",
                "#a0bebd"
            ],
            "scale": 2
        },
     
        "laneMarkings": {
            "num": 2,
            "color": "#a0bebd",
            "scale": 1.2
        }
    },
    jungle0: {
        name: "jungle0",
        "road": {
            "colors": [
                "#325457",
                "#325457"
            ]
        },
        "roadside": {
            "colors": [
                "#528342",
                "#528342"
            ],
            sea: false
        },
        "roadEdge": {
            "colors": [
                "#9bb1ad",
                "#9bb1ad"
            ],
            "scale": 1.25
        },
        "sidewalk": {
            "colors": [
                "#325457",
                "#325457"
            ],
            "scale": 0.2
        },
        "laneMarkings": {
            "num": 2,
            "color": "#9bb1ad",
            "scale": 1.2
        }
    },
    kherest: {
        name: "kherest",
        "road": {
            "light": "#476c6a",
            "colors": [
                "#29413d",
                "#29413d"
            ],
            "lf": 1.2
        },
        "roadEdge": {
            "colors": [
                "#b3cac2",
                "#153231"
            ],
            scale: 1.25
        },
        "roadside": {
            "light": "#a19f68",
            "colors": [
                "#8d5834",
                "#95562d"
            ],
            "lf": 1
        },
        "laneMarkings": {
            "color": "#c0cc99",
            "light": null,
            "lf": 0,
            scale: 1.25,
            num: 2
        }
    },
    khemet: {
        name: "khemet",
        "road": {
            "light": "#4c635c",
            "colors": [
                "#5d5752",
                "#5d5752"
            ],
            "lf": 0.9
        },
        "roadside": {
            "colors": [
                "#958060",
                "#958060"
            ],
        },
        "roadEdge": {
            "light": "#7cb19b",
            "colors": [
                "#98a28b",
                "#1f2e29"
            ],
            stripe: true,
            "scale": 1,
        },
        laneMarkings: { num: 2, color: "#c5b8a4", scale: 1.2 }
    },

    alien: {
        name: "alien",
        "road": {
            "colors": [
                "#626b72",
                "#626b72"
            ]
        },
        "roadside": {
            "colors": [
                "#359ba3",
                "#41b2af"
            ],
            light:"#359ba3",
            lf: 2
        },
        "sidewalk": {
            "colors": ["#edd6bd","#e0ae99"],
            "scale": 4
        },
        laneMarkings: { num: 2, color: "#f0e8dc", scale: 1.2 },
        "roadEdge": {
            "colors": [
                "#49374f",
                "#f0e8dc",
            ],
            stripe: true,
            "scale": 0.75,
            raise: true
        },
    },
}
export const prlxs = {
    moon: new Parallax({
        z: 100000,
        xRange: [400, 400],
        yRange: [-200, 200],
        o: [
            { f: "moon", x: 0, y: 150 }
        ],
        curtentry: 150,
        curtexit: 200,
        delay: 2,
        exitDur: 2
    }),
    mountains: new Parallax({
        z: 2000,
        xRange: [-400, 400],
        yRange: [-200, 200],
        o: [
            { f: "mountains", x: 0, y: 20, s: 2 }
        ],
        curtentry: 0,
        curtexit: 0,
        exitDur: 2,
        delay: 2
    })
}