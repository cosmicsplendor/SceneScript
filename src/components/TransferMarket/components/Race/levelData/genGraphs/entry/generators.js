import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import { ambience1 } from "./ambiences"
const scaleMap = {
    stall2: 0.4,
    stall1: 0.5,
    tent: 1,
    stall3: 0.3,
    palm: [0.8, 1, 1.25 ],
    merchant: 0.75
}
const PALM = "palmtree"
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
    road = ambience1
    vibe = ambience1
    acm = acm
}
const ZOffset0 = 28
export class Scene extends Base {
    fixed = true
    expanse = 200
    constructor() {
        super()
    }
}

export class Scene2 extends Base {
    fixed = true
    expanse = 50
    profile = "straight"
    curvature="rightSine"
    constructor() {
        super()
    }
}

export class Scene3 extends Base {
    fixed = true
    expanse = 10
    profile = "straight"
    constructor() {
        super()
    }
}

export class Scene4 extends Base {
    fixed = true
    expanse = 60
    profile = "straight"
    constructor() {
        super()
    }
}