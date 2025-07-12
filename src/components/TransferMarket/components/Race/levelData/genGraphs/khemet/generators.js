import { pickOne, rand } from "../../../lib/utils/math"
import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"

const GANTRY1 = "gantry1"
const GANTRY3 = "gantry3"
const PILLAR3 = "pillar3"
const POLE1 = "pole1"
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const KG1 = "kgate1"
const KG2 = "kgate2"
const KG3 = "kgate3"
const pscales = [2.2, 2.6, 3.1]
const SCALE = 2
const SCALE2 = 1.5
const acm = createAcm({
    rightFlips: new Set(["cactus1", "rock3", "artefact5", "artefact9", "banner1", "artefact", "wall"]),
    leftFlips: new Set(["skull", "cadaver", "skel", "tyga_sm", "pillar1", "artefact4", "tyga", "statue", "artefact2", "house1", "artefact7", "artefact2", "sack_stack", "house", "tent"]),
    scaleMap: {
        decor1: SCALE2 * 2,
        wall1: SCALE2 * 2,
        house: SCALE2 * 4,
        artefact3: SCALE2 * 4,
        artefact3t: SCALE2 * 4,
        pillar1: SCALE2,
        tree1: SCALE2 * 4,
        skull: SCALE2 *  3,
        motel: SCALE2 * 2,
        cadaver: SCALE2 * 3,
        skel: SCALE2 * 3,
        fern_lg: SCALE2 * 1,
        fern: SCALE2 * 0.75,
        statue: SCALE2 * 5,
        rock: SCALE2 * 2.5,
        rock3: SCALE2 * 3,
        tyga: SCALE2 * 8,
        artefact4: SCALE2 * 1.25,
        tyga_sm: SCALE2 * [3, 4, 5],
        tent: SCALE2 * 6,
        mpalm1: SCALE2 * 2,
        building: SCALE2 * 3,
        shack: SCALE2 * 2,
        house: SCALE2 * 5,
        building: SCALE2 * 4,
        transmission: SCALE2 * 4,
        wind_pole: SCALE2 * 4
    },
    frameMap: {
        fern_lg: "fern",
        statue: "artefact2",
        rock: "rock1",
        tyga: "artefact4",
        tyga_sm: "artefact4",
        shack: "shack5",
        artefact3t: "artefact3"
    },
    heightMap: {
        mpalm1: -25000,
        "artefact3t": 290000
    },
    mirrorMap: {
        transmission: 0.6
    },
    customAcm: (f, x, sink, pool) => {
        if (f === PALM) {
            const flip = Math.random() < 0.5 ? true : false
            const scale = pickOne(pscales) * SCALE
            const h = scale * 34000
            sink.push(
                pool.build(FROND, x).h(h).s(scale).flip(flip).exec(),
                pool.build(BARK, x).s(scale).flip(flip).exec()
            )
            return
        }

        if (f === POLE1) {
            const gantryX = x > 0 ? x - 0.7 / SCALE2 : x + 0.7 / SCALE2
            sink.push(
                pool.build(GANTRY3, gantryX)
                    .h(72250 *SCALE2)
                    .flip(x < 0)
                    .s(3 * SCALE2)
                    .exec(),
                pool.build(f, x).s(1.5 * SCALE2).exec()
            )
            return
        }
        if (f === PILLAR3) {
            // Gantries
            sink.push(
                pool.build(GANTRY1, -1.35)
                    .h(SCALE * 220000)
                    .s(SCALE * 1.3)
                    .exec()
            )
            sink.push(
                pool.build(GANTRY1, -0.7)
                    .h(SCALE * 220000)
                    .s(SCALE * 1.3)
                    .flip(true)
                    .exec()
            )
            sink.push(
                pool.build(GANTRY1, -0.25)
                    .h(SCALE * 220000)
                    .s(SCALE * 1.3)
                    .exec()
            )
            sink.push(
                pool.build(GANTRY1, 0.4)
                    .h(SCALE * 220000)
                    .s(SCALE * 1.3)
                    .flip(true)
                    .exec()
            )
            sink.push(
                pool.build(GANTRY1, 1)
                    .h(SCALE * 220000)
                    .s(SCALE * 1.3)
                    .exec()
            )

            // Pillars
            sink.push(
                pool.build(KG1, -2).s(2.5 * SCALE).exec(),
                pool.build(KG2, -1.94).h(95000*SCALE).s(2.5 * SCALE).exec(),
                pool.build(KG3, -2.15).h(235000*SCALE).s(2.5 * SCALE).exec(),
                pool.build(KG1, 1.65).s(2.5 * SCALE).flip(true).exec(),
                pool.build(KG2, 1.57).h(95000*SCALE).s(2.5 * SCALE).flip(true).exec(),
                pool.build(KG3, 1.8).h(235000*SCALE).s(2.5 * SCALE).flip(true).exec(),
            )
            return
        }
    }
})
const addBuilding = (sog, x1, x2, freq, dist) => {
    sog.addRule("artefact3t", x1 + 3, x2 + 3, freq, { det: true, dist, clus: 1 })
    sog.addRule("artefact3t", x1 + 5, x2 + 5, freq, { det: true, dist, clus: 1 })
    sog.addRule("artefact3", x1 + 2, x2 + 2, freq, { det: true, dist, clus: 1 })
    sog.addRule("artefact3", x1 + 4, x2 + 4, freq, { det: true, dist, clus: 1 })
    sog.addRule("artefact3", x1 + 6, x2 + 6, freq, { det: true, dist, clus: 1 })
}
class KhemetGen extends SegmentObjGen {
    vibe = vibes.kherest
    road = roads.kherest
    expanse = 550
    amplitude = 1400
    profile = "straight"
    acm = acm
    prlx=prlxs.moon
    fixed=true
}
class HGen extends SegmentObjGen {
    vibe = vibes.kherest
    road = roads.kherest
    expanse = 550
    amplitude = 1400
    prlx = prlxs.moon
    acm = acm
    fixed=true
}
export class KEntry extends KhemetGen {
    profile="straight"
    expanse=550
    fixed=true
    profile="bluntRightSine"
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("fern_lg", -4.5, -9.5, 0.01, { det: true, dist: "noise", clus: 10, stride: 20 })
        this.addRule("fern", -2, -4, 0.01, { det: true, dist: "noise", clus: 10, stride: 20 })
        this.addRule("fern_lg", 4.5, 9.5, 0.01, { det: true, dist: "noise", clus: 10, stride: 20 })
        this.addRule("fern", 2, 4, 0.01, { det: true, dist: "noise", clus: 10, stride: 20 })
        this.addRule("pillar1", -5, 5, 1, { det: true, dist: "squareWave", offset: 100 })
    }
}
export class KEntry1 extends KhemetGen {
    vibe=vibes.breeze
    profile="straight"
    expanse=200
    fixed=true
}
export class KWild extends KhemetGen {
    expanse = 200
    reps=3
    profile="straight"
    amplitude=1200
    constructor() {
        super()
        this.addRule("rock3", -2, -2, 0.005, { det: true, stride: 10 })
        this.addRule("rock3", 2, 2, 0.005, { det: true, stride: 10 })
        this.addRule(["cadaver", "skull", "pole1"], -4, 4, 0.01, { det: true, dist: "squareWave" })
        this.addRule("fern_lg", -4.5, -9.5, 0.1, { det: true, dist: "noise" })
        this.addRule("fern", -2, -4, 0.1, { det: true, dist: "noise" })
        this.addRule("statue", 8, 8, 0.005, { det: false, stride: 75, dist: "squareWave" })
        this.addRule("statue", -8, -8, 0.005, { det: false, stride: 75, dist: "squareWave" })
        this.addRule("fern_lg", 4.5, 9.5, 0.1, { det: true, dist: "noise" })
        this.addRule("fern", 2, 4, 0.1, { det: true, dist: "noise" })
    }
}

export class KDArt extends KhemetGen {
    vibe=vibes.breeze
    expanse=600
    constructor() {
        super()
        this.addRule(["transmission", "house","tent"], 16, 24, 0.015, { dist: "sine", det: false, offset: 60, stride: 40 })
        this.addRule("pole1", -3.75, -5.25, 0.01, { dist: "sine", clus: 40 })
        this.addRule("fern", 1.75, 3.25, 0.1, { dist: "sine" })
        this.addRule("fern_lg", -4.5, -2, 0.075, { det: true, dist: "noise" })
        this.addRule("rock", 4, 6, 1)
        this.addDynRule("blimp", -15, -5, 0.001)
        this.addDynRule("blimp", 15, 5, 0.002, { det: false, stride: 20 })
    }
}
export class KDRes extends KhemetGen {
    vibe=vibes.breeze
    constructor() {
        super()
        this.addDynRule("wind_blade", 16, 24, 0.033, { dist: "sine" })
        this.addRule("wind_pole", 16, 24, 0.033, { dist: "sine" })
        this.addRule("fern", -1.75, -3.25, 0.125, { dist: "cosine" })
        this.addRule("fern", 1.75, 3.25, 0.1, { dist: "sine" })
        this.addDynRule("blimp", -15, -5, 0.001)
        this.addDynRule("blimp", 15, 5, 0.002, { det: false, stride: 20 })
        this.addRule("pillar1", -6,6, 1, { det: true, dist: "squareWave" })
        this.addRule("house",  -9, -24, 0.03, { dist: "combinedSine" } )
    }
}
export class KWall extends KhemetGen {
    constructor() {
        super()
        this.addRule("pillar1", -5, 5, 1, { det: true, dist: "squareWave" })
        this.addRule("fern", 1.5, 4.5, 0.05, { dist: "combinedSine" })
        this.addRule("fern_lg", 4.5, 14, 0.05, { dist: "combinedSine" })
        this.addRule("fern", -1.5, -4.5, 0.05, { dist: "combinedSine" })
        this.addRule("fern_lg", -4.5, -15, 0.05, { dist: "combinedSine" })
        this.addRule("house", 14, 25, 0.015, { dist: "sine", det: false, stride: 40 })
        this.addRule("house", -14, -25, 0.015, { dist: "sine", det: false, stride: 40 })
        this.addRule("motel", 7, 7, 0.005, { det: false, stride: 150 });
    }
}
export class KGate extends KhemetGen {
    constructor() {
        super()
        this.addRule(PILLAR3, 2.2, 5, 0.02, { offset: 2 })
        this.addRule(["fern"], -1.5, -3, 0.05)
        this.addRule(["fern"], 1.5, 3, 0.05)
        this.addRule("pillar1", -5, 5, 1, { det: true, dist: "squareWave" })
        this.addRule("tyga", 15, 30, 0.005, { det: false, stride: 100 })
        this.addRule("tyga", -15, -30, 0.005, { det: false, stride: 100 })
    }
}


export class KRock extends KhemetGen {
   fixed=true
    profile="q1"
    constructor() {
        super()
        this.addRule("rock", -2.5, 2.5, 0.01, { det: true, dist: "squareWave" })
        this.addRule("fern_lg", -4.5, -9.5, 0.1, { det: true, dist: "noise" })
        this.addRule("fern", -2, -4, 0.1, { det: true, dist: "noise" })
        this.addRule("fern_lg", 4.5, 9.5, 0.1, { det: true, dist: "noise" })
        this.addRule("fern", 2, 4, 0.1, { det: true, dist: "noise" })
        this.addRule("rock3", 6, 12, 0.025, { det: true, dist: "combinedSine", clus: 5, offset: 50, stride: 10 });
        this.addRule("rock3", -6, -12, 0.025, { det: true, dist: "combinedSine", clus: 5, stride: 10 });
    }
}

export class HArmy extends HGen {
    constructor() {
        super()
        this.addRule("fern", -4, -12, 0.2, { dist: "noise" })
        this.addRule("fern", 2, 8, 0.2, { dist: "noise" })
        this.addRule("tyga_sm", 10,  10, 0.0025, { dist: "sine", clus: 1, stride: 50, det: false })
        this.addRule("statue", 16,  24, 0.075, { dist: "sawtooth" })
        addBuilding(this, -15, -15, 0.005)
    }
}
export class HGate extends HGen {
    expanse=600
    profile="ramp"
    constructor() {
        super()
        this.addRule("fern_lg", 6, 12, 0.01, { dist: "noise", clus: 5, stride: 5 })
        this.addRule("fern", 2, 8, 0.1, { dist: "noise", clus: 5, stride: 5 })
        this.addRule("fern_lg", -6, -12, 0.01, { dist: "noise", clus: 5, stride: 5 })
        this.addRule("fern", -2, -8, 0.2, { dist: "noise", clus: 5, stride: 5 })
        this.addRule(["artefact4", "pole1"], -3, -8, 0.01, { stride: 16, det: false })
        this.addRule(["artefact4", "pole1"], 3, 8, 0.01, { stride: 16, det: false })
        this.addRule(PILLAR3, 2.2, 5, 0.02, { offset: 2 })
    }
}

export class HEntry extends HGen {
    profile="uRamp"
    fixed=true
    expanse=800
    constructor() {
        super()
        this.addRule("fern", -1.5, -3, 0.05)
        this.addRule("fern_lg", -4, -6, 0.025)
        this.addRule("fern", 1.5, 6, 0.1)
    }
}
export class HRock extends HGen {
    constructor() {
        super()
        this.addRule("rock", -2.5, 2.5, 0.01, { det: true, dist: "squareWave" })
        this.addRule("fern_lg", -4.5, -9.5, 0.1, { det: true, dist: "noise" })
        this.addRule("fern", -2, -4, 0.1, { det: true, dist: "noise" })
        this.addRule("fern_lg", 4.5, 9.5, 0.1, { det: true, dist: "noise" })
        this.addRule("fern", 2, 4, 0.1, { det: true, dist: "noise" })
        this.addRule("pillar1", -5, 5, 1, { det: true, dist: "squareWave" })
        this.addRule("rock3", -6, -12, 0.05, { det: true, dist: "sine" });
        this.addRule("pole1", 4, 4, 0.005, { clus: 5, stride: 10 })
        this.addRule("pole1", -4, -4, 0.005, { clus: 5, stride: 10 ,offset: 100 })
    }
}
export class HDead extends HGen {
    profile="straight"
    constructor() {
        super()
        addBuilding(this, -43, -43, 0.01)
        addBuilding(this, -37, -37, 0.01)
        addBuilding(this, -31, -31, 0.01)
        this.addRule("tree1", 2.5, 10, 0.05, { dist: "noise" })
        this.addRule("fern_lg", 3.5, 8, 0.025, { det: true, dist: "cosine" })
        this.addRule("skull", 5, 15, 0.0075, { det: false, stride: 75})
        this.addRule("skel", -2.7, -8.7, 0.0125, { dist: "triangleWave" })
        this.addRule("cadaver", -4, -10, 0.0125, { dist: "triangleWave" })
        this.addRule("fern", -4, -9, 0.025, { dist: "noise" })
        this.addRule("fern_lg", -10, -24, 0.05)

    }
}
export class HPalm extends HGen {
    constructor() {
        super()
        this.addRule("palm", -8, -15, 0.1, { dist: "noise" })
        this.addRule("palm", 8, 15, 0.1, { dist: "noise" })
        this.addRule("pillar1", -5, 5, 1, { det: true, dist: "squareWave" })
        this.addRule("pole1", 5, 5, 0.025)
        this.addRule("pole1", -5, -5, 0.025)
    }
}

export class HHouse extends HGen {
    reps=3
    profile="straight"
    expanse=250
    constructor() {
        super()
        this.addRule("fern", -1.5, -3, 0.05)
        this.addRule("fern_lg", -4, -6, 0.025)
        this.addRule("fern", 1.5, 6, 0.1)
        this.addRule("pillar1", -5, 5, 1, { det: true, dist: "squareWave" })
        this.addRule("artefact3", -14, -32,0.01, { dist: "sine"});
        this.addRule("artefact3", -12, -30,0.01, { dist: "sine" });
        this.addRule("motel", -4, -4, 0.005, { det: false, stride: 150 });
        this.addRule("rock3", 6, 12, 0.05, { det: true, dist: "sine" });
    }
}