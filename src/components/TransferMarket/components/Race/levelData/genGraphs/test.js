import { vibes, roads, prlxs } from "./ambiences"
import SegmentObjGen, { createAcm } from "./../../lib/utils/SegmentObjGen"
import { GeneratorGraph } from "./../../lib/utils"
import { pickOne, rand } from "./../../lib/utils/math"
const pseudoNoise = {
    t: Math.PI * 1.25,
    val: 0,
    slope: 1,
    generate(step = 0.1) {
        this.t += step
        const val = Math.sin(this.t)
        this.slope = Math.sign(val - this.val)
        this.val = val
        return val
    }
}
const gloRegex = /^[0-9]+$/
const spices = ["ric", "turm", "chil", "chil", "turm"]
const fruits = ["fruit1", "fruit2"]
let H = 0
const SACK = "sack";
const SPECT = "spect"
const BULB = "sl_bulb1"
const DALO = "dalo";
// String constants used in customAcm
const CHR = "cherry"
const CHR1 = `${CHR}1`
const CHR2 = `${CHR}2`
const CHR3 = `${CHR}3`
const TH_POLE = "thpole1"
const TH2 = "thatch2"
const HANG = "hang"
const ISL_HAUS = "isle_haus"
const MOUND = "mound"
const BASKET = "basket";
const PALM = "palm"
const FROND = "pfrond"
const BARK = "pbark"
const BRK = "bark"
const flags = ["fred", "fwhite"]
const SIGN = "sign"
const POLE4 = "pole4"
const STDOM = "stdom"
const BAN = "BAN"
const FLAGS = "flags";
const roadWidth = 200000
const rwf = 80000 / roadWidth
const acm = createAcm({
    rightFlips: ["bar1", "tower1", "np_wall", "cruise"],
    leftFlips: ["house2", "np_haus1"],
    flower1: 2,
    scaleMap: {
        transmission: 4,
        paddy: 2,
        tower1: 1.5,
        decor_lg: 3,
        banvar: [1.25, 0.9],
        dustbin: 1.75,
        wind_blade: 2,
        fern: [2, 1.5],
        motel: 2.5,
        kulfi: 3,
        stone: [1.25, 1.5, 1.75],
        temple4: 3,
        house2: 3,
        shack5: 2.75,
        building: 4,
        wind_pole: 4,
        "mound": 4.5,
        "cruise": 2.5,
        "tower1": 1.5,
        thtower: 3,
        bar1: 2,
        rhodo: 1.5,
        rhodo2: 1.5,
        tent: 2.5,
        fruit2: 2,
        fruit1: 4,
        fruit3: 2,
        fruits: 2,
        oranges: 1.8,
        house2: 3,
        np_wall: 2.8,
        np_haus1: 3,
        banforest: [2, 4],
        flow_sm: 0.6,

    },
    heightmap: {
        cruise: -1000,
        bar1: -5000,
        flower1: -40000,
        thtower: -10000
    },
    frameMap: {
        banvar: "banana",
        banforest: "banana",
        decor_lg: "decor1",
        flow_sm: "flower1",

    },
    mirrorMap: {
        rhodo: .3 * rwf,
        rhodo2: 0.3 * rwf,
        flower1: .38 * rwf,
        transmission: 1 * rwf,
        flow_sm: 0.23 * rwf,
    },
    customAcm: (f, x, sink, pool) => {
        if (f === BASKET) {
            sink.push(
                pool.build(pickOne(fruits), x).s(2).h(37000).exec(),
                pool.build(DALO, x).s(2).exec()
            );
            return;
        }
        if (f === SPECT) {
            const a1 = pseudoNoise.generate(0.1) * 900000
            for (let i = 0; i < 12; i++) {
                const t = i / 12
                const h = a1 * (1 - t) + 900000 * t * t
                const x = -10 + i * 2
                if (h < -50000) continue
                const dx = x < 2 && x > -2 && h < 700000 ? (h - 700000) * 0.0000015 * pseudoNoise.slope : 0
                H = Math.max(h, H)
                sink.push(
                    pool.build(BULB, x + dx)
                        .h(h)
                        .s(1.5)
                        .exec()
                )
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
        if (f === FLAGS) {
            const ih = rand(1, 1) * 75000 + 70000;
            const sign = x > 0 ? 1 : -1;
            const num = ih === 70000 ? 4 : 5;
            for (let i = 0; i < num; i++) {
                sink.push(
                    pool.build(TH_POLE, x - sign * 10).h(i * 75000).s(2).exec()
                );
            }
            for (let i = 0; i < 23; i++) {
                const t = i / 3;
                const h = ih + 500 * t * t * t;
                sink.push(
                    pool.build(flags[i % 2], x - sign * (1 + i * 0.4))
                        .h(h)
                        .s(3)
                        .exec()
                );
            }
            return;
        }
        if (f === CHR) {
            sink.push(
                pool.build(BRK, x)
                    .s(3)
                    .exec()
            )
            // Right side cherries (flipped)
            sink.push(
                pool.build(CHR1, x + 0.83 * rwf)
                    .s(3)
                    .flip(true)
                    .h(89800)
                    .exec()
            )
            sink.push(
                pool.build(CHR2, x + 2.32 * rwf)
                    .s(3)
                    .flip(true)
                    .h(92500)
                    .exec()
            )
            sink.push(
                pool.build(CHR3, x + 3.24 * rwf)
                    .s(3)
                    .flip(true)
                    .h(103000)
                    .exec()
            )
            // Left side cherries
            sink.push(
                pool.build(CHR1, x - 0.9 * rwf)
                    .s(3)
                    .h(89800)
                    .exec()
            )
            sink.push(
                pool.build(CHR2, x - 2.4 * rwf)
                    .s(3)
                    .h(89800)
                    .exec()
            )
            sink.push(
                pool.build(CHR3, x - 3.32 * rwf)
                    .s(3)
                    .h(103000)
                    .exec()
            )
            return
        }
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
                pool.build(TH_POLE, x - 0.5 * rwf).s(2).exec(),
                pool.build(TH_POLE, x + 0.5 * rwf).s(2).exec(),
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
        if (gloRegex.test(f)) {
            const h = -150000 + pseudoNoise.generate(0.0125 * f) * 550000
            sink.push(
                pool.build(BULB, x)
                    .s(h < -25000 ? 0.01 : 1.5)
                    .h(h)
                    .exec()
            )
            return
        }
    }
})

export class Nepal extends SegmentObjGen {
    acm = acm
    expanse = 400
    reps = 1
    fixed = true
    amplitude = 1200
    vibe = vibes.breeze
    road = roads.np_isle
    prlx = prlxs.moon
    profile = "straight"
}
export class N1 extends Nepal {
    profile = "straight"
    amplitude = 1000
    reps = 1
    expanse = 1000
    constructor() {
        super()
    }
}

export class N2 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    expanse = 10000
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("fern", -1.25, -3, 0.1)
        this.addRule("fern", 1.75, 3.25, 0.1)
        this.addRule("cruise", -4.6, -4.6, 0.0025, { det: false, stride: 90 })
        this.addRule("sign", 2, 2, 0.01, { clus: 5, stride: 16 })
    }
}

export class N3 extends Nepal {
    road = roads.np_isle
    amplitude = 200
    expanse = 800
    profile = "platform"
    constructor() {
        super()
    }
}

export class N4 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    curvature = "straight"
    constructor() {
        super()
    }
}

export class N5 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    curvature = "straight"
    constructor() {
        super()
        this.addDynRule("gull", -10, -5, 0.005, { dist: "noise", clus: 5 })
        this.addDynRule("blimp", 10, 3, 0.1, { det: true, stride: 10e3 })
        this.addDynRule("blimp", -10, -3, 0.1, { det: true, stride: 10e3, offset: 50 })
        this.addRule("banana", 1.4, 5.5, 0.02, { dist: "noise", clus: 6, offset: 10 })
        this.addRule("thatch2", 8, 12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
    }
}

export class N6 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addDynRule("blimp", 10, 3, 0.001)
        this.addDynRule("blimp", -10, -3, 0.002, { det: false, stride: 20 })
        this.addRule("banana", -1.4, -5.5, 0.02, { dist: "noise", clus: 6, offset: 10 })
        this.addRule("thatch2", -8, -12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
    }
}

export class N8 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
    }
}

export class N9 extends Nepal {
    road = roads.np_isle
    profile = "platform"
    amplitude = 400
    constructor() {
        super()
        this.addRule("isle_haus", -30, -30, 0.0075)
        this.addRule("tower1", 4, 4, 0.02)
        this.addRule("tower1", 6, 6, 0.01)
        this.addRule(["banvar", "flower1"], 3, 5.5, 0.2, { dist: "noise" })
        this.addRule("fern", 2, 4, 0.1, { dist: "noise" })
        this.addRule("sign", -2, -2, 0.005, { det: false, stride: 40 })
    }
}

export class N10 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
    }
}

export class N11 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()

    }
}

export class N12 extends Nepal {
    road = roads.np_isle
    profile = "q2"
    constructor() {
        super()
    }
}

export class N13 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("thatch2", 4, 8, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
        this.addRule("mound", 8, 24, 0.05, { dist: "combinedSine" })
        this.addRule("fern", -1.25, -4, 0.004, { det: false, clus: 10, stride: 2, dist: "noise" })
        this.addRule("fern", 1.25, 4, 0.004, { det: false, clus: 10, stride: 2, dist: "noise" })
        this.addDynRule("gull", -5, -8, 0.01, { clus: 5, det: false, stride: 100 })
    }
}

export class N14 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
    }
}

export class N15 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
    }
}

export class N16 extends Nepal {
    road = roads.np_isle
    expanse = 400
    profile = "straight"
    constructor() {
        super()
        this.addRule(["cherry", "cherry", "thtower"], 4, 7, 0.05, { dist: "longSquare", stride: 50, offset: 10 })
    }
}

export class N17 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    expanse = 250
    constructor() {
        super()
        this.addRule("24", -3, 5, 1.5, { dist: "combinedSine" })
    }
}

export class N18 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    profile="q2"
    amplitude = 400
    constructor() {
        super()
    }
}

export class N19 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    expanse = 500
    constructor() {
        super()
    }
}

export class N20 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addDynRule("gull", -20, -10, 0.005, { dist: "noise", clus: 5 })
        this.addDynRule("blimp", -15, -5, 0.001)
        this.addDynRule("blimp", 15, 5, 0.002, { det: false, stride: 20 })
        this.addRule("rhodo", -1.75, -1.75, 0.05, { clus: 3, stride: 1 })
        this.addRule(TH_POLE, -3.5, -3.5, 0.006, { clus: 6, stride: 10 })
        this.addRule(["banvar", "flower1"], 3, 5.5, 0.2, { dist: "noise" })
        this.addRule("fern", 2, 4, 0.1, { dist: "noise" })
        this.addRule(["sign"], -2, -2, 0.005, { det: false, stride: 40 })
        this.addRule("thatch2", 9, 13, 0.01, { dist: "sawtooth", offset: 0, clus: 8, stride: 2 })
    }
}

export class N21 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
    }
}

export class N22 extends Nepal {
    road = roads.np_river
    profile = "straight"
    constructor() {
        super()
        this.addRule("tower1", -7, -7, 0.01, { clus: 16, dist: "sawtooth" })
        this.addRule("decor_lg", -2, -12, 0.5, { dist: "noise" })
        this.addRule("decor_lg", -2, -12, 0.5, { dist: "noise" })
        this.addRule("transmission", -20, -40, 0.01)
    }
}

export class N23 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
    }
}

export class N24 extends Nepal {
    road = roads.np_river
    profile = "straight"
    constructor() {
        super()
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addRule("banforest", -8, -20, 0.1)
    }
}

export class N25 extends Nepal {
    road = roads.np_river
    profile = "straight"
    expanse = 600
    constructor() {
        super()
        this.addRule("flow_sm", -3, -8, 0.5, { dist: "noise" })
        this.addRule("cherry", -8, -3.25, 0.02, { dist: "longSquare", stride: 10 })
        this.addRule("flow_sm", 1.5, 3, 0.5)
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addRule("transmission", -20, -40, 0.01, { dist: "triangleWave" })
    }
}

const graph = new GeneratorGraph()
graph.addNodes([
    Nepal, N1, N2, N3, N4, N5, N6, N8, N9, N10, N11, N12, N13, N14, N15, N16, N17, N18, N19, N20, N21, N22, N23, N24, N25
])
graph.addEdge(N1, N2)
graph.addEdge(N2, N3)
graph.addEdge(N3, N4)
graph.addEdge(N4, N5)
graph.addEdge(N5, N6)
graph.addEdge(N6, N8)
graph.addEdge(N8, N9)
graph.addEdge(N9, N10)
graph.addEdge(N10, N11)
graph.addEdge(N11, N12)
graph.addEdge(N12, N13)
graph.addEdge(N13, N14)
graph.addEdge(N14, N15)
graph.addEdge(N15, N16)
graph.addEdge(N16, N17)
graph.addEdge(N17, N18)
graph.addEdge(N18, N19)
// graph.addEdge(N19, N20)
// graph.addEdge(N20, N21)
graph.addEdge(N21, N22)
graph.addEdge(N22, N23)
graph.addEdge(N23, N24)
graph.addEdge(N24, N25)
graph.entry = [N1]
export default graph