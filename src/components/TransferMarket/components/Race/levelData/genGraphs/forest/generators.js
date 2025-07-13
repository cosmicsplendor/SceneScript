import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"

const scaleMap = {
    wind_pole: 4,
    mpalm: 2,
    building: 3,
    mtemple: 3,
    bar1: 2,
    fern: 2,
    fern_sm: 1,
    motel: 2,
    tent: 2.5,
    thatch2: 3,
    thtower: 3,
    transmission: 4,
    shrub2: 1.75,
    shrub1: 1.25,

}
const TH_POLE = "thpole1"
const TH2 = "thatch2"
const BB = "bb"
const POLE = "pole3"
// Constants used in acm function
const PALM = "palm"
const MP1 = "mpalm1"
const MP2 = "mpalm2"
const SIGN = "sign"
const POLE4 = "pole4"
const acm = createAcm({
    rightFlips: ["bar1"],
    leftFlips: [],
    scaleMap,
    heightMap: {
        thatch2: -15000,
    },
    mirrorMap: {
        flower1: 0.39,
        transmission: 1
    },
    frameMap: {
        fern_sm: "fern",
        fol: "banana"
    },
    customAcm: (f, x, sink, pool) => {
        if (f === TH2) {
            sink.push(
                pool.build(TH_POLE, x - 0.5).s(2).exec(),
                pool.build(TH_POLE, x + 0.5).s(2).exec(),
                pool.build(TH_POLE, x).h(2000).s(2).exec(),
                pool.build(f, x).s(2).h(36000).flip(x < 0).exec()
            )
            return
        }
        if (f === PALM) {
            sink.push(
                pool.build(MP1, x - 0.025 * 2).s(2).h(33000 * 2).exec(),
                pool.build(MP2, x).s(2).exec(),
            )
            return
        }
        if (f === BB) {
            sink.push(
                pool.build(POLE, x + 0.75).s(3).exec(),
                pool.build(POLE, x - 0.75).s(3).exec(),
                pool.build(f, x).s(3).h(64000).exec(),
            )
            return
        }
        if (f === SIGN) {
            sink.push(
                pool.build(POLE4, x).s(1.5).exec(),
                pool.build(f, x).s(1.5).h(48000).flip(x > 0).exec(),
            )
            return
        }
    }
})


export class Forest0 extends SegmentObjGen {
    expanse = 450
    vibe = vibes.fog0
    road = roads.jungle
    amplitude = 800
    acm = acm
    prlx = prlxs.moon
    constructor() {
        super()
        this.addRule("palm", 1.13, 5, 0.05, { dist: "combinedSine" })
        this.addRule("palm", -1.13, -5, 0.05, { dist: "combinedSine" })
        this.addRule("fern", -4, -8, 0.15, { dist: "noise" })
        this.addRule(["fern_sm"], -1.1, -4, 0.25, { dist: "noise" })
        this.addRule("fern", 4, 8, 0.1, { dist: "noise" })
        this.addRule("fern_sm", 1.1, 4, 0.25, { dist: "noise" })
    }
}

export class Forest1 extends Forest0 {
    reps = 1
    constructor() {
        super()
        this.addRule("sign", -1.5, 1.5, 0.0075, { clus: 10, stride: 16, dist: "longSquare"})
    }
}

export class Forest2 extends SegmentObjGen {
    expanse = 300
    vibe = vibes.fog1
    road = roads.jungleAlt
    amplitude = 1200
    acm = acm
    reps = 2
    laneData = laneData.none
    prlx = prlxs.moon
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("palm", 1.13, 5, 0.075, { dist: "combinedSine" })
        this.addRule("palm", -1.13, -5, 0.075, { dist: "combinedSine" })
        this.addRule("fern", -4, -10, 0.15, { dist: "noise" })
        this.addRule("fern", 4, 10, 0.15, { dist: "noise" })
        this.addRule("fern_sm", -1.25, -3.5, 0.15, { dist: "noise" })
        this.addRule("fern_sm", 1.25, 3.5, 0.15, { dist: "noise" })
        this.addRule("thatch2", -12, -18, 0.005, { dist: "sine", det: false, stride: 75 })
        this.addRule(["thtower", "thatch2"], -5, 5, 0.0075, { det: true, dist: "squareWave" })
        this.addDynRule("bar1", -0.75, 0.75, 0.01, { dist: "sine", offset: 100 })
    }
}

export class Forest3 extends SegmentObjGen {
    expanse = 300
    vibe = vibes.fog2
    road = roads.jungle
    amplitude = 1200
    acm = acm
    reps = 2
    prlx = prlxs.moon
    laneData = laneData.middle
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("palm", 1.135, 8, 0.05, { dist: "combinedSine" })
        this.addRule("palm", -1.135, -8, 0.05, { dist: "combinedSine" })
        this.addRule("fern", -4, -8, 0.1, { dist: "noise" })
        this.addRule("fern_sm", -1.5, -4, 0.15, { dist: "noise" })
        this.addRule("fern", 4, 8, 0.1, { dist: "noise" })
        this.addRule("fern_sm", 1.5, 4, 0.15, { dist: "noise" })
        this.addDynRule("bar1", -0.9, 0.9, 0.01, { dist: "squareWave", offset: 100 })
    }
}

export class Forest4 extends SegmentObjGen {
    expanse = 260
    reps = 3
    vibe = vibes.fog1
    road = roads.jungle
    amplitude = 1050
    acm = acm
    prlx = prlxs.moon
    laneData = laneData.all
    constructor() {
        super()
        this.addRule("palm", 2, 12, 0.01, { dist: "noise", clus: 10, stride: 4 })
        this.addRule("palm", -2, -12, 0.01, { dist: "noise", clus: 10, stride: 4, offset: 50 })
        this.addRule("fern", -4, -10, 0.3, { dist: "noise" })
        this.addRule("fern_sm", -1.1, -4, 0.3, { dist: "noise" })
        this.addRule("fern", 4, 10, 0.3, { dist: "noise" })
        this.addRule("fern_sm", 1.1, 4, 0.3, { dist: "noise" })
    }
}

export class Forest5 extends Forest0 {
    vibe = vibes.fog0
    reps = 2
    amplitude = 900
    expanse = 250
    constructor() {
        super()
        this.addRule("sign", -1.5, -1.5, 0.0075, { clus: 5, stride: 16 })
        this.addRule("sign", 1.5, 1.5, 0.0075, { clus: 5, stride: 16 })
    }
}

export class Forest6 extends Forest4 {
    vibe = vibes.fog0
    expanse = 300
    reps = 1
}

export class Forest01 extends Forest1 {
    vibe = vibes.fog01
    road = roads.jungle0
}

export class Forest02 extends Forest2 {
    vibe = vibes.fog02
    road = roads.jungle0
}

export class Forest03 extends Forest3 {
    vibe = vibes.fog02
    road = roads.jungle0
}

export class Forest04 extends Forest4 {
    vibe = vibes.fog01
    road = roads.jungle0
    reps = 1
}

export class Forest05 extends Forest5 {
    vibe = vibes.fog00
    road = roads.jungle0
    reps = 3
}

export class Forest06 extends Forest05 {
    reps = 1
    expanse = 300
    vibe = vibes.fog00
}

export class Bay1 extends SegmentObjGen {
    expanse = 500
    vibe = vibes.mBeach
    road = roads.mBeach
    reps = [2, 3]
    acm = acm
    fixed = true
    prlx = prlxs.moon
    constructor() {
        super()
        this.addRule("fern_sm", -1.5, -4, 0.1, { det: true, dist: "noise" })
        this.addRule("palm", -1.72, -5, 0.025, { dist: "noise", offset: 10 })
        this.addRule("tent", 3, 10, 0.005, { dist: "combinedSine" })
        this.addRule(["motel", "tent"], 3, 5, 0.005, { dist: "combinedSine", offset: 50 })
        this.addRule("fern", 5, 12, 0.05, { dist: "triangleWave", stride: 2 })
        this.addRule("building", 10, 15, 0.01, { det: false, stride: 100, offset: 500 })
        this.addDynRule("wind_blade", 15, 30, 0.025, { det: true, dist: "combinedSine", offset: 500 })
        this.addRule("wind_pole", 15, 30, 0.025, { det: true, dist: "combinedSine", offset: 500 })
        this.addDynRule("blimp", -10, -30, 0.005, { det: false, stride: 100 })
        this.addDynRule("blimp", 10, 30, 0.005, { det: false, stride: 100, offset: 150 })
    }
}

export class Bay0 extends Bay1 {
    reps = 1
    expanse = 400
    fixed = true
}

export class Bay2 extends SegmentObjGen {
    expanse = 350
    vibe = vibes.mBeach
    road = roads.mBeach
    reps = 3
    acm = acm
    fixed = true
    prlx = prlxs.moon
    constructor() {
        super()
        this.addRule(["motel", "building", "bb"], 12, 18, 0.1, { dist: "triangleWave", stride: 100 })
        this.addRule("fern", 10, 30, 0.25, { dist: "noise", stride: 2 })
        this.addRule("fern_sm", 5, 10, 0.125, { dist: "noise", stride: 2 })
        this.addDynRule("blimp", -10, -30, 0.005, { det: false, stride: 100 })
        this.addDynRule("blimp", 10, 30, 0.005, { det: false, stride: 100, offset: 150 })
        this.addRule("transmission", 45, 45, 0.0125, { dist: "sine" })
        this.addDynRule("wind_blade", 30, 30, 0.006, { det: true, dist: "combinedSine", clus: 7, stride: 25 })
        this.addRule("wind_pole", 30, 30, 0.006, { det: true, dist: "combinedSine", clus: 7, stride: 25 })
        this.addDynRule("wind_blade", 20, 20, 0.001, { dist: "combinedSine", clus: 5, stride: 40, offset: 150 })
        this.addRule("wind_pole", 20, 20, 0.001, { dist: "combinedSine", clus: 5, stride: 40, offset: 150 })
        this.addRule("fern", -8, -30, 0.25, { dist: "noise", stride: 2 })
        this.addRule("fern_sm", -1.5, -4, 0.1, { det: true, dist: "noise" })
        this.addRule("thatch2", -8, -14, 0.005, { dist: "sawtooth", offset: 200, clus: 10, stride: 0 })
    }
}

export class LushB1 extends SegmentObjGen {
    expanse = 800
    vibe = vibes.mystique
    road = roads.lefSea
    reps = 2
    acm = acm
    fixed = true
    laneData = laneData.all
    constructor() {
        super()
        this.addRule("shrub1", 2, 4, 1, { dist: "noise" })
        this.addRule("shrub2", 5, 9, 0.25, { dist: "sawtooth" })
        this.addDynRule("wind_blade", 20, 36, 0.032, { dist: "triangleWave" })
        this.addRule("wind_pole", 20, 36, 0.032, { dist: "triangleWave" })
        this.addRule("bb", 13, 13, 0.01, { dist: "triangleWave", stride: 100, det: false })
        this.addRule("thatch2", 16, 19, 0.02, { dist: "sawtooth", clus: 10, stride: 2, offset: 600 })
    }
}
