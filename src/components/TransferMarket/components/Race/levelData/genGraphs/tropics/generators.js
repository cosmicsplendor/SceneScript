import laneData from "../laneData"
import { vibes, roads, prlxs } from "../ambiences"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"

// String constants used in customAcm
const TH_POLE = "thpole1"
const TH2 = "thatch2"
const TH_BASE = "thbase"
const TH_TOWER = "thtower"
const FLAGS = "flags1"
const HANG = "hang"
const ROOF1 = "roof1"
const ROOF2 = "roof2"
const TH_ROOF = "throof"
const ISL_HAUS = "isle_haus"
const MOUND = "mound"
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const flags = ["fred", "fwhite"]
const BB = "bb"
const POLE = "pole3"
const SIGN = "sign"
const POLE4 = "pole4"
const STDOM = "stdom"
const acm = createAcm({
    rightFlips: ["bar1", "tower1"],
    leftFlips: ["house2"],
    flower1: 2,
    scaleMap: {
        banvar: [ 1.25, 0.9],
        dustbin: 1.75,
        wind_blade: 2,
        fern: [ 0.75, 1],
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
        if (f === TH_ROOF) {
            // Left side bases
            for (let h = 0; h <= 52000; h += 13000) {
                sink.push(pool.build(TH_BASE, x).h(h).exec())
            }
            sink.push(pool.build(TH_TOWER, x + 0.01).h(63000).exec())

            // Right side bases (mirrored)
            for (let h = 0; h <= 52000; h += 13000) {
                sink.push(pool.build(TH_BASE, -x).h(h).flip(true).exec())
            }
            sink.push(pool.build(TH_TOWER, -x).h(63000).flip(true).exec())

            // Roof pieces
            const roofHeight = 110000
            sink.push(pool.build(ROOF1, x + 0.47).h(roofHeight).exec())
            for (let offset = 0.8; offset <= 3.4; offset += 0.35) {
                sink.push(pool.build(ROOF2, x + offset).h(roofHeight).exec())
            }
            sink.push(pool.build(ROOF1, -x - 0.45).h(roofHeight).flip(true).exec())

            // Flags
            const flagHeight = 101000
            for (let offset = 0.9; offset <= 3.1; offset += 1.1) {
                sink.push(pool.build(FLAGS, x + offset).h(flagHeight).exec())
            }
            return
        }
        if (f === SIGN) {
            sink.push(
                pool.build(POLE4, x).s(1.5).exec(),
                pool.build(f, x).s(1.5).h(48000).flip(x > 0).exec(),
            )
            return
        }
        if (f === BB) {
            sink.push(
                pool.build(POLE, x + 0.75).s(3).exec(),
                pool.build(POLE, x - 0.75).s(3).exec(),
                pool.build(f, x).s(3).h(64000).exec(),
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
    prlx = prlxs.moon
}

export class Gate extends Tropics {
    reps = 2
    laneData = laneData.tight
    constructor() {
        super()
        this.addRule("isle_haus", -30, -30, 0.0075)
        this.addRule("throof", -2, -2, 0.0075)
        this.addDynRule("gull", -20, -10, 0.005, { dist: "noise", clus: 5 })
        this.addDynRule("blimp", -10, -3, 0.001)
        this.addDynRule("blimp", 10, 3, 0.002, { det: false, stride: 20 })
        this.addRule("mound", -10, -24, 0.03, { dist: "noise" })
        this.addRule("banana", 1.4, 5.5, 0.02, { dist: "noise", clus: 6, offset: 10 })
        this.addRule("cruise", 4, 4, 0.01)
        this.addRule("thatch2", 8, 12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
    }
}
export class Entry extends Gate {
    reps = 1
    expanse = 400
    laneData = laneData.none
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.02, { dist: "sine", offset: 60 })
    }
}
export class Entry0 extends Gate {
    reps = 1
    expanse = 320
    laneData = laneData.none
    profile = "platform"
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.02, { dist: "sine", offset: 40 })
    }
}
export class Entry1 extends Gate {
    reps = 2
    expanse = 500
    fixed=true
    profile="volcano"
}

export class Fortress extends Tropics {
    reps = 3
    expanse = 200
    profile = "straight"
    constructor() {
        super()
        this.addRule("tower1", -2, -2, 0.01)
        this.addRule("tower1", 2.5, 2.5, 0.01)
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, offset: 100, det: false })
        this.addDynRule("blimp", -15, -5, 0.001, { det: "false", stride: 200 })
        this.addDynRule("blimp", 15, 5, 0.001, { det: "false", stride: 200, offset: 300 })

    }
}
export class NullFort extends Tropics {
    reps = 1
    expanse = 300
    profile = "straight"
    constructor() {
        super()
        this.addRule("sign", -2, -2, 0.0075, { clus: 5, stride: 16 })
        this.addRule("sign", 2, 2, 0.0075, { clus: 5, stride: 16, offset: 75 })
    }
}
export class FlagFort extends Tropics {
    reps = 2
    expanse = 400
    profile = "straight"
    constructor() {
        super()
        this.addRule(HANG, -1.6, -1.6, 0.015)
        this.addRule(HANG, -2, -2, 0.015)
        this.addRule("tower1", -2, -2, 0.015)
        this.addRule("tower1", 2.5, 2.5, 0.015)
        this.addRule("isle_haus", 24, 24, 0.0025, { det: false, stride: 50} )
        this.addRule("banana", 1.75, 4.5, 0.1)
        this.addRule("rhodo", -1.5, -4, 0.02, { dist: "noise", clus: 8, stride: 3})
        this.addRule("thatch2", -8, -12, 0.01, { dist: "sawtooth", offset: 0, clus: 5, stride: 2 })
    }
}
export class FlagFort2 extends Tropics {
    reps = 2
    expanse = 300
    profile = "straight"
    constructor() {
        super()
        this.addRule(HANG, -1.8, -1.8, 0.02)
        this.addRule(HANG, -1.2, -1.2, 0.02)
        this.addRule("tower1", -2, -2, 0.02)
        this.addRule("tower1", 2.5, 2.5, 0.04)
        this.addRule("cruise", -2.25, -4, 0.0025, { det: false, stride: 50} )
        this.addRule("banana", 2, 3, 0.05)
    }
}
export class FlagFort3 extends Tropics {
    expanse = 400
    road=roads.causeway
    constructor() {
        super()
        this.addRule(["house2"], -2, -2, 0.01)
        this.addRule(["house2", "cruise", "throof"], -2, -2, 0.01, { offset: 50 })
        this.addDynRule("gull", -20, -10, 0.005, { dist: "noise", clus: 5 })
        this.addDynRule("blimp", -15, -5, 0.001)
        this.addDynRule("blimp", 15, 5, 0.002, { det: false, stride: 20 })
        this.addRule("rhodo", -1.75, -1.75, 0.05, { clus: 3, stride: 1})
        this.addRule(HANG, -7.5, -7.5,  0.01, { clus: 6, stride: 10 })
        this.addRule("tower1", -7.75, -7.75,  0.01, { clus: 6, stride: 10 })
        this.addRule(TH_POLE, -3.5, -3.5, 0.01, { clus: 6, stride: 10 })
        this.addRule(["tower1", "shack5", "tower1", "stdom", TH_POLE], 4, 4, 0.01)
        this.addRule(["banvar", "flower1"], 3, 5.5, 0.2, { dist: "noise"})
        this.addRule("fern", 2, 4, 0.1, { dist: "noise"})
        this.addRule(["sign"], -2, -2, 0.005, { det: false, stride: 40 })
        this.addRule("thatch2", 9, 13, 0.01, { dist: "sawtooth", offset: 0, clus: 8, stride: 2 })
    }
}
export class TBound2 extends SegmentObjGen {
    expanse = 400
    amplitude = 1500
    profile = "q1"
    vibe = vibes.breeze
    road = roads.causeway
    prlx = prlxs.moon
}
export class TBound1 extends TBound2 {
    expanse = 400
    amplitude = 500
    profile = "uRamp"
    reps = 1
}
export class BHills1 extends Tropics {
    expanse = 600
    reps=1
    road=roads.beach
    profile = "platform"
    laneData=laneData.all
    constructor() {
        super()
        this.addRule("mound", 16, 30, 0.05, { dist: "combinedSine" })
        this.addRule("fern", 1.25, 6, 0.004, { det: false, clus: 10, stride: 2, dist: "noise"})
        this.addRule("fern", -1.25, -3, 0.01, { det: false, clus: 10, stride: 2, dist: "noise"})
        this.addRule("cruise", -3.6, -3.6, 0.0025, { det: false, stride: 90} )
        this.addRule("sign", 2, 2, 0.01, { clus: 5, stride: 16 })
        this.addRule("sign", -2, -2, 0.01, { clus: 5, stride: 16 })
    }
}
export class BHills2 extends Tropics {
    reps = 3
    expanse = 400
    road=roads.beach
    constructor() {
        super()
        this.addRule("thatch2", 8, 12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
        this.addRule("mound", 16, 30, 0.05, { dist: "combinedSine" })
        this.addRule("motel", 5, 5, 0.0025)
        this.addRule("fern", 1.25, 6, 0.004, { det: false, clus: 10, stride: 2, dist: "noise"})
        this.addRule("fern", -1.25, -3, 0.01, { det: false, clus: 10, stride: 2, dist: "noise"})
        this.addDynRule("gull", -10, -16, 0.01, { clus: 5, det: false, stride: 100 })
        this.addRule("cruise", -3.6, -3.6, 0.0025, { det: false, stride: 90} )
        this.addRule("isle_haus", -30, -50, 0.0025, { det: false, stride: 100, offset: 25 })

    }
}
export class BHills3 extends Tropics {
    expanse = 400
    reps=3
    road=roads.beach
    constructor() {
        super()
        this.addRule("tower1", -10, -10, 1)
        this.addRule("fern", -1.25, -3, 0.1)
        this.addRule("fern", 1.75, 3.25, 0.1)
        this.addRule("cruise", -3.6, -3.6, 0.0025, { det: false, stride: 90} )
        this.addRule("sign", 2, 2, 0.01, { clus: 5, stride: 16 })
    }
}
export class BHills4 extends Tropics {
    expanse = 400
    reps=3
    road=roads.beach
    profile="straight"
    constructor() {
        super()
        // this.addRule("tower1", -10, -10, 0.1, { clus: 10 })
        this.addRule(["rhodo", "flower1"], 4.25, 7, 0.02, { dist: "noise", clus: 8, stride: 3})
        this.addRule(HANG, 6, 6, 0.01)
        this.addRule("house2",5,5, 0.01)
        this.addRule("house2", 12.5, 12.5, 0.02)
        this.addRule("house2", 11, 11, 0.02)
        this.addRule("palm", 7, 10.5, 0.06, { dist: "combinedSine"})
        this.addRule("cruise", -3.6, -3.6, 0.00125, { det: false, stride: 90} )
        this.addRule("sign", -2, -2, 0.01, { clus: 5, stride: 16 })
    }
}

export class BTown extends Tropics {
    reps = 2
    expanse = 400
    amplitude=500
    road=roads.beach
    profile="straight"
    constructor() {
        super()
        this.addRule(HANG, -1.7, -1.7, 0.02)
        this.addRule(HANG, 2.04, 2.04, 0.02)
        this.addRule("tower1", -2, -2, 0.02)
        this.addRule("tower1", 6, 6, 0.1, { clus: 10 })
        this.addRule("shrub2", 1.75, 4, 0.1, { dist: "longSquare" })
        this.addDynRule("gull", 20, 10, 0.0025, { dist: "noise", clus: 8, offset: 100 })
        this.addDynRule("gull", -30, -15, 0.0025, { dist: "noise", clus: 6 , })
    }
}
export class BCont extends Tropics {
    reps = 1
    expanse = 400
    road=roads.beach
    constructor() {
        super()
        this.addRule("shrub2", 1.75, 4, 0.5)
        this.addRule("shack5",  6, 10, 0.01, { dist: "sawtooth", clus: 50 })
    }
}
export class BField extends Tropics {
    reps = 2
    expanse = 300
    road=roads.beach
    profile="straight"
    constructor() {
        super()
        // this.addRule("flower1", -2, -20, 0.2 )
        this.addRule("shrub2", 3.5, 6, 0.5, { dist: "sawtooth"})
        this.addRule("shrub1", 1.4, 3, 0.5, { dist: "noise"})
        this.addRule("building", -7, -20, 0.0125, { dist: "triangleWave"})
        this.addRule("bb", 9, 15, 0.01)
    }
}

export class BGard extends Tropics {
    reps = 2
    expanse = 300
    road=roads.beach
    constructor() {
        super()
        this.addRule("isle_haus", -30, -30, 0.0075)
        this.addRule("tower1", 4, 4, 0.02)
        this.addRule("tower1", 6, 6, 0.01)
        this.addRule(["banvar", "flower1"], 3, 5.5, 0.2, { dist: "noise"})
        this.addRule("fern", 2, 4, 0.1, { dist: "noise"})
        this.addRule("sign", -2, -2, 0.005, { det: false, stride: 40 })
        this.addRule("cruise", -3, -3, 0.005, { det: false, stride: 40 })
    }
}
export class IsleFlank extends Tropics {
    reps = 2
    expanse = 300
    road=roads.causeway
    constructor() {
        super()
        this.addRule("thatch2", 8, 12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
        this.addRule("mound", 16, 30, 0.05, { dist: "combinedSine" })
        this.addRule("mound", -16, -30, 0.05, { dist: "combinedSine" })
        this.addRule("fern", -1.25, -4, 0.004, { det: false, clus: 10, stride: 2, dist: "noise"})
        this.addRule("fern", 1.25, 4, 0.004, { det: false, clus: 10, stride: 2, dist: "noise"})
        this.addDynRule("gull", -10, -16, 0.01, { clus: 5, det: false, stride: 100 })
    }
}

export class BCity extends Tropics {
    reps = 3
    expanse = 300
    profile="q1"
    road=roads.lefSea
    vibe=vibes.egypt
    constructor() {
        super()
        this.addRule("flower1", 2, 20, 0.2 )
        // this.addRule("shrub2", 3.5, 6, 0.5, { dist: "sawtooth"})
        this.addRule("shrub1", 1.4, 3, 0.5, { dist: "noise"})
        this.addRule("building", 7, 20, 0.0075, { dist: "triangleWave"})
        this.addRule(["bb", "motel", "kulfi"], 7, 20, 0.0075, { dist: "triangleWave", offset: 50})
    }
}
