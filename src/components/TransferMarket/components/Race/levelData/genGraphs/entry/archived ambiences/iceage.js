export const ambience = {
    name: "iceage",
    sky: staticFile("backgrounds/sky1.jpg"),
    fog: "#487f85",
    fog: "#e6e6e6",
    sky: staticFile("backgrounds/iceage_sky.jpg"),
    fogDensity: 0.5,
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