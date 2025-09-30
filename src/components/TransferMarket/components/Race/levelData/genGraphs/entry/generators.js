import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
import ambience, { jurassicAmb, iceAgeAmb } from "./ambiences"
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
    icetree2: [4, 3],
    stubble1: 2,
    icetree3: 4,
    icegrass: 0.4,
    icehut2: 1.5,
    icehut1: 1.5
}
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const acm = createAcm({
    rightFlips: ["ruin_pil2", "ruin_rock1", "ruin_rock2"],
    leftFlips: ["pyramid", "ruins1", "ruins2", "ruin_pil2", "ruin_rock1", "ruin_rock2", "paddy"],
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
export class Nile extends SegmentObjGen {
    expanse = 100
    amplitude = 1200
    laneData = laneData.all
    road = iceAgeAmb
    vibe = iceAgeAmb
    acm = acm
}

export class IceAge extends Nile {
    fixed = true
    expanse = 100
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule(["icetree1"], -5, 5, 0.05, { dist: "triangleWave" })
        this.addRule(["icetree2", "icetree1"], -16, 16, 0.1, { dist: "sine", offset: 300 })
        this.addRule(["stubble1"], -0.175, -0.175, 1, { offset: 60, stride: 1000 })
        this.addRule("icerock3", 0.5, 0.5, 1, { offset: 80, stride: 1000})
        this.addRule("icerock1", 1, 1, 1, { offset: 90, stride: 1000})
        this.addRule("icegrass", -0.75, 0.25, 1, { offset: 50, cluster: 4, stride: 1, dist: "combinedSine"})
        this.addRule("icegrass", -0.75, -1.5, 1, { offset: 130, cluster: 4, stride: 1, dist: "combinedSine"})
        this.addRule("icegrass", 0.25, 1, 1, { offset: 130, cluster: 4, stride: 1, dist: "combinedSine"})
        this.addRule("icehut2", 2.75, 2.75, 1, { offset: 180, stride: 1000 })
        this.addRule("icehut1", 5, 5, 1, { offset: 210, stride: 1000 })
        this.addRule("skull", 3.5, 3.5, 1, { offset: 160, stride: 1000 })
    }
}
export class IceAge2 extends Nile {
    fixed = true
    expanse = 300
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
    }
}
export class Entry2 extends Nile {
    profile = "platform"
    fixed = true
    vibe = jurassicAmb
    expanse = 300
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
    }
}