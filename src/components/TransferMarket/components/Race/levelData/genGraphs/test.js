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
        "writz": 1.25,
        "cherki": 1.25,
        "frimpong": 1.25,
        "reijnders": 1.25,
        "kerkez": 1.25,
        "ait_nouri": 1.25,
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
    road = roads.causeway
    amplitude = 1200
    expanse = 500
    acm = acm
    // prlx = prlxs.moon
}
class FlagFort extends Tropics {
    reps = 2
    expanse = 400
    profile = "straight"
    constructor() {
        super()
        this.addRule(HANG, -1.6, -1.6, 0.015)
        this.addRule(HANG, -2, -2, 0.015)
        this.addRule("tower1", -2, -2, 0.015)
        this.addRule("tower1", 2.5, 2.5, 0.015)
        this.addRule("isle_haus", 24, 24, 0.0025, { det: false, stride: 50 })
        this.addRule("banana", 1.75, 4.5, 0.1)
        this.addRule("rhodo", -1.5, -4, 0.02, { dist: "noise", clus: 8, stride: 3 })
        this.addRule("thatch2", -8, -12, 0.01, { dist: "sawtooth", offset: 0, clus: 5, stride: 2 })
    }
}
class FlagFort2 extends Tropics {
    reps = 2
    expanse = 300
    profile = "straight"
    constructor() {
        super()
        this.addRule(HANG, -1.8, -1.8, 0.02)
        this.addRule(HANG, -1.2, -1.2, 0.02)
        this.addRule("tower1", -2, -2, 0.02)
        this.addRule("tower1", 2.5, 2.5, 0.04)
        this.addRule("cruise", -2.25, -4, 0.0025, { det: false, stride: 50 })
        this.addRule("banana", 2, 3, 0.05)
    }
}
class FlagFort3 extends Tropics {
    expanse = 400
    road = roads.causeway
    constructor() {
        super()
        this.addRule(["house2"], -2, -2, 0.01)
        this.addRule(["house2", "cruise", "throof"], -2, -2, 0.01, { offset: 50 })
        this.addDynRule("gull", -20, -10, 0.005, { dist: "noise", clus: 5 })
        this.addDynRule("blimp", -15, -5, 0.001)
        this.addDynRule("blimp", 15, 5, 0.002, { det: false, stride: 20 })
        this.addRule("rhodo", -1.75, -1.75, 0.05, { clus: 3, stride: 1 })
        this.addRule(HANG, -7.5, -7.5, 0.01, { clus: 6, stride: 10 })
        this.addRule("tower1", -7.75, -7.75, 0.01, { clus: 6, stride: 10 })
        this.addRule(TH_POLE, -3.5, -3.5, 0.01, { clus: 6, stride: 10 })
        this.addRule(["tower1", "shack5", "tower1", "stdom", TH_POLE], 4, 4, 0.01)
        this.addRule(["banvar", "flower1"], 3, 5.5, 0.2, { dist: "noise" })
        this.addRule("fern", 2, 4, 0.1, { dist: "noise" })
        this.addRule(["sign"], -2, -2, 0.005, { det: false, stride: 40 })
        this.addRule("thatch2", 9, 13, 0.01, { dist: "sawtooth", offset: 0, clus: 8, stride: 2 })
    }
}
class BHills4 extends Tropics {
    expanse = 400
    reps = 3
    road = roads.beach
    profile = "straight"
    constructor() {
        super()
        // this.addRule("tower1", -10, -10, 0.1, { clus: 10 })
        this.addRule(["rhodo", "flower1"], 4.25, 7, 0.02, { dist: "noise", clus: 8, stride: 3 })
        this.addRule(HANG, 6, 6, 0.01)
        this.addRule("BAN", -0, 0, 0.02, { stride: 1000000 })
        this.addRule("writz", -1.5, -1.5, 0.009, { stride: 1000000 })
        this.addRule("cherki", 2, 2, 0.005, { stride: 1000000 })
        this.addRule("frimpong", -2, -2, 0.0035, { stride: 1000000 })
        this.addRule("reijnders", 1.5, 1.5, 0.0025, { stride: 1000000 })
        this.addRule("kerkez", -2, -2, 0.002, { stride: 1000000 })
        this.addRule("ait_nouri", 2, 2, 0.0017, { stride: 1000000 })
        this.addRule("house2", 5, 5, 0.01)
        this.addRule("house2", 12.5, 12.5, 0.02)
        this.addRule("house2", 11, 11, 0.02)
        this.addRule("palm", 7, 10.5, 0.06, { dist: "combinedSine" })
        this.addRule("cruise", -3.6, -3.6, 0.005, { det: true, stride: 90 })
        this.addRule("sign", -3, -3, 0.01, { clus: 5, stride: 16, offset: 1000 })
    }
}

const graph = new GeneratorGraph()
graph.addNodes([Tropics, BHills4, FlagFort, FlagFort2, FlagFort3])
graph.entry = [BHills4]
export default graph