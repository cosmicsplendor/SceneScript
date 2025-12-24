import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
import { ambience } from "./ambiences"
const scaleMap = {
    wall6: 5,
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
        ceiling: 1100000,
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