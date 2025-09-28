import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
import ambience, { jurassicAmb, triassicAmb } from "./ambiences"
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
    triassic_fern: 0.6
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
    expanse = 300
    amplitude = 1200
    laneData = laneData.all
    road = triassicAmb
    vibe = triassicAmb
    acm = acm
}

export class Entry1 extends Nile {
    profile = "platform"
    fixed = true
    expanse = 300
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule(["cycada"], -0.5, -4, 0.1, { dist: "combinedSine" })
        // this.addRule(["lycophyte"], 0.5, 4, 0.1, { dist: "triangleWave" })
        // this.addRule(["triassic_fern"], 1, 0.5, 1, { cluster: 100 })
        // this.addRule(["triassic_fern"], -1, -0.5, 1, { cluster: 100 })
        this.addRule(["rauisuchian1"],1,1, 1, { offset: 500, stride: 2000 })
        this.addRule(["rauisuchian2"],-0.5, -0.5, 1, { offset: 600, stride: 2000 })

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
        this.addRule(["cycada"], -0.5, -4, 0.1, { dist: "combinedSine" })
    }
}