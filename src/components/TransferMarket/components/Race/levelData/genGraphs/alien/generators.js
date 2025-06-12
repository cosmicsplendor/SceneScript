import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
const scaleMap = {
    "pfol1": [0.5, 0.75, 1, 1.25],
    "pfol2": [0.5, 0.75, 1, 1.25],
    "pfol3": [0.75, 1, 1.25, 1.5],
    "fern1": [0.5, 0.75, 1, 1.25],
    "fern2": [0.5, 0.75, 1, 1.25],
    "fern3": [0.5, 0.75, 1, 1.25],
    reef: 2
}
const AGIR = "agir"
const AGIRHD = "agirhd"
const AGIRLG1 = "agirlg1"
const AGIRLG2 = "agirlg2"
const AGIRLG3 = "agirlg3"
const AGIRTL = "agirtl"
const SIGN = "sign"
const POLE4 = "pole4"
const acm = createAcm({
    rightFlips: [],
    leftFlips: [],
    scaleMap,
    mirrorMap: {
        reef: -0.78,
    },
    frameMap: {
        grass: [
            "pfol1", "pfol2", "pfol3"
        ],
        fern: ["fern1", "fern2", "fern3"]
    },
    heightMap: {
    },
    customAcm: (f, x, sink, pool) => {
        if (f === AGIR) {
            const scale = 3
            const h = scale * 36000
            sink.push(
                pool.build(AGIRLG1, x - 0.4).s(scale).dyn().exec(),
                pool.build(AGIRLG2, x - 2).s(scale).dyn().exec(),
                pool.build(AGIRLG1, x + 1.4).s(scale).dyn().exec(),
                pool.build(AGIRLG3, x + 0.25).s(scale).dyn().exec(),
                pool.build(AGIR, x).s(scale).h(h).exec(),
                pool.build(AGIRHD, x + 2).s(scale).h(h * 2).exec(),
                pool.build(AGIRTL, x - 2.7).s(scale).h(h - 2000).exec(),
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

export class Alien extends SegmentObjGen {
    expanse = 350
    amplitude = 400
    vibe = vibes.alien2
    road = roads.alien
    acm = acm
    laneData=laneData.all
}

export class AlienGrass1 extends Alien {
    vibe = vibes.np_light
    constructor() {
        super()
        this.addRule("grass", -0.75, -2.5, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("reef", -2, -2.9, 0.0125, { det: false, stride: 100, offset: 50 })
        this.addRule("sign", 1.25, 1.25, 0.02)
    }
}
export class AlienGrass2 extends Alien {
    reps=2
    vibe = vibes.alien1
    
    constructor() {
        super()
        this.addRule("grass", -0.75, -2.5, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("grass", 0.75, 3, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("reef", -2, -2.9, 0.0125, { det: false, stride: 100 })
        this.addRule("reef", 2, 2.9, 0.0125, { det: false, stride: 100 })
      
        // this.addRule("atree", -1.35, -3, 0.005, { det: false })
    }
}
export class AlienGrass3 extends AlienGrass2 {
    vibe = vibes.alien2
    reps=1
}

export class AlienAnim0 extends Alien {
    profile="straight"

    constructor() {
        super()
        this.addRule("grass", -0.75, -2.5, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("fern", 1, 3.75, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule(["reef", "sign","sign", "agir"], -2, -2.9, 0.01, { det: false, stride: 100 })
        this.addRule(["reef", "sign","sign", "agir"], 2, 2.9, 0.01, { det: false, stride: 100 })
    }
}
export class AlienAnim1 extends Alien {
    profile="straight"

    constructor() {
        super()
        this.addRule("fern", -1, -3.75, 1.5, { det: true, dist: "noise", stride: 1 })
        this.addRule("fern", 1, 3.75, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("sign", -2, -2.9, 0.0125, { det: false, stride: 100 })
        this.addRule("sign", 2, 2.9, 0.0125, { det: false, stride: 100 })
        this.addRule("agir", 1.125, 1.125, 0.01, { det: true, stride: 150 })
    }
}
export class AlienAnim2 extends Alien {

    profile="q1"
    expanse=300
    amplitude=800
    constructor() {
        super()
        this.addRule("fern", -1, -3.75, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("fern", 1, 3.5, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("agir", 1.125, 1.125, 0.02, { det: false, stride: 200 })
    }
}

export class AlienAnim3 extends Alien {
    profile="down"
    expanse=300
    amplitude=750
    constructor() {
        super()
        this.addRule("fern", -1, -3.5, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("fern", 1, 3.5, 1, { det: true, dist: "noise", stride: 1 })
        this.addRule("agir", -3, -3, 0.01, { det: false, stride: 200 })
        this.addRule("agir", 3, 3, 0.01, { det: false, stride: 200 })
    }
}

export class AlienAnim4 extends Alien {
    profile="straight"
    expanse=100
}