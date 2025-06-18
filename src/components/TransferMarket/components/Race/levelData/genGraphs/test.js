import { vibes, roads } from "./ambiences"
import SegmentObjGen, { createAcm } from "./../../lib/utils/SegmentObjGen"
import { GeneratorGraph } from "./../../lib/utils"


// String constants used in customAcm
const TH_POLE = "thpole1"
const TH2 = "thatch2"
const HANG = "hang"
const ISL_HAUS = "isle_haus"
const MOUND = "mound"
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const flags = ["fred", "fwhite"]
const SIGN = "sign"
const POLE4 = "pole4"
const STDOM = "stdom"
const BAN = "BAN"
const acm = createAcm({
    rightFlips: ["bar1", "tower1"],
    leftFlips: ["house2"],
    flower1: 2,
    scaleMap: {
        banvar: [1.25, 0.9],
        dustbin: 1.75,
        wind_blade: 2,
        fern: [0.75, 1],
        motel: 2.5,
        kulfi: 3,
        house2: 3,
        shack5: 2.75,
        building: 4,
        wind_pole: 4,
        "mound": 4.5,
        "cruise": 2.5,
        "tower1": 1.5,
        bar1: 2,
        rhodo: 1.5,
        rhodo2: 1.5,
        tent: 2.5,
    },
    heightmap: {
        cruise: -1000,
        bar1: -5000,
        flower1: -40000
    },
    frameMap: { banvar: "banana" },
    mirrorMap: {
        rhodo: .3,
        rhodo2: 0.3,
        flower1: .38
    },
    customAcm: (f, x, sink, pool) => {

        if (f === ISL_HAUS) {
            sink.push(
                pool.build(MOUND, x).s(5).exec(),
                pool.build(f, x).s(4).h(210000).exec(),
            )
        }
        if (f === BAN) [
            sink.push(
                pool.build("tower2", -2.5).s(2).exec(),
                pool.build("tower2", 2.5).s(2).flip(true).exec(),
                pool.build("lfc_banner", -0.9).s(2).h(120000).exec(),
                pool.build("mci_banner", 0.9).s(2).h(120000).exec()
            )
        ]
        if (f === TH2) {
            sink.push(
                pool.build(TH_POLE, x - 0.5).s(2).exec(),
                pool.build(TH_POLE, x + 0.5).s(2).exec(),
                pool.build(TH_POLE, x).h(2000).s(2).exec(),
                pool.build(f, x).s(2).h(36000).flip(x < 0).exec()
            )
            return
        }
        if (f === TH_POLE) {
            sink.push(
                pool.build(TH_POLE, x).s(2.25).exec(),
                pool.build(TH_POLE, x).s(2.25).h(80000).exec()
            )
            return
        }
        if (f === HANG) {
            for (let i = 0; i < 12; i++) {
                sink.push(
                    pool.build(flags[i % 2], x + 0.34 * i)
                        .h(140000)
                        .s(3)
                        .exec()
                );
            }
            return
        }
        if (f === PALM) {
            const flip = Math.random() < 0.5 ? true : false
            const scale = 2.25
            const h = scale * 34000
            sink.push(
                pool.build(FROND, x).h(h).s(scale).flip(flip).exec(),
                pool.build(BARK, x).s(scale).flip(flip).exec()
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

        if (f === STDOM) {
            sink.push(
                pool.build(f, x).s(3).exec(),
                pool.build("starc", x).s(3).h(85000).exec()
            )
            return
        }
    }
})

class Tropics extends SegmentObjGen {
    vibe = vibes.breeze
    road = roads.np_isle
    amplitude = 600
    expanse = 400
    fixed = true
    acm = acm
    // prlx = prlxs.moon
    // profile="platform"
    constructor() {
        super()
        this.addRule("fern", 7, 3, 0.005, { clus: 2, stride: 8, dist: "noise" })
        this.addRule("stone", 6, 2, 0.005, { offset: 100, clus: 5, stride: 4 })
        this.addRule(["fern", "stone"], -3, -3, 0.01, { stride: 10 })
    }
}
class Tropics1 extends Tropics {
    profile = "straight"
    expanse=800
}
class Tropics2 extends Tropics {
    profile = "volcano"
    curve="bluntRightSine"
}
class Tropics3 extends Tropics {
    profile="straight"
}

const graph = new GeneratorGraph()
graph.addNodes([Tropics1, Tropics2, Tropics3])
graph.entry = [Tropics1]
export default graph