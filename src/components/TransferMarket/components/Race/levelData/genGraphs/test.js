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
const BRK = "bark"
const flags = ["fred", "fwhite"]
const SIGN = "sign"
const POLE4 = "pole4"
const STDOM = "stdom"
const BAN = "BAN"
const FLAGS = "flags";
const acm = createAcm({
    rightFlips: ["bar1", "tower1","np_wall"],
    leftFlips: ["house2", "np_haus1"],
    flower1: 2,
    scaleMap: {
        dembele: 1.75,
        raphina: 1.75,
        decor_lg: 3,
        rodrygo: 1.75,
        caicedo: 1.75,
        "kvaratskhelia ": 1.75,
        due: 1.75,
        lautaro: 1.75,
        alvarez: 1.75,
        bellingham: 1.75,
        haaland: 1.75,
        isak: 1.75,
        mbappe: 1.75,
        mcallister: 1.75,
        musiala: 1.75,
        olise: 1.75,
        palmer: 1.75,
        pedri: 1.75,
        phoden: 1.75,
        rice: 1.75,
        rodri: 1.75,
        saka: 1.75,
        velverde: 1.75,
        vinicius: 1.75,
        wirtz: 1.75,
        yamal: 1.75,
        thtower: 2.5,
        banvar: [1.25, 0.9],
        dustbin: 1.75,
        wind_blade: 2,
        fern: [0.75, 1],
        motel: 2.5,
        kulfi: 3,
        temple4: 3,
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
        fruit2: 2,
        fruit1: 4,
        fruit3: 2,
        fruits: 2,
        oranges: 1.8,
        house2: 3,
        np_wall: 2.8,
        np_haus1: 3,
    },
    heightmap: {
        cruise: -1000,
        bar1: -5000,
        flower1: -40000,
        thtower: -100000,
    },
    frameMap: {
        banvar: "banana",
        decor_lg: "decor1",
    },
    mirrorMap: {
        rhodo: .3,
        rhodo2: 0.3,
        flower1: .38
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
        if (f === SACK) {
            sink.push(
                pool.build(pickOne(spices), x).s(2.5).h(48000).exec(),
                pool.build(f, x).s(2.5).exec()
            );
            return;
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
                pool.build(CHR1, x + 0.83)
                    .s(3)
                    .flip(true)
                    .h(89800)
                    .exec()
            )
            sink.push(
                pool.build(CHR2, x + 2.32)
                    .s(3)
                    .flip(true)
                    .h(92500)
                    .exec()
            )
            sink.push(
                pool.build(CHR3, x + 3.24)
                    .s(3)
                    .flip(true)
                    .h(103000)
                    .exec()
            )
            // Left side cherries
            sink.push(
                pool.build(CHR1, x - 0.9)
                    .s(3)
                    .h(89800)
                    .exec()
            )
            sink.push(
                pool.build(CHR2, x - 2.4)
                    .s(3)
                    .h(89800)
                    .exec()
            )
            sink.push(
                pool.build(CHR3, x - 3.32)
                    .s(3)
                    .h(103000)
                    .exec()
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
                    pool.build(flags[i % 3], x - sign * (1 + i * 0.4))
                        .h(h)
                        .s(3)
                        .exec()
                );
            }
            return;
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
    expanse = 250
    reps = 1
    fixed = true
    fixed = true
    amplitude = 1200
    vibe = vibes.breeze
    road = roads.np_isle
    prlx = prlxs.moon
    profile="straight"
}
export class N1 extends Nepal {
    profile = "q2"
    amplitude = 200
    reps = 1
    constructor() {
        super()
        // this.addRule(["cherry",], 4.5, 5.5, 0.05, { dist: "longSquare", stride: 20, offset: 20 })
        this.addDynRule("gull", 20, 10, 0.05, { dist: "noise", clus: 5, det: true })
        this.addRule("dembele", -3.5, -3.5, 0.0075, { stride: 10e3 })
        this.addRule(["fern", "stone"], 5, 1.5, 0.01, { clus: 5, stride: 8, dist: "noise" })
    }
}

export class N2 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("raphina", 3.5, 3.5, 0.01, { stride: 10e3 })
        this.addRule("house2", -11, -11, 0.02)
        this.addRule("house2", -10, -10, 0.02)
        this.addRule("fern", -1.25, -3, 0.1)
        this.addRule("fern", 1.75, 3.25, 0.1)
        this.addRule("cruise", -4.6, -4.6, 0.0025, { det: false, stride: 90 })
        this.addRule("sign", 2, 2, 0.01, { clus: 5, stride: 16 })
    }
}

export class N3 extends Nepal {
    road = roads.np_isle
    amplitude=200
    expanse=200
    profile="platform"
    curvature = "bluntRightSine"
    constructor() {
        super()
        this.addRule("rodrygo", -2.75, -2.75, 0.01, { stride: 10e3 })
        this.addRule("building", -10, -10, 0.01, { dist: "longSquare", offset: 50 })
        this.addRule("rhodo", -2.5, -6, 0.5, { dist: "sine" })
        this.addRule("rhodo2", -2.5, -6, 0.5, { dist: "cosine" })
        this.addRule("rhodo", 2.5, 6, 0.5, { dist: "sine" })
        this.addRule("rhodo2", 2.5, 6, 0.5, { dist: "cosine" })
        this.addRule("flags", 6, 6, 0.004, { dist: "combinedSine", clus: 3, stride: 50 });
        this.addRule(["cherry", "cherry", "building", "building", "motel"], 4.75, 4.75, 0.004, { dist: "combinedSine", clus: 3, stride: 50 });
    }
}

export class N4 extends Nepal {
    road = roads.nepal
    profile = "straight"
    curvature = "straight"
    constructor() {
        super()
        this.addRule("kvaratskhelia ", 3.7, 3.7, 0.01, { stride: 10e3 })
        this.addRule("59", -15, 10, 1, { dist: "sawtooth", stride: 0 })
        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })
        this.addRule("np_haus1", -5.5, -5.5, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("decor_lg", -2, -12, 0.2, { dist: "noise" })
        this.addRule(["oranges", "basket", "sack", "fruits"], 5, 3, 0.1, { offset: 3, clus: 4, stride: 6 })
        // this.addRule(["basket", "sack"], -4, -2, 0.01, { offset: 25, clus: 4, stride: 6 })
    }
}

export class N5 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    curvature = "straight"
    constructor() {
        super()
        this.addRule("caicedo", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N6 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("due", -3.5, -3.5, 0.01, { stride: 10e3 })
        this.addDynRule("gull", -20, -10, 0.005, { dist: "noise", clus: 5 })
        this.addDynRule("blimp", 10, 3, 0.1, { det: true, stride: 10e3 })
        this.addDynRule("blimp", -10, -3, 0.1, { det: true, stride: 10e3, offset: 50 })
        // this.addRule("mound", -10, -24, 0.03, { dist: "noise" })
        this.addRule("banana", 1.4, 5.5, 0.02, { dist: "noise", clus: 6, offset: 10 })
        this.addRule("thatch2", 8, 12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
    }
}

export class N7 extends Nepal {
    road = roads.np_isle
    profile = "q1"
    constructor() {
        super()
        this.addRule("lautaro", 2.5, 2.5, 0.01, { stride: 10e3 })
        this.addDynRule("blimp", 10, 3, 0.001)
        this.addDynRule("blimp", -10, -3, 0.002, { det: false, stride: 20 })
        // this.addRule("mound", -10, -24, 0.03, { dist: "noise" })
        this.addRule("banana", -1.4, -5.5, 0.02, { dist: "noise", clus: 6, offset: 10 })
        this.addRule("thatch2", -8, -12, 0.01, { dist: "sawtooth", offset: 0, clus: 15, stride: 2 })
    }
}

export class N8 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("foden", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N9 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("allister", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N10 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("olise", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N11 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("alvarez", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N12 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("rodri", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N13 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("isak", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N14 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("rice", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N15 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("palmer", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N16 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("valverde", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N17 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("musiala", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N18 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("wirtz", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N19 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("pedri", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N20 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("saka", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N21 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("junior", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N22 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("mbappé", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N23 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("haaland", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N24 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("bellingham", -3, -3, 0.01, { stride: 10e3 })
    }
}

export class N25 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("yamal", -3, -3, 0.01, { stride: 10e3 })
    }
}

const graph = new GeneratorGraph()
graph.addNodes([N1, N2, N3, N4, N5, N6, N7,
    // N8, N9, N10, N11, N12, N13, N14, N15, N16, N17, N18, N19, N20, N21, N22, N23, N24, N25
])
graph.addEdge(N1, N2)
graph.addEdge(N2, N3)
graph.addEdge(N3, N4)
graph.addEdge(N4, N5)
graph.addEdge(N5, N6)
graph.addEdge(N6, N7)
// graph.addEdge(N7, N8)
// graph.addEdge(N8, N9)
// graph.addEdge(N9, N10)
// graph.addEdge(N10, N11)
// graph.addEdge(N11, N12)
// graph.addEdge(N12, N13)
// graph.addEdge(N13, N14)
// graph.addEdge(N14, N15)
// graph.addEdge(N15, N16)
// graph.addEdge(N16, N17)
// graph.addEdge(N17, N18)
// graph.addEdge(N18, N19)
// graph.addEdge(N19, N20)
// graph.addEdge(N20, N21)
// graph.addEdge(N21, N22)
// graph.addEdge(N22, N23)
// graph.addEdge(N23, N24)
// graph.addEdge(N24, N25)
graph.entry = [N1]
export default graph