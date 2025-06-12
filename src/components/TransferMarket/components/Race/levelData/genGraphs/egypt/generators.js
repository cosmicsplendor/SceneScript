import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
const scaleMap = {
    np_wall: 2,
    pyramid: 8,
    ruins1: 2.25,
    ruins2: 2.25,
    sphinx: 3,
    ruin_pil2: 1.75,
    ruin_pil3: 1.75,
    ruin_rock1: 1.75,
    ruin_rock2: 1.75,
    ruin_rock3: 1.75,
    camel: 2,
    tent: 2,
    cactus1: 2,
}
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const acm = createAcm({
    rightFlips: ["ruin_pil2", "ruin_rock1", "ruin_rock2"],
    leftFlips: ["pyramid", "ruins1", "ruins2", "ruin_pil2", "ruin_rock1", "ruin_rock2"],
    scaleMap,
    heightMap: {
        pyramid: -10000
    },
    customAcm: (f, x, sink, pool) => {
        if (f === PALM) {
            const flip = Math.random() < 0.5 ? true : false
            const scale = Math.random() + 2
            const h = scale * 34000
            sink.push(
                pool.build(FROND, x).h(h).s(scale).flip(flip).exec(),
                pool.build(BARK, x).s(scale).flip(flip).exec()
            )
            return
        }
    }
})

export class Egypt extends SegmentObjGen {
    expanse = 300
    amplitude = 1200
    vibe = vibes.egypt
    road = roads.egypt
    acm = acm
    prlx = prlxs.moon
}
export class Nile extends SegmentObjGen {
    expanse = 300
    amplitude = 1200
    laneData=laneData.all
    road = roads.nile
    vibe = vibes.nile
    acm = acm
}


export class Nile0 extends Nile {
    profile = "platform"
    fixed = true
    expanse=500
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("ruin_pil2", 4.5, -3, 0.125, { dist: "longSquare", clus: 3, stride: 4 })
        this.addRule("pyramid", 10, 50, 0.05, { dist: "triangleWave", offset: 100 })
        this.addRule("pyramid", -10, -50, 0.05, { dist: "sine", offset: 100 })
    }
}
export class Nile1 extends Nile {
    constructor() {
        super()
        this.addRule("palm", 32, 12, 0.3, { dist: "noise" })
        this.addRule("palm", -24, -12, 0.01, { dist: "noise", clus: 10, stride: 2 })
        this.addRule("cactus1", 8, 12, 0.05, { dist: "sine" })
        this.addRule("cactus1", -8, -12, 0.05, { dist: "noise" })
        this.addRule("ruin_pil2", 4.5, -3, 0.125, { dist: "longSquare", clus: 3, stride: 4 })

    }
}
export class Nile2 extends Nile {
    constructor() {
        super()
        this.addRule("palm", -24, -12, 0.01, { dist: "noise", clus: 10, stride: 2 })
        this.addRule("cactus1", -8, -12, 0.05, { dist: "noise" })
        this.addRule("pyramid", 25, 40, 0.02, { dist: "noise" })
        this.addRule("ruin_pil2", 4, 8, 0.1, { dist: "longSquare" })
        this.addRule(["ruins1", "ruins2"], -8, -8, 0.01, { clus: 15, stride: 2 })
    }
}
export class Nile3 extends Nile {
    constructor() {
        super()
        this.addRule(["ruin_rock2", "ruin_rock2", "ruin_rock1"], -4.5, -6.5, 0.025, { dist: "noise" })
        this.addRule("sphinx", -3, -9, 0.02, { dist: "triangleWave" })
        this.addRule("palm", 5, 12, 0.02, { dist: "triangleWave", offset: 100 })
        this.addRule(["ruins1", "ruins2"], 8, -8, 0.02, { det: true, dist: "squareWave", clus: 15, stride: 2, det: false })
    }
}
export class Nile4 extends Nile {
    profile = "q4"
    constructor() {
        super()
        this.addRule(["ruins1", "ruins2"], 8, -8, 0.02, { det: true, dist: "squareWave", clus: 15, stride: 2, det: false })
    }
}

export class Nile5 extends Nile {
    profile = "straight"
    expanse = 300
    reps = 2
    constructor() {
        super()
        this.addRule("ruin_pil2", 5, 13, 0.015, { dist: "sawtooth", clus: 8, stride: 8 })
        this.addRule(["ruins1", "ruins2"], -8, -16, 1, { stride: 2, dist: "squareWave" })
        this.addRule(["ruin_rock2", "ruin_rock2", "ruin_rock1", "cactus1", "sphinx"], 4.5, 6.5, 0.025, { det: true })
        this.addRule("pyramid", 24, 44, 0.02, { dist: "noise" })
        this.addRule("palm", -16, -7.5, 0.01, { dist: "noise", clus: 8, stride: 2, det: false })

    }
}
export class Nile6 extends Nile {
    profile = "ramp"
    constructor() {
        super()
        this.addRule("ruin_pil2", 4.5, -3, 0.125, { dist: "longSquare", clus: 3, stride: 4 })
    }
}