const laneData = {
    middle: { speed: 650, lanes: ["middle"], static: true, minGap: 1400, chopper: null },
    sides: { speed: 650, lanes: ["left", "right"], static: true, minGap: 1400, chopper: null },
    all: { speed: 650, lanes: ["left", "middle", "right"], static: true, minGap: 960, chopper: { name: "all", cyls: 1, dropDist: 2200, gapThres: 1900, headMin: 1400, headMax: 2200, amplitude: 60 } },
    tight: {
        lanes: ["left", "middle", "right"],
        minGap: 840,
        speed: 650,
        chopper: { cyls: 1, dropDist: 1400, gapThres: 1800, headMin: 1450, headMax: 1750, amplitude: 30 }
    },
    none: { speed: 650, lanes: [], static: true, minGap: 1500, chopper: { name: "none", cyls: 1, dropDist: 2700, gapThres: 2750, headMin: 1700, headMax: 2650, amplitude: 60 } }
}

export default laneData