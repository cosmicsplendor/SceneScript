import { clamp, rand, skewedRand } from "./math"

const validateOrientation = mode => mode === "landscape" || mode === "portrait"
export const orient = mode => {
    const isValid = validateOrientation(mode)
    if (!isValid) {
        throw new Error(`Requested an invalid orientation mode: ${mode}`)
    }
    try {
        const curMode = screen.orientation
        const modeRegex = new RegExp(`${mode}`)
        if (modeRegex.test(curMode)) {
            return
        }
        screen.orientation.lock(mode).catch(() => { })
    } catch (e) { }
}
export const wait = s => {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000)
    })
}
class Maxima {
    data = {}
    constructor() {
        this.prevHeight = null;  // To track the previous height
        this.prevSlope = null;   // To track the previous slope
    }
    lastMinima = 0
    update(currentHeight, i) {
        let extremum = false;
        if (this.prevHeight !== null) {
            const currentSlope = currentHeight - this.prevHeight;
            if (this.prevSlope !== null) {
                if (this.prevSlope > 0 && currentSlope < 0) {
                    extremum = this.data
                    extremum.type = 'maxima';
                    extremum.value = this.prevHeight - this.lastMinima;
                    extremum.i = i;
                } else if ((this.prevSlope === 0 && currentSlope < 0) || (this.prevSlope > 0 && currentSlope === 0)) {
                    extremum = this.data;
                    extremum.type = "inflection";
                    extremum.val = currentSlope - this.prevSlope;
                    extremum.i = i;
                    extremum.dir = this.prevSlope > 0 && currentSlope === 0 ? 1 : -1;
                } else if (this.prevSlope < 0 && currentSlope > 0) {
                    this.lastMinima = currentHeight
                }
            }
            this.prevSlope = currentSlope;
        }
        this.prevHeight = currentHeight;
        return extremum;
    }
}

const getGenIters = gen => {
    return Math.floor(gen.fixed ? gen.expanse * 1.3 : skewedRand(gen.expanse * 1.125, gen.expanse * 1.4))
}
const getReps = reps => {
    if (Array.isArray(reps)) return rand(reps[1], reps[0]) - 1
    return reps - 1 || 0
}
export class SegmentGenerator {
    constructor(graph, gen0, regen) {
        this.graph = graph;
        this.regen = regen
        // Define transition matrix for curve generators in sparse format
        const curveMat = {
            "straight": {
                "straight": 1,  // reduced from 0.4
                "bluntLeftSine": 0,  // increased from 0.3
                "bluntRightSine": 0  // increased from 0.3
            },
            "bluntLeftSine": {
                "transition": 0.2,  // reduced from 0.3
                "bluntLeftSine": 0.5,  // increased from 0.4
                "leftSine": 0.3
            },
            "bluntRightSine": {
                "transition": 1,  // reduced from 0.3
                "bluntRightSine": 0.5,  // increased from 0.4
                "rightSine": 0.3
            },
            "leftSine": {
                "transition": 1,
            },
            "rightSine": {
                "transition": 1,
            },
            "transition": {
                "straight": 1
            }
        };
        this.curveMarkov = new MarkovChain(curveMat, null, "straight");

        // Define transition matrix for profile generators in sparse format
        const profileMat = {
            "straight": {
                "straight": 0.4,
                // "uRamp": 0.1,
                // platform: 0.1,
                "mountainPass": 0.1,
                "volcano": 0.1,
                "q1": 0.2,
                "q4": 0.2,
                ramp: 0.00000001
            },
            "q1": {
                "q3": 0.6,
                "down": 0.4
            },
            "q2": {
                "straight": 0.35,
                "uRamp": 0.1,
                platform: 0.1,
                "mountainPass": 0.1,
                "volcano": 0.1,
                "q4": 0.125,
                "q1": 0.125
            },
            "q3": {
                "straight": 0.35,
                "uRamp": 0.1,
                platform: 0.1,
                "mountainPass": 0.1,
                "volcano": 0.1,
                "q4": 0.125,
                "q1": 0.125
            },
            "q4": {
                "up": 0.5,
                "q2": 0.5,
            },
            "down": {
                "q3": 1.0
            },
            "up": {
                "q2": 1
            },
            "uRamp": {
                straight: 1
            },
            "platform": {
                straight: 1
            },
            "ramp": {
                straight: 1,
            },
            "volcano": {
                ramp: 0.25,
                straight: 0.75
            },
            "mountainPass": {
                straight: 1
            },
        };
        this.profileMarkov = new MarkovChain(profileMat, null, "straight");

        this.curGen = graph.get(gen0);
        this.firstGenerator = this.curGen;
        this.switchAfter = getGenIters(this.curGen);
        this.repsLeft = getReps(this.curGen.reps)
        this.itersLeft = this.switchAfter;
        this.lastGenHeight = 0;

        // Initialize current curve generator
        this.currentCurveGenerator = this.curGen.curvature ||
            this.curveMarkov.getCurrentState();

        // Initialize current profile generator
        this.curProfileFn = this.curGen.profile || "straight"
        // Variables to keep track of previous values for smoothing
        this.prevHeight = 0;
        this.prevCurve = 0;
        this.hsf = 1; // Base smoothing factor for height increases
        this.csf = 0.75;

        // Track total segments generated
        this.totalGenerated = 0;

        // Instantiate the Maxima class to track local maxima and minima
        this.maximaTracker = new Maxima();
        this.road = this.curGen.road;
        this.vibe = this.curGen.vibe;
        this.prlx = this.curGen.prlx
        this.laneData = this.curGen.laneData
        this.genChanged = true; // Flag to indicate we need to send ambience (road and vibe) in next segment

    }
    reset() {
        // Set the new generator as the current and first generator
        this.curGen = this.graph.get(this.regen)
        if (this.curGen && this.curGen.reset) this.curGen.reset()
        this.firstGenerator = this.curGen

        // Reset iteration parameters based on the new generator
        this.switchAfter = getGenIters(this.curGen)
        this.repsLeft = getReps(this.curGen.reps)
        this.itersLeft = this.switchAfter

        // Reset state tracking variables
        this.lastGenHeight = 0
        this.prevHeight = 0
        this.prevCurve = 0
        this.totalGenerated = 0

        // Reset the current curve and profile generators using the new generator's settings.
        // Use the curvature specified in curGen if available, otherwise fall back on the curveMarkov chain.
        this.currentCurveGenerator = this.curGen.curvature || this.curveMarkov.getCurrentState()
        // Similarly, use the profile from curGen if available, otherwise default to "straight"
        this.curProfileFn = this.curGen.profile || "straight"

        // Re-instantiate the maximaTracker (assuming it does not have its own reset method)
        this.maximaTracker = new Maxima()

        // Update any ambience and lane data properties based on the new generator
        this.road = this.curGen.road
        this.vibe = this.curGen.vibe
        this.prlx = this.curGen.prlx
        this.laneData = this.curGen.laneData

        // Flag that the generator has changed so that ambience will be included in the next segment
        this.genChanged = true
    }
    acc(obj = { o: [], do: [] }) {
        if (this.itersLeft <= 0) {
            const nextGenerator = this.repsLeft > 0 ? this.curGen : this.graph.getNextGenerator(this.curGen) || this.firstGenerator;
            this.genChanged = this.repsLeft > 0 ? false : true;
            if (this.genChanged) {
                nextGenerator.reset && nextGenerator.reset()
            }
            this.repsLeft = this.repsLeft > 0 ? this.repsLeft - 1 : getReps(nextGenerator.reps)
            this.lastGenHeight = this.prevHeight;
            this.lastGenCurve = this.prevCurve;
            this.curGen = nextGenerator;
            this.road = nextGenerator.road ?? this.road;
            this.vibe = nextGenerator.vibe ?? this.road;
            this.laneData = nextGenerator.laneData
            this.prlx = nextGenerator.prlx
            this.lastGenSlope = this.maximaTracker.prevSlope;

            this.currentCurveGenerator = this.curveMarkov.getNextState(this.curGen.curvature);
            this.curProfileFn = this.curGen.fixed && this.curGen.profile ? this.curGen.profile : this.profileMarkov.getNextState(this.curGen.profile);
            // console.log(this.curGen.name, this.curProfileFn, this.curGen.profile)
            this.switchAfter = getGenIters(this.curGen);
            this.itersLeft = this.switchAfter;
        }
        // Get the profile function with fallback
        const profileFn = HG[this.curProfileFn] || HG.straight;

        // Use current curve generator
        const curvatureFn = CG[this.currentCurveGenerator] || CG.straight;

        // Generate the current values using current position in generator cycle (0 to switchAfter-1)
        const currentPos = (this.switchAfter - this.itersLeft);
        const currentHeight = profileFn(currentPos, this.switchAfter, this.curGen.amplitude, this.lastGenHeight, this.lastGenSlope);
        const currentCurve = curvatureFn(currentPos, this.switchAfter, this.lastGenCurve);

        // Smooth the values by linearly interpolating with the previous values
        const smoothedHeight = this.prevHeight + this.hsf * (currentHeight - this.prevHeight);
        const smoothedCurve = this.prevCurve + this.csf * (currentCurve - this.prevCurve);

        // Track local maxima and minima based on slopes
        const extremaInfo = this.maximaTracker.update(smoothedHeight, this.totalGenerated + 1);

        // Update previous values for the next iteration
        this.prevHeight = smoothedHeight;
        this.prevCurve = smoothedCurve;
        obj.z = this.totalGenerated + 1;
        obj.h = smoothedHeight;
        this.curGen.acc(obj.o);
        this.curGen.accDyn(obj.do);
        obj.curve = smoothedCurve;

        // Include ambience in first segment after a change
        if (this.genChanged) {
            obj.vibe = this.vibe;
            obj.road = this.road;
            obj.laneData = this.laneData
            obj.prlx = this.prlx
            obj.bound = true
            this.genChanged = false;
        } else {
            obj.vibe = null
            obj.road = null
            obj.laneData = null
            obj.prlx = null
            obj.bound = false
        }
        obj.extrema = extremaInfo ? extremaInfo : null;
        this.itersLeft--
        this.totalGenerated++
        obj.z = this.totalGenerated
        return obj
    }
}

class MarkovChain {
    constructor(transitionMatrix, states = null, initialState = null) {
        this.transitionMatrix = transitionMatrix;
        this.states = states || Object.keys(transitionMatrix);
        this.currentState = initialState || this.states[Math.floor(Math.random() * this.states.length)];
    }

    getNextState(preferredState = null) {
        const transitions = this.transitionMatrix[this.currentState];

        // If there's a preferred state and it's allowed (non-zero probability)
        if (preferredState && transitions[preferredState]) {
            this.currentState = preferredState;
            return preferredState;
        }

        // Check if we can transition to a state that leads to the preferred state
        if (preferredState) {
            for (const nextState in transitions) {
                if (this.transitionMatrix[nextState][preferredState]) {
                    this.currentState = nextState;
                    return nextState;
                }
            }
        }

        // Otherwise use probability distribution
        const rand = Math.random();
        let cumulativeProbability = 0;

        for (const [nextState, probability] of Object.entries(transitions)) {
            cumulativeProbability += probability;
            if (rand < cumulativeProbability) {
                this.currentState = nextState;
                return nextState;
            }
        }

        // Fallback to first available transition
        const fallbackState = Object.keys(transitions)[0];
        this.currentState = fallbackState;
        return fallbackState;
    }

    getCurrentState() {
        return this.currentState;
    }
}


export const CG = {
    leftSine: (i, length) => {
        const x = Math.PI * 0.5 * i / length
        return -0.008 * Math.sin(x)
    },
    rightSine: (i, length) => {
        const x = Math.PI * 0.5 * i / length
        return 0.008 * Math.sin(x)
    },
    bluntLeftSine: (i, length) => {
        const x = Math.PI * 0.5 * i / length
        return -0.004 * Math.sin(x)
    },
    bluntRightSine: (i, length) => {
        const x = Math.PI * 0.5 * i / length
        return 0.004 * Math.sin(x)
    },
    transition: (i, length, lastGenCurve = 0) => {
        const t = (i + 1) / length;

        // Quintic ease in/out implementation
        const eased = t < 0.5
            ? 16 * t * t * t * t * t
            : 1 - (((-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2))) / 2;

        // Apply transition
        return lastGenCurve * (1 - eased);
    },
    straight: () => {
        return 0
    },
}

export const HG = {
    straight(i, length, amplitude, lastGenHeight = 0) {
        return lastGenHeight;
    },
    up(i, length, amplitude = 1500, lastGenHeight, lastGenSlope) {
        const x = i / length;
        return lastGenHeight + 0.2 * ((lastGenSlope * (i + 1)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
    down(i, length, amplitude = 1500, lastGenHeight, lastGenSlope) {
        const x = i / length;
        return lastGenHeight + 0.2 * ((lastGenSlope * (i + 1)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
    q1(i, length, amplitude = 1500, lastGenHeight = 0) {
        const x = i / length;
        const y = ((i) / length) * 0.5 * Math.PI;
        return lastGenHeight + 0.2 * ((-amplitude + amplitude * Math.sin(y + Math.PI * 0.5)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
    q2(i, length, amplitude = 1500, lastGenHeight = 0) {
        const x = i / length;
        const y = ((i + 1) / length) * 0.5 * Math.PI;
        return lastGenHeight + 0.2 * ((amplitude * Math.sin(y)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
    q3(i, length, amplitude = 1500, lastGenHeight = 0) {
        const x = i / length;
        const y = ((i + 1) / length) * 0.5 * Math.PI;
        return lastGenHeight + 0.2 * ((amplitude * Math.sin(y + Math.PI)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
    q4(i, length, amplitude = 1500, lastGenHeight = 0) {
        const x = i / length;
        const y = ((i + 1) / length) * 0.5 * Math.PI;
        return lastGenHeight + 0.2 * ((amplitude + amplitude * Math.sin(y + 1.5 * Math.PI)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
    volcano(i, length, amplitude = 1500, lastGeneratorHeight = 0) {
        const x = i / length;
        const normalizedI = i / length;
        const shape = 1 - Math.abs(2 * normalizedI - 1);
        // Reduce peak height with a smaller coefficient (0.15 instead of 0.28)
        // Add an asymmetric component using Math.pow(x, 3) to create deeper valleys
        return lastGeneratorHeight + ((clamp(1000, 2000, amplitude) * Math.pow(shape, 2)) * Math.pow(Math.sin(Math.PI * x), 2))
            - 850 * Math.pow(shape, 3);
    },
    uRamp(i, length, amplitude = 1500, lastGeneratorHeight = 0) {
        const x = i / length;
        // Smooth transition using cubic bezier-like curve
        // This ensures zero slopes at x=0 and x=1
        const smoothStep = x * x * (3 - 2 * x);
        // Create asymmetric descent using modified sigmoid
        const descent = Math.pow(smoothStep, 0.6) * (1 - Math.pow(x, 2));

        return lastGeneratorHeight - clamp(1000, 2000, amplitude) * descent;
    },
    platform(i, length, amplitude = 1500, lastGeneratorHeight = 0) {
        const x = i / length;
        // Smooth transition using cubic bezier-like curve
        // This ensures zero slope at x=0
        const smoothStep = x * x * (3 - 2 * x);
        // Modified descent that maintains the minimum without rising
        const descent = Math.pow(smoothStep, 0.6);

        // Make amplitude fully respected (no clamp, direct scaling)
        return lastGeneratorHeight - amplitude * descent;
    },
    ramp(i, length, amplitude = 1500, lastGenHeight = 0) {
        const x = i / length;
        if (x < 0.75) {
            // Straight section (75%)
            return lastGenHeight;
        } else {
            // Curved ramp section (last 25%)
            const rampStart = 0.75 * length; // Start of ramp
            const progress = (i - rampStart) / (length - rampStart); // Normalize ramp progress [0, 1]
            return lastGenHeight + clamp(250, 350, amplitude * 0.2) * Math.pow(progress, 2); // Quadratic curve for smooth rise
        }
    },
    mountainPass(i, length, amplitude = 1500, lastGeneratorHeight = 0) {
        const x = i / length;
        const normalizedI = i / length;
        const t = normalizedI < 0.5 ? normalizedI * 2 : (1 - normalizedI) * 2;
        return lastGeneratorHeight + 0.75 * ((clamp(600, 900, amplitude * 0.5) * Math.pow(Math.sin(t * Math.PI / 2), 0.7)) * Math.pow(Math.sin(Math.PI * x), 2));
    },
}

export class GeneratorGraph {
    constructor(nodes = new Map()) {
        this.nodes = nodes
        // Track locked edges for each node
        this.lockedEdges = new Map()
    }
    tempArr = []
    static _id = 0
    static _generateId() {
        this._id++
        return String(this._id)
    }
    addNode(Gen) {
        // if (Gen.id) {
        //     console.log(Gen, Gen.id, this.nodes.get(Gen.id))
        //     throw new Error("Adding duplicate node: ")
        // }
        const generator = new Gen()
        Gen.id = GeneratorGraph._generateId()
        generator.id = Gen.id
        this.nodes.set(generator.id, { generator: generator, edges: [] })
        this.lockedEdges.set(generator.id, new Set())
    }

    addNodes(Gens) {
        Gens.forEach(Gen => {
            this.addNode(Gen)
        })
    }

    addEdge(FromGen, ToGen) {
        const fromNode = this.nodes.get(FromGen.id)

        if (!fromNode) throw new Error(`Invalid fromNode: ${FromGen}`)
        if (!this.nodes.get(ToGen.id)) throw new Error(`Invalid toNode: ${ToGen}`)

        fromNode.edges.push(ToGen.id)
    }

    addEdges(FromGen, ToGens) {
        ToGens.forEach(ToGen => {
            this.addEdge(FromGen, ToGen)
        })
    }

    get(constructor) {
        return this.nodes.get(
            constructor.id
        ).generator
    }

    getNextGenerator(curGen) {
        const nodeId = curGen.id
        const node = this.nodes.get(nodeId)
        if (!node || node.edges.length === 0) return null

        // Get locked edges for this node
        const locked = this.lockedEdges.get(nodeId)
        const edges = node.edges

        // If all edges are locked, reset the locks for this node
        if (locked.size === edges.length) {
            locked.clear()
        }

        // Optimization: avoid heap allocation and reuse temp array
        const { tempArr: avEdges } = this
        avEdges.length = 0
        // Accumulate available (unlocked) edges into avEdges
        for (let i = 0; i < edges.length; i++) {
            if (!locked.has(edges[i])) {
                avEdges.push(edges[i]);
            }
        }
        if (avEdges.length === 0) return null; // Shouldn't happen due to reset above
        // Randomly select an edge from the available ones
        const selectedEdge = this.pickOne(avEdges);

        // Lock the selected edge
        locked.add(selectedEdge)

        // Return the generator corresponding to the selected edge
        return this.nodes.get(selectedEdge).generator
    }

    // Helper function to randomly pick one item from an array
    pickOne(array) {
        return array[Math.floor(Math.random() * array.length)]
    }

    static merge(...graphs) {
        const mergedNodes = new Map();
        const mergedLockedEdges = new Map();
        for (const graph of graphs) {
            // Merge nodes
            for (const [key, value] of graph.nodes) {
                if (mergedNodes.has(key)) {
                    throw new Error(`Duplicate node key found during merge: ${key}`);
                }
                mergedNodes.set(key, value);
            }

            // Merge lockedEdges
            for (const [key, lockedSet] of graph.lockedEdges) {
                if (!mergedLockedEdges.has(key)) {
                    mergedLockedEdges.set(key, new Set(lockedSet));
                } else {
                    const existingLockedSet = mergedLockedEdges.get(key);
                    lockedSet.forEach(edge => existingLockedSet.add(edge));
                }
            }
        }

        const mergedGraph = new GeneratorGraph(mergedNodes);
        mergedGraph.lockedEdges = mergedLockedEdges; // Update lockedEdges
        return mergedGraph;
    }
}