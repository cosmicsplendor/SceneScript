import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
import ambience, { jurassicAmb, iceageRiver, iceAgeAmb } from "./ambiences"
import { cluster } from "d3"
const scaleMap = {
    np_wall: 8,
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
    banana: 0.5,
    paddy: 2,
    triassic_fern: 0.6,
    icetree1: [4, 3.25, 3.5, 3.75],
    icetree2: 1.5,
    stubble1: 1,
    icetree3: 4,
    icegrass: 0.2,
    icehut2: 1.5,
    icehut1: 1.5,
    shack5: 2,
    sheep2: 1,
    lichen: 1,
    bush1: 0.5,
    skull: 0.5,
    icerock3: 1.5,
    icerock1: 0.6,
    bush2: 0.4
}
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const acm = createAcm({
    rightFlips: ["skull"],
    leftFlips: ["skull"],
    frameMap: {
        bush2: "bush1"
    },
    scaleMap,
    heightMap: {
        sheep2: 100,
        icerock3: -40000
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
export class Base extends SegmentObjGen {
    expanse = 100
    amplitude = 1200
    laneData = laneData.all
    road = iceAgeAmb
    vibe = iceAgeAmb
    acm = acm
}
const ZOffset0 = 28
export class IceAge extends Base {
    fixed = true
    expanse = 78
    constructor() {
        super()
        this.addRule("icerock1", 1.25, 1.25, 1, { offset: ZOffset0 + 50, stride: 1000 })
        this.addRule("bush2", 0.4, 0.4, 1, { offset: ZOffset0 + 10, stride: 1000 })
        this.addRule("bush2", -0.45, -0.45, 1, { offset: ZOffset0 + 22, stride: 1000 })
        this.addRule("bush2", -0.45, -0.45, 1, { offset: ZOffset0 + 22, stride: 1000 })
        this.addRule("stubble1", 0.8, 0.8, 1, { offset: ZOffset0 + 5, stride: 1000 })
        this.addRule("bush1", -0.05, -0.05, 1, { offset: ZOffset0 + 37, stride: 1000 })
        this.addRule("bush1", 1, 1, 1, { offset: ZOffset0 + 50, stride: 1000 })
        this.addRule("bush1", 2, 2, 1, { offset: ZOffset0 + 20, stride: 1000 })
        this.addRule("icegrass", -6, -5, 1, { offset: ZOffset0 + 140, dist: "combinedSine" })
        this.addRule("icegrass", -4, -5, 1, { offset: ZOffset0 + 140, dist: "combinedSine" })
    }
}

export class IceAge2 extends Base {
    fixed = true
    expanse = 50
    profile = "straight"
    curvature="rightSine"
    constructor() {
        super()
    }
}

export class IceAge3 extends Base {
    fixed = true
    expanse = 10
    road=iceageRiver
    profile = "straight"
    constructor() {
        super()
        this.addRule("wheat", -17, -16.5, 1, { dist: "sawtooth"})
        this.addRule("wheat", -17.5, -18, 1, { dist: "combinedSine"})
        this.addRule("wheat", -17, -17.5, 1, { dist: "combinedSine"})
        this.addRule("bush1", -17.25, -16.5, 1, { dist: "cosine" })
        this.addRule("bush1", -16.5, -16, 1, { dist: "combinedSine" })
        this.addRule("bush1", -17.5, -17.5, 1, { dist: "noise" })
        this.addRule("icerock3", -13, -13, 1, { offset: 15, stride: 1000 })
    }
}

export class IceAge4 extends Base {
    fixed = true
    expanse = 60
    profile = "straight"
    constructor() {
        super()
        this.addRule("icetree2", -19, -10, 0.05, { dist: "combinedSine"} )
        this.addRule("icerock1", -12.5, -12.5, 1, { offset: 20, stride: 1000 })
        this.addRule("bush1", -12, -12, 1, { offset: 20, stride: 1000 })
        this.addRule("bush1", -13, -13, 1, { offset: 30, stride: 1000 })
        this.addRule("bush1", -12, -12, 1, { offset: 0, stride: 1000 })
    }
}