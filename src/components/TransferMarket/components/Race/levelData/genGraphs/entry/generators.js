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
    sheep2: 1,
    wall1: 8,
    wall6: 8,
    window: 3.7, 
    door1: 4,
    ceiling: 4,
}
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const acm = createAcm({
    leftFlips: ["wall1", "wall6"],
    scaleMap,
    heightMap: {
        pyramid: -10000,
        sheep2: 100,
        ceiling: 1100000
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
    expanse = 48
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("wall6", -3, -3, 1)
        this.addRule("wall6", 4.5, 4.5, 1)
        this.addRule("ceiling", -2, -2, 1)
    }
}
export class Scene2 extends Base {
    fixed = true
    expanse = 12
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("ceiling", 0, 0, 1)
        this.addRule("wall6", -3, -3, 1)
        this.addRule("wall6", 2, 2, 1)
    }
}
export class Scene3 extends Base {
    fixed = true
    amplitude=1000
    expanse = 50
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("ceiling", 0, 0, 1)
        this.addRule("wall6", -2, -2, 1)
        this.addRule("wall6", 2, 2, 1)
        this.addRule("window", 0, 0, 1, { stride: 1000, offset: 101 })
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