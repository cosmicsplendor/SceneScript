import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
import { ambience } from "./ambiences"
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
    icehut1: 1.5,
    shack5: 2,
    sheep2: 1
}
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const acm = createAcm({
    leftFlips: ["pyramid", "ruins1", "ruins2", , "paddy"],
    scaleMap,
    heightMap: {
        pyramid: -10000,
        sheep2: 100
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
    road = ambience
    vibe = ambience
    acm = acm
    profile = "straight"
}

export class Scene1 extends Base {
    fixed = true
    expanse = 50
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("fence", 0.4, 0.4, 1, { dist: "diag"})
    }
}
export class Scene2 extends Base {
    fixed = true
    expanse = 220
    reset() {
        SegmentObjGen.reset(this)
        // this.addRule("icegrass", 7, 10, 1, { offset: 20, dist: "combinedSine"})
        // this.addRule("icegrass", 10, 13, 1, { offset: 40, dist: "combinedSine"})
        // this.addRule("icegrass", 13, 14, 1, { offset: 40, dist: "combinedSine"})
        // this.addRule("icegrass", 14, 15, 1, { offset: 40, dist: "combinedSine"})
        // this.addRule("icegrass", 15, 16, 1, { offset: 40, dist: "combinedSine"})
        // this.addRule("icegrass", 16, 17, 1, { offset: 40, dist: "combinedSine"})
        // this.addRule("icegrass", 17, 18, 1, { offset: 40, dist: "combinedSine"})
        // this.addRule(["icetree2"], 25, 22, 0.1, { dist: "triangleWave" })
        // this.addRule(["stubble1"], 16, 16, 0.01, { dist: "triangleWave" })
    }
    constructor() {
        super()
    }
}
export class Scene3 extends Base {
    fixed = true
    amplitude=1000
    expanse = 300
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
    }
}
export class Scene4 extends Base {
    profile = "straight"
    fixed = true
    amplitude=1000
    expanse = 300
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
    }
}