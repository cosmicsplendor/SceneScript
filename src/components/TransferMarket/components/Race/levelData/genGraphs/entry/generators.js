import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import laneData from "../laneData"
const scaleMap = {
    np_wall: 2,
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
    banana: 0.5
}
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const acm = createAcm({
    rightFlips: ["ruin_pil2", "ruin_rock1", "ruin_rock2"],
    leftFlips: ["pyramid", "ruins1", "ruins2", "ruin_pil2", "ruin_rock1", "ruin_rock2"],
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
    laneData=laneData.all
    road = roads.nepal
    vibe = vibes.nile
    acm = acm
}

export class Entry1 extends Nile {
    profile = "platform"
    fixed = true
    expanse=500
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("banana", -10, -1, 1)
    }
}