import { rand, pickOne } from './math';
import { createNoise2D } from 'simplex-noise'
const noise2d = createNoise2D()
const COMPRESSBY = 0.6
class ObjPool {
    constructor(size) {
        this.size = size;
        this.list = [];
        this.lastIdx = 0;
        this.totalCreated = 0;
        this.buildProps = {
            f: null,
            x: null,
            flip: null,
            h: null,
            s: null,
            r: null
        };
        // Pre-allocate the objects
        for (let i = 0; i < size; i++) {
            this.list.push({
                f: null,
                x: null,
                flip: null,
                h: null,
                s: null,
                r: null
            });
        }
    }
    build(f, x) {
        const buildProps = this.buildProps
        buildProps.f = f
        buildProps.x = x
        buildProps.flip = null
        buildProps.h = null
        buildProps.s = null
        buildProps.r = null
        return this
    }
    flip(val) {
        this.buildProps.flip = val
        return this
    }
    dyn() {
        this.buildProps.dyn = true
        return this
    }
    h(val) {
        this.buildProps.h = val
        return this
    }
    s(val) {
        this.buildProps.s = val
        return this
    }
    r(val) {
        this.buildProps.r = val
        return this
    }
    exec() { // exec build
        let obj = this.list[this.lastIdx];
        this.lastIdx = (this.lastIdx + 1) % this.size;
        this.totalCreated++;
        Object.assign(obj, this.buildProps)
        return obj;
    }
}
const pool = new ObjPool(28000)
const distributions = {
    // Random between xMin and xMax
    "rand": rule => rule.xMax === rule.xMin ? rule.xMin : Math.random() * (rule.xMax - rule.xMin) + rule.xMin,

    "noise": rule => {
        if (rule.delta === undefined) rule.delta = rand(0, 100);
        rule.delta += 0.05
        return (noise2d(rule.delta, 0) + 1) * 0.5 * (rule.xMax - rule.xMin) + rule.xMin
    },

    // Sine wave pattern between xMin and xMax
    "sine": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;
        const sineValue = Math.sin(rule.delta / 10);
        return rule.xMin + (rule.xMax - rule.xMin) * ((sineValue + 1) / 2);
    },

    // Cosine wave pattern between xMin and xMax
    "cosine": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;
        const cosineValue = Math.cos(rule.delta / 10);
        return rule.xMin + (rule.xMax - rule.xMin) * ((cosineValue + 1) / 2);
    },

    // Sawtooth Wave: Repeats a linear rise and sudden drop
    "sawtooth": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;
        const period = 50; // Controls the length of each cycle
        const sawValue = (rule.delta % period) / period; // Creates a ramp-up pattern between 0 and 1
        return rule.xMin + (rule.xMax - rule.xMin) * sawValue;
    },
    "combinedSine": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;

        // First sine wave parameters (Amplitude 1, Frequency 1, Phase 0)
        const sine1 = Math.sin(rule.delta / 10);

        // Second sine wave with different parameters (Amplitude 0.5, Frequency 2, Phase π/4)
        const sine2 = 0.5 * Math.sin(rule.delta / 5 + Math.PI / 4);

        // Superposition of the two waves
        const combinedSineValue = sine1 + sine2;

        // Normalize combined sine value to [0, 1] range, considering the range of [-1.5, 1.5]
        const normalizedValue = (combinedSineValue + 1.5) / 3;

        // Map to the range [xMin, xMax]
        return rule.xMin + (rule.xMax - rule.xMin) * normalizedValue;
    },
    "triangleWave": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;
        const period = rule.period || 100;
        const phase = (rule.delta % period) / period;
        const triangleValue = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
        return rule.xMin + (rule.xMax - rule.xMin) * triangleValue;
    }, // Square wave pattern oscillating sharply between xMin and xMax
    "squareWave": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;
        const period = rule.period || 20;
        return (Math.floor(rule.delta / period) % 2 === 0) ? rule.xMin : rule.xMax;
    },
    "longSquare": rule => {
        if (rule.delta === undefined) rule.delta = 0;
        rule.delta += 1;
        const period = rule.period || 50;
        return (Math.floor(rule.delta / period) % 2 === 0) ? rule.xMin : rule.xMax;
    },
}

class SegmentObjGen {
    static reset(sog) {
        // Reset properties in regular rules
        for (const rule of sog.rules) {
            rule.counter = 0;
            rule.cumDens = 0;  // Always reset to 0 since it's used for accumulation
            rule.delta = 0;    // Always reset to 0 since it's used for counting
            rule.offset = rule.offset0;  // Reset to initial offset
        }
        
        // Reset properties in dynamic rules if they exist
        if (sog.dynRules) {
            for (const rule of sog.dynRules) {
                rule.counter = 0;
                rule.cumDens = 0;
                rule.delta = 0;
                rule.offset = rule.offset0;
            }
        }
        
        return sog;
    }
    rules = []
    dynRules=null
    acm = (f, x, s, p) => { // accumulator
        s.push(p.build(f, x).exec())
    }
    addRule(objects, xMin, xMax = xMin, density, opts = {}) {
        try {
            opts.objects = objects;
            opts.xMin = xMin;
            opts.xMax = xMax;
            opts.density = density * COMPRESSBY;
            opts.det = opts.det === null || opts.det === undefined ? true: opts.det;
            opts.dist = opts.dist || "rand";
            opts.clus = opts.clus || 0;
            opts.stride = opts.stride || 0;
            opts.dyn = opts.dyn || false;
            opts.offset = opts.offset * COMPRESSBY || 0;
            opts.offset0 = opts.offset * COMPRESSBY || 0;  // Store initial offset
            opts.counter = 0;
            opts.cumDens = opts.det ? 0 : undefined;
            opts.delta = opts.dist !== "rand" ? 0 : undefined;

            if (opts.dyn) {
                if (!this.dynRules) this.dynRules = [];
                this.dynRules.push(opts);
            } else {
                this.rules.push(opts);
            }
        } catch (e) {
            console.log(e);
        }
    }
    addDynRule(objects, xMin, xMax = xMin, density, opts = {}) {
        opts.dyn = true
        this.addRule(objects, xMin, xMax, density, opts)
    }
    addMapper(m = (f, x) => ({ f, x })) {
        this.mapper = m
    }
    generateOne(rule, segmentObjects = []) {
        if (rule.offset > 0) {
            rule.offset--
            return segmentObjects
        }
        if (rule.det) rule.cumDens += rule.density
        if (rule.delta) rule.delta += 1
        const proceed = (rule.det ? rule.cumDens >= 1 : Math.random() < rule.density) || rule.counter > 0
        if (!proceed) return segmentObjects
        if (rule.det) rule.cumDens = 0
        if (rule.clus > 0 && rule.counter === 0) rule.counter = rule.clus
        const f = Array.isArray(rule.objects) ? pickOne(rule.objects): rule.objects
        const x = distributions[rule.dist || "rand"](rule)
        this.acm(f, x, segmentObjects, pool)
        rule.offset += rule.stride

        rule.counter--
        return segmentObjects
    }
    acc(arr, rules=this.rules) {
        arr.length = 0
        for (let i = 0; i < rules.length; i++) {
            this.generateOne(rules[i], arr);
        }
    }
    accDyn(arr) {
        if (!this.dynRules) {
            arr.length = 0
            return
        }
        return this.acc(arr, this.dynRules)
    }
}

export const createAcm = ({ rightFlips, leftFlips, scaleMap, mirrorMap, heightMap, customAcm, frameMap }) => {
    return (f, x, sink, pool) => {
        if (customAcm) {
            const lastLen = sink.length
            customAcm(f, x, sink, pool)
            if (sink.length > lastLen) return
        }
        const rf = frameMap && frameMap[f] ? (Array.isArray(frameMap[f]) ? pickOne(frameMap[f]): frameMap[f]): f
        const obj = pool.build(rf, x).exec()
        if (heightMap && heightMap[f]) {
            obj.h = heightMap[f]
        }
        const scale = scaleMap && scaleMap[f]
        if (scale) {
            obj.s = Array.isArray(scale) ? pickOne(scale): scale
        }
        if (rightFlips && (Array.isArray(rightFlips) ? rightFlips.includes(f): rightFlips.has(f)) && x > 0) {
            obj.flip = true
        } else if (leftFlips && (Array.isArray(leftFlips) ? leftFlips.includes(f): leftFlips.has(f)) && x < 0) {
            obj.flip = true
        } else if (mirrorMap && mirrorMap[f]) {
            const dx = mirrorMap[f]
            obj.flip = true
            obj.x += dx
            const obj2 = pool
                .build(rf, x - dx)
                .s(obj.s)
                .h(obj.h)
                .exec()
            obj.flip = true
            sink.push(obj)
            sink.push(obj2)
            return
        }
        sink.push(obj)
    }
}
export default SegmentObjGen