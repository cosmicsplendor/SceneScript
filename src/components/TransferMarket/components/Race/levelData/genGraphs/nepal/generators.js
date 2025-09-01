import { vibes, roads, prlxs } from "../ambiences"
import laneData from "../laneData"
import SegmentObjGen, { createAcm } from "../../../lib/utils/SegmentObjGen"
import { pickOne, rand } from "../../../lib/utils/math"
let H = 0
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
// String literal optimization
const CHR = "cherry"
const CHR1 = `${CHR}1`
const CHR2 = `${CHR}2`
const CHR3 = `${CHR}3`
const BRK = "bark"
const SPECT = "spect"
const BULB = "sl_bulb1"
const FLAGS = "flags";
const DECOR1 = "decor1";
const SACK = "sack";
const BASKET = "basket";
const STUPA = "stupa";
const THPOLE1 = "thpole1";
const POT1 = "pot1";
const DALO = "dalo";
const STDOME = "stdom";
const STARC = "starc";
const gloRegex = /^[0-9]+$/
const spices = ["ric", "turm", "chil", "chil", "turm"]
const fruits = ["fruit1", "fruit2"]
const flags = ["fred", "fwhite", "fyellow"]
const acm = createAcm({
    rightFlips: ["np_wall", "np_haus2", "bar1", "tower1",],
    leftFlips: ["paddy", "shack5", "kulfi", "stupa", "np_haus1"],
    frameMap: {
        decor: "decor1",
        flow_sm: "flower1",
        leaves: "banana",
        decor_lg: "decor1",
        np_haus: "house2",
    },
    scaleMap: {
        bar1: 2,
        house2: 3,
        np_haus: 3,
        flow_sm: 0.6,
        np_wall: 2.8,
        np_haus1: 3,
        temple3: 4,
        np_haus2: 6,
        np_haus3: 6,
        temple2: 3,
        temple1: 1.4,
        motel: 3,
        fig: 2,
        stupa: 8,
        temple4: 3,
        banana: [2, 4],
        stone: [1.75, 1.5, 1.25],
        thtower: 1.4,
        kulfi: 1.8,
        dustbin: 3,
        fruit2: 2,
        fruit1: 4,
        fruit3: 2,
        fruits: 2,
        oranges: 1.8,
        thatch2: 2.5,
        tower1: 1.25,
        building: 3,
        cruise: 10,
        decor_lg: 3,
        fern: 2,
        transmission: 4,
        bal1: 2,
        bal2: 2
    },
    heightMap: {
        temple3: 90000,
        np_haus2: 50000,
        sl_bulb: -25000,
        fig: 1000,
        thtower: -10000,
        igneus: 100000,
        rhodo: -6000,
        thatch2: -7500,
        house2: 10000,
        stupa: 0
    },
    mirrorMap: {
        flow_sm: 0.23,
        flower1: 0.39,
        rhodo2: 0.23,
        rhodo: 0.2,
        transmission: 1,
    },

    customAcm: (f, x, sink, pool) => {
        if (f === FLAGS) {
            const ih = rand(1, 1) * 75000 + 70000;
            const sign = x > 0 ? 1 : -1;
            const num = ih === 70000 ? 4 : 5;
            for (let i = 0; i < num; i++) {
                sink.push(
                    pool.build(THPOLE1, x - sign * 10).h(i * 75000).s(2).exec()
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
        if (f === DECOR1) {
            sink.push(
                pool.build(f, x).s(3).h(50000).exec(),
                pool.build(POT1, x).s(3).exec()
            );
            return;
        }
        if (f === SACK) {
            sink.push(
                pool.build(pickOne(spices), x).s(2.5).h(48000).exec(),
                pool.build(f, x).s(2.5).exec()
            );
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
        if (f === BASKET) {
            sink.push(
                pool.build(pickOne(fruits), x).s(2).h(37000).exec(),
                pool.build(DALO, x).s(2).exec()
            );
            return;
        }
        if (f === STUPA) {
            const flip = x < 0;
            const m = Math.sign(x);
            sink.push(pool.build(STDOME, x).h(100000).s(8).r(0.025 * m).flip(flip).exec());
            sink.push(pool.build(STARC, x - m * 0.15).h(335250).s(8).r(0.025 * m).flip(flip).exec());
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

        if (gloRegex.test(f)) {
            const h = -150000 + pseudoNoise.generate(0.0125 * f) * 550000
            sink.push(
                pool.build(BULB, x)
                    .s(h < -25000 ? 0.01 : 1.75)
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
    vibe = vibes.np_light
    road = roads.nepal
    prlx = prlxs.mountains
}

export class RFlo extends Nepal {
    road = roads.np_river
    constructor() {
        super()
        this.addRule(["rhodo", "flow_sm", "rhodo2", "stone"], 2, 6, 0.02, { dist: "noise", clus: 12, offset: 1, det: true })
        this.addRule("stone", 1.5, 4, 0.01, { dist: "noise", clus: 3, offset: 40, stride: 2, det: false })
        this.addRule(["thtower", "cherry",], -3.25, 3.25, 0.02, { dist: "longSquare", stride: 10 })
        this.addRule("banana", -8, -24, 0.05, { dist: "noise" })
        this.addRule("paddy", 1.5, 1.5, 1)
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addRule("paddy", 2, 2, 0.08, { clus: 40 })
    }
}
export class RMus extends Nepal {
    road = roads.np_river
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
export class RFor extends Nepal {
    expanse = 400
    road = roads.np_river
    constructor() {
        super()
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addRule("banana", -8, -20, 0.1)
    }
}
export class RFarm extends Nepal {
    road = roads.np_grass
    constructor() {
        super()
        this.addRule("thatch2", 5.5, 12, 0.02, { det: false, stride: 50 })
        this.addRule("flow_sm", -1.75, -3.25, 0.3, { dist: "noise" })

        this.addRule("flower1", 2.5, 7, 0.5, { dist: "noise" })
        this.addRule("transmission", -20, -40, 0.01)
    }
}

export class RGaun1 extends Nepal {
    road = roads.np_river
    profile = "straight"
    constructor() {
        super()
        this.addRule(["leaves", "stone"], 1.25, 4, 0.05, { det: false, dist: "noise" })
        this.addRule(["house2"], -7.125, -7.125, 0.02, { dist: "combinedSine", stride: 50 })
        this.addRule(["house2"], -8.2, -8.2, 0.02, { dist: "combinedSine", stride: 50 })
        this.addRule(["decor_lg",], -3, -8, 0.09, { dist: "noise" })
        this.addRule(["banana"], -13, -24, 0.05, { dist: "noise" })
    }
}
export class RGaun2 extends Nepal {
    road = roads.np_river
    profile = "straight"
    constructor() {
        super()
        this.addRule("tower1", -6, -4, 0.01, { clus: 16, dist: "sawtooth" })
        this.addRule("decor_lg", -2, -12, 0.5, { dist: "noise" })
        this.addRule("decor_lg", -2, -12, 0.5, { dist: "noise" })
        this.addRule(["thtower", "cherry"], 3.25, 3.25, 0.005)
        this.addRule("transmission", -20, -40, 0.01)
    }
}

export class NIsle1 extends Nepal {
    road = roads.np_isle
    profile = "uRamp"
    expanse = 600
    amplitude = 800
    reps = 1
    laneData = laneData.none
    constructor() {
        super()
        this.addRule(["thtower", "cherry",], -3, 3, 0.02, { dist: "longSquare", stride: 10 })
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, det: false })
    }
}

export class NIsle2 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    reps = 2
    expanse = 350
    laneData = laneData.none
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.01, { dist: "noise", offset: 100 })
        this.addRule("house2", 13.35, 13.35, 0.004)
        this.addRule("house2", 12, 12, 0.004,)
        this.addRule("fern", 7, 3, 0.005, { clus: 2, stride: 8, dist: "noise" })
        this.addRule("stone", 6, 2, 0.005, { offset: 100, clus: 5, stride: 4 })
        this.addRule(["fern", "temple4"], -3, -3, 0.01, { stride: 10 })
        this.addRule("flags", 7, 7, 0.01, { stride: 10, offset: 25 })
        this.addRule("cherry", 6, 6, 0.01, { dist: "sine", stride: 10, offset: 25 })
        this.addDynRule("gull", -20, -10, 0.001, { dist: "noise", clus: 5, det: false })
        this.addDynRule("gull", 20, 10, 0.001, { dist: "noise", clus: 5, det: false })
    }
}

export class NIsle3 extends Nepal {
    road = roads.np_isle
    profile = "straight"
    constructor() {
        super()
        this.addRule("building", -6, -6, 0.01, { dist: "longSquare", offset: 50 })
        this.addRule("rhodo", -2.5, -6, 0.5, { dist: "sine" })
        this.addRule("rhodo2", -2.5, -6, 0.5, { dist: "cosine" })
        this.addRule("rhodo", 2.5, 6, 0.5, { dist: "sine" })
        this.addRule("rhodo2", 2.5, 6, 0.5, { dist: "cosine" })
        this.addRule("flags", 6, 6, 0.004, { dist: "combinedSine", clus: 3, stride: 50 });
        this.addRule(["cherry", "cherry", "building", "building", "motel"], 4.75, 4.75, 0.004, { dist: "combinedSine", clus: 3, stride: 50 });
    }
}

export class NIsle4 extends Nepal {
    vibe = vibes.np_light
    road = roads.np_isle
    constructor() {
        super()
        this.addRule(["fern", "stone"], -2, -6, 0.005, { dist: "noise", clus: 3, stride: 8 })
        this.addRule(["fern", "stone"], 2, 6, 0.005, { dist: "noise", clus: 3, stride: 8, offset: 50 })
        this.addRule(["flags", "fern"], -4, 4, 0.02, { dist: "longSquare", stride: 50, offset: 10 })
        this.addRule("cherry", -4, 4, 0.02, { dist: "longSquare", stride: 50, offset: 10 })
        this.addRule(["fern", "temple4"], 6, -6, 0.02, { dist: "longSquare", stride: 50 })
    }
}

export class RGard extends Nepal {
    road = roads.np_river
    constructor() {
        super()
        this.addRule("cherry", -4, -12, 0.025, { det: false, dist: "combinedSine", stride: 60, offset: 100 })
        this.addRule("rhodo", -2, -7, 1, { dist: "sine" })
        this.addRule("rhodo2", -2, -7, 1, { dist: "cosine" })
        this.addRule("transmission", -20, -40, 0.01)
    }
}
export class RFense extends Nepal {
    road = roads.np_river
    constructor() {
        super()
        this.addRule("decor", -1, -3, 1)
        this.addRule("rhodo", -1, -3, 0.05)
        this.addRule("cherry", -3, -3, 0.0075, { det: false, stride: 100 })
        this.addRule("thtower", 2, 2, 0.005, { det: false, stride: 100 })
        this.addRule("shack5", -1.75, -4, 1, { dist: "combinedSine" });

    }
}
export class RDecor extends Nepal {
    road = roads.np_grass
    profile = "q4"
    constructor() {
        super()
        this.addRule("decor", -1, -3, 1)
        this.addRule("rhodo", -1, -3, 0.05)
        this.addRule("flags", 7, 7, 0.01, { offset: 20 })
        this.addRule("house2", 7.76, 7.76, 0.01, { offset: 20 })
        this.addRule("house2", 7, 7, 0.01, { offset: 20 })
        this.addRule("house2", 6.225, 6.225, 0.01, { offset: 20 })
        this.addRule("banana", -4.6, -4.6, 0.005)
        this.addRule("rhodo", 2.5, 7.5, 70.5, { dist: "sine" })
        this.addRule("rhodo2", 2.5, 7.5, 70.5, { dist: "cosine" })
        this.addRule("transmission", -20, -40, 0.005)
        this.addRule("shack5", -1.75, -4, 1, { dist: "combinedSine" });
    }
}

export class NEntry extends Nepal {
    expanse = 400
    amplitude = 600
    reps = 2
    fixed = true
    vibe = vibes.np_light
    road = roads.nepal
    constructor() {
        super()
        this.addRule("np_wall", -9, -9, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", -10, -10, 0.95, { clus: 95 })

        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })
    }
}

export class NL1 extends Nepal {
    profile = "straight"
    expanse = 750
    laneData = laneData.none
    vibe = vibes.np_light
    road = roads.nepal
    reset() {
        pseudoNoise.t = Math.PI * 260 / 180
        pseudoNoise.val = 0
        pseudoNoise.slope = 1
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.01, { dist: "sine" })
        this.addRule("np_wall", -9, -9, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", -10, -10, 0.95, { clus: 95 })

        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })
        this.addRule("spect", -3, -3, 0.1, { clus: 1 })

        this.addRule("decor1", -6, 6, 0.004, { dist: "squareWave" })
        this.addRule(["np_haus2", "cherry"], 18, 18, 0.004, { offset: 150 })
        this.addRule(["np_haus2", "temple3"], 14, 14, 0.004, { offset: 250 })
        this.addRule(["temple3", "stupa"], 14, 14, 0.004, { offset: 160 })
        this.addRule("np_haus2", -18, -18, 0.004, { offset: 100 })
        this.addRule("cherry", -11, -16, 0.004, { offset: 50 })
        this.addRule(["np_haus2", "temple3"], -14, -14, 0.004, { offset: 150 })
        this.addRule("np_haus2", -14, -14, 0.004, { offset: 110 })
    }
}
export class NL2 extends Nepal {
    profile = "straight"
    expanse = 400
    vibe = vibes.np_light
    road = roads.nepal
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.02, { offset: 25, dist: "cosine" })

        this.addRule("np_wall", -9, -9, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", -9, -9, 0.95, { clus: 95 })

        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })

        this.addRule("decor_lg", 3, 7.5, 0.01, { clus: 3, dist: "noise", stride: 2 })
        this.addRule(["dustbin", "decor1", "np_haus1", "temple4"], -5, -5, 0.01)
        this.addRule(["stupa", "np_haus2"], -18, -18, 0.004, { offset: 200, stride: 60 })
        this.addRule(["np_haus2", "cherry"], -11, -11, 0.004, { offset: 50 })
        this.addRule(["np_haus2", "cherry"], 18, 18, 0.004, { offset: 50 })
        this.addRule(["np_haus2", "temple3"], 14, 14, 0.004, { offset: 150 })
        this.addRule(["np_haus2", "stupa"], 14, 14, 0.004, { offset: 60 })
    }
}

export class NL3 extends Nepal {
    profile = "straight"
    expanse = 400
    vibe = vibes.np_light
    road = roads.nepal
    laneData = laneData.none
    reset() {
        pseudoNoise.t = Math.PI * 1.25
        pseudoNoise.val = 0
        pseudoNoise.slope = 1
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.025, { dist: "triangleWave" })
        this.addRule(["stupa", "temple3", "np_haus2"], -18, -18, 0.005, { det: false, stride: 100, offset: 100 })
        this.addRule(["stupa", "temple3", "np_haus2"], 18, 18, 0.005, { det: false, stride: 100, offset: 100 })
        this.addRule("np_wall", -9, -9, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", -10, -10, 0.95, { clus: 95 })

        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })
        this.addRule("24", -6, 10, 1.5, { dist: "combinedSine" })



        this.addRule("decor1", 3.5, 6, 0.01, { clus: 2, dist: "noise" })
        this.addRule(["dustbin", "temple4"], 7, 7, 0.01)
        this.addRule(["kulfi", "dustbin", "decor1"], -4, -4, 0.02, { det: false, dist: "squareWave", stride: 100 })
    }
}


export class NL4 extends Nepal {
    profile = "straight"
    expanse = 400
    vibe = vibes.np_light
    road = roads.nepal
    laneData = laneData.sides
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addDynRule("bar1", -0.1, 0.1, 0.012, { dist: "squareWave" })
        this.addRule("np_wall", -9, -9, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", -10, -10, 0.95, { clus: 95 })

        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 145 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 145 })
        this.addRule(["temple3"], 13, 28, 0.01, { dist: "squareWave", clus: 1, offset: 150 })

        this.addRule("np_haus2", -18, -18, 0.005, { offset: 100 })
        this.addRule("cherry", -11, -16, 0.005, { offset: 50 })
        this.addRule("np_haus2", -14, -14, 0.005, { offset: 150 })
        this.addRule("np_haus2", -14, -14, 0.005, { offset: 110 })
        this.addRule(["np_haus1", "np_haus1", "temple4", "dustbin", "decor1"], -5, 5, 0.015, { dist: "squareWave" })
    }
}
export class Haat1 extends Nepal {
    profile = "straight"
    reps = 2
    expanse = 350
    vibe = vibes.np_light
    reset() {
        pseudoNoise.t = Math.PI * 1.25
        pseudoNoise.val = 0
        pseudoNoise.slope = 1
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.0075, { dist: "combinedSine" })
        this.addRule("48", -5, 10, 1.6, { dist: "sine", offset: 200 })
        this.addRule(["np_haus1", "np_haus1", "kulfi", "dustbin", "temple4", "cherry", "decor1"], -7, -7, 0.0125, { offset: 200 })
        this.addRule("decor_lg", 2, 12, 0.2, { dist: "noise" })
        this.addRule("np_haus", 7.76, 17.76, 0.007, { dist: "longSquare", offset: 20 })
        this.addRule("np_haus", 7, 17, 0.007, { dist: "longSquare", offset: 20 })
        this.addRule("np_haus", 6.225, 16.225, 0.007, { dist: "longSquare", offset: 20 })
        this.addRule("oranges", -2, -3, 0.01, { offset: 3 })
        this.addRule("fruits", -2.5, -3.5, 0.01,)
        this.addRule(["basket", "sack"], -2, -4, 0.01, { offset: 25, clus: 4, stride: 6 })
    }
}
export class Haat2 extends Nepal {
    profile = "straight"
    expanse = 600
    profile = "q4"
    vibe = vibes.np_light
    road = roads.nepal
    laneData = laneData.none
    reps = [1, 2]
    reset() {
        pseudoNoise.t = Math.PI * 1.25
        pseudoNoise.val = 0
        pseudoNoise.slope = 1
    }
    constructor() {
        super()
        this.addDynRule("bar1", -1, 1, 0.03, { dist: "sine", offset: 40 })
        this.addRule("59", -15, 10, 1, { dist: "sawtooth", stride: 0 })
        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })
        this.addRule("np_haus1", -5.5, -5.5, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("decor_lg", -2, -12, 0.2, { dist: "noise" })
        this.addRule("oranges", 3, 2, 0.01, { offset: 3 })
        this.addRule("fruits", 3.5, 2.5, 0.01,)
        this.addRule(["basket", "sack"], 4, 2, 0.01, { offset: 25, clus: 4, stride: 6 })
    }
}

export class Haat3 extends Nepal {
    profile = "straight"
    expanse = 350
    vibe = vibes.np_light
    road = roads.nepal
    reps = [1, 2]
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("decor_lg", -2, -12, 0.2, { dist: "noise" })
        this.addRule("np_wall", 8, 8, 0.05, { clus: 5, offset: 95 })
        this.addRule("np_wall", 9, 9, 0.95, { clus: 95 })
        this.addRule("np_haus1", -5.5, -5.5, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("flags", -5.5, -5.5, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("oranges", 3, 2, 0.01, { offset: 3 })
        this.addRule("fruits", 3.5, 2.5, 0.01,)
        this.addRule(["basket", "sack"], 4, 2, 0.01, { offset: 25, clus: 4, stride: 6 })
        this.addRule(["temple3", "np_haus2"], 18, 18, 0.004, { det: false, clus: 1, stride: 100 })
        this.addRule("np_haus2", 11, 11, 0.008, { stride: 50, det: false })
    }
}
export class Haat4 extends Nepal {
    profile = "straight"
    expanse = 350
    vibe = vibes.np_light
    reset() {
        SegmentObjGen.reset(this)
    }
    constructor() {
        super()
        this.addRule("np_wall", -8, -8, 0.05, { clus: 5, offset: 45 })
        this.addRule("np_wall", -9, -9, 0.95, { clus: 45 })
        this.addRule("decor_lg", 2, 12, 0.2, { dist: "noise" })
        this.addRule("np_haus", 6.76, 6.76, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("np_haus", 6, 6, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("np_haus", 5.225, 5.225, 0.01, { dist: "longSquare", offset: 20 })
        this.addRule("flags", 5.25, 5.25, 0.01, { dist: "longSquare", offset: 20 })

        this.addRule(["temple3", "np_haus2"], -18, -18, 0.004, { det: false, clus: 1, stride: 100, offset: 100 })
        this.addRule("np_haus2", -11, -11, 0.008, { stride: 50, det: false, offset: 100 })

        this.addRule("oranges", -2, -3, 0.01, { offset: 3 })
        this.addRule("fruits", -2.5, -3.5, 0.01,)
        this.addRule(["basket", "sack"], -2, -4, 0.01, { offset: 25, clus: 4, stride: 6 })
    }
}