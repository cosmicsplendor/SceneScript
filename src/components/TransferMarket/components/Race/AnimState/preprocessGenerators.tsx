import {
    AnimationData,
    ObjectDefinition,
    ObjectKeyframe,
    ObjectInitial
} from ".";

// --- Types specific to the Generator System ---

type Expression<T> = string | T;

interface GeneratorVariable {
    [key: string]: Expression<number | string | boolean>;
}

// Mapped version of ObjectInitial that accepts expressions
type InitialTemplate = {
    [K in keyof ObjectInitial]: K extends 'pos' | 'anchor'
    ? { x?: Expression<number>; y?: Expression<number>; z?: Expression<number> }
    : Expression<ObjectInitial[K]>;
};

// Mapped version of ObjectKeyframe that accepts expressions
type KeyframeTemplate = {
    [K in keyof ObjectKeyframe]: K extends 'Position'
    ? { x?: Expression<number>; y?: Expression<number>; z?: Expression<number> }
    : Expression<ObjectKeyframe[K]>;
};

export interface GeneratorDefinition {
    IDPrefix: string;
    Count: number;
    Seed?: number; // Optional custom seed per generator
    Variables?: GeneratorVariable;
    Initial?: InitialTemplate;
    Keyframes?: KeyframeTemplate[];
}

// Extend existing types to allow the input data to contain Generators
// --- Helper: Deterministic Random Number Generator (LCG) ---
function createRNG(seed: number) {
    return function () {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

// --- Helper: Expression Evaluator ---
type EvalContext = {
    i: number;      // Current Index
    n: number;      // Total Count
    vars: any;      // Calculated variables
    rng: () => number;
    rndRange: (min: number, max: number) => number;
};

function evaluate(expr: any, ctx: EvalContext): any {
    if (typeof expr !== 'string') return expr;

    // 1. Optimization: If it's purely a number string "123", return number
    // Be careful: if your frames are named "1", "2", this will convert them to numbers.
    // If frames MUST be strings, you might want to remove this or check property names.
    if (expr.trim().length > 0 && !isNaN(Number(expr))) return Number(expr);

    try {
        // 2. Try to evaluate as code
        const body = expr.includes('return') ? expr : `return ${expr};`;
        const func = new Function('i', 'n', 'vars', 'rng', 'rndRange', 'Math', body);
        return func(ctx.i, ctx.n, ctx.vars, ctx.rng, ctx.rndRange, Math);
    } catch (e) {
        // 3. Fallback: If evaluation failed (e.g. ReferenceError because it's just a word),
        // assume it is a raw string value (like a Frame ID or Clip name).
        return expr;
    }
}

// --- Helper: Recursive Object Resolver ---
// Traverses the template (Initial/Keyframes) and resolves all strings to values
function deepResolve(source: any, ctx: EvalContext): any {
    if (source === null || source === undefined) return source;

    if (Array.isArray(source)) {
        return source.map(item => deepResolve(item, ctx));
    }

    if (typeof source === 'object') {
        const result: any = {};
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                // Special handling: don't evaluate keys, only values
                // Recursively resolve children
                result[key] = deepResolve(source[key], ctx);
            }
        }
        return result;
    }

    // It's a primitive (string, number, boolean)
    return evaluate(source, ctx);
}

// --- Main Processor Function ---

export default (animationData: AnimationData): AnimationData => {
    if (!animationData.Sequence || animationData.NoGen) return animationData;

    for (const event of animationData.Sequence) {
        // Skip if no generators defined
        if (!event.Generators || event.Generators.length === 0) continue;

        // Ensure Objects array exists
        if (!event.Objects) event.Objects = [];

        // Process each Generator definition
        const generatedObjects: ObjectDefinition[] = event.Generators.flatMap(cmd => {
            const results: ObjectDefinition[] = [];

            // Use provided seed or default based on string hash of prefix for stability
            const seed = cmd.Seed || 12345;
            const rng = createRNG(seed);
            const rndRange = (min: number, max: number) => min + (rng() * (max - min));

            for (let i = 0; i < cmd.Count; i++) {
                const ctx: EvalContext = { i, n: cmd.Count, vars: {}, rng, rndRange };

                // 1. Resolve Variables (Contextual math)
                if (cmd.Variables) {
                    for (const [key, val] of Object.entries(cmd.Variables)) {
                        ctx.vars[key] = evaluate(val, ctx);
                    }
                }

                // 2. Resolve Initial State
                let initial: ObjectInitial | undefined;
                if (cmd.Initial) {
                    initial = deepResolve(cmd.Initial, ctx);
                }

                // 3. Resolve Keyframes
                let keyframes: ObjectKeyframe[] | undefined;
                if (cmd.Keyframes && cmd.Keyframes.length > 0) {
                    keyframes = deepResolve(cmd.Keyframes, ctx);
                }

                // 4. Construct Concrete Object
                const objDef: ObjectDefinition = {
                    ID: `${cmd.IDPrefix}_${i}`,
                    Initial: initial,
                    // Generator produces a single track (ObjectKeyframe[]), 
                    // wrapped as KeyframeTrack (ObjectKeyframe[] | ObjectKeyframe[][])
                    Keyframes: keyframes ? keyframes : undefined
                };

                results.push(objDef);
            }

            return results;
        });
        // Merge generated objects into the main objects list
        event.Objects = [...event.Objects, ...generatedObjects];

        // Cleanup: Remove the Generators key so the runtime engine doesn't see it
        console.log(event.Objects)
        delete event.Generators;
    }
    return animationData;
}