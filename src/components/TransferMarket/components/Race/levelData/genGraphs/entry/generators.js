import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import { ambience1 } from "./ambiences"
const scaleMap = {
    stall2: 0.4,
    stall1: 0.5,
    tent: 1,
    stall3: 0.3,
    palm: [0.8, 1, 1.25 ],
    merchant: 0.75,
    icegrass: 0.6
}
const PALM = "palm"
const FROND = "palm1"
const BARK = "palm2"
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
            const scale =( Math.random() * 0.25 + 0.5) * 2
            const h = scale * 206000
            sink.push(
                pool.build(BARK, x).s(scale).flip(flip).exec(),
                pool.build(FROND, x - 0.02).h(h).s(scale).flip(flip).exec(),
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
    profile = "straight"
}
const ZOffset0 = 28
export class Scene extends Base {
    fixed = true
    expanse = 110
    amplitude=2000
    constructor() {
        super()
        this.addRule("icegrass", -1, 1, 1, {  dist: "cosine" })
    }
}

export class Scene2 extends Base {
    fixed = true
    expanse = 400
    profile = "straight"
    curvature="rightSine"
    constructor() {
        super()
    }
}

export class Scene3 extends Base {
    fixed = true
    expanse = 500
    profile = "volcano"
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