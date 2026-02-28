type EasingFns = {
    [Key: string]: (x: number, f?: number) => number
}
let seed = 0
export const randomSeed = (newSeed: number) => {
    seed = newSeed
}
export const seededRand = (to: number = 1, from = 0) => {
    seed = (seed * 9301 + 49297) % 233280
    const rnd = seed / 233280
    return from + Math.floor((to - from + 1) * rnd)
}
export const rand = (to: number, from = 0) => from + Math.floor((to - from + 1) * Math.random())

export const randf = (to: number, from = 0) => from + (to - from) * Math.random()

export const skewedRand = (to: number, from = 0) => from + Math.floor((to - from + 1) * Math.random() * Math.random())

export const pickOne = <EntryType>(array: Array<EntryType>) => array[rand(array.length - 1)]

export const clamp = (from = 0, to = 1, numToClamp: number) => Math.min(to, Math.max(from, numToClamp))

export const sign = (num: number) => num === 0 ? 1 : num / Math.abs(num)

export const lerp = (from: number, to: number, num: number) => (num - from) / (to - from)

export const stripFloat = (num: number, place: number) => Math.floor(num * place) / place

export const roundFloat = (num: number, place: number) => Math.round(num * place) / place

export const len = (x: number, y: number) => Math.sqrt(x * x + y * y)

export const sqLen = (x: number, y: number) => x * x + y * y

export const calcNormal = (x: number, y: number) => { // computes perpendicular components
    const length = len(x, y)
    return { x: y / length, y: -x / length }
}

export const normalize = (x: number, y: number) => { // returns unit vector
    const magnitude = len(x, y)
    return { x: x / magnitude, y: y / magnitude }
}

export const easingFns: EasingFns = {
    linear(x) {
        return x
    },
    quadIn(x) {
        return x * x
    },
    quadOut(x) {
        return 1 - (1 - x) * (1 - x)
    },
    quadInOut(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    },
    cubicIn(x) {
        return x * x * x
    },
    cubicOut(x) {
        return 1 - (1 - x) * (1 - x) * (1 - x)
    },
    cubicInOut(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    },
    quartIn(x) {
        return x * x * x * x
    },
    quartOut(x) {
        return 1 - Math.pow(1 - x, 4)
    },
    quartInOut(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2
    },
    quintIn(x) {
        return x * x * x * x * x
    },
    quintOut(x) {
        return 1 - Math.pow(1 - x, 5)
    },
    quintInOut(x) {
        return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2
    },
    sineIn(x) {
        return 1 - Math.cos((x * Math.PI) / 2)
    },
    sineOut(x) {
        return Math.sin((x * Math.PI) / 2)
    },
    sineInOut(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2
    },
    expoIn(x) {
        return x === 0 ? 0 : Math.pow(2, 10 * (x - 1))
    },
    expoOut(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
    },
    expoInOut(x) {
        if (x === 0) return 0
        if (x === 1) return 1
        if (x < 0.5) return Math.pow(2, 20 * x - 10) / 2
        return (2 - Math.pow(2, -20 * x + 10)) / 2
    },
    circIn(x) {
        return 1 - Math.sqrt(1 - x * x)
    },
    circOut(x) {
        return Math.sqrt(1 - Math.pow(x - 1, 2))
    },
    circInOut(x) {
        return x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2
    },
    backIn(x) {
        const c = 1.70158
        return (c + 1) * x * x * x - c * x * x
    },
    backOut(x) {
        const c = 1.70158
        return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
    },
    backInOut(x) {
        const c = 1.70158 * 1.525
        return x < 0.5
            ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2
            : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2
    },
    elasticIn(x) {
        const c = (2 * Math.PI) / 3
        return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c)
    },
    elasticOut(x) {
        const c = (2 * Math.PI) / 3
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c) + 1
    },
    elasticInOut(x) {
        const c = (2 * Math.PI) / 4.5
        return x === 0 ? 0 : x === 1 ? 1 : x < 0.5
            ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c)) / 2
            : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c)) / 2 + 1
    },
    bounceIn(x) {
        return 1 - easingFns.bounceOut(1 - x)
    },
    bounceOut(x) {
        const n = 7.5625
        const d = 2.75

        if (x < 1 / d) {
            return n * x * x
        } else if (x < 2 / d) {
            return n * (x -= 1.5 / d) * x + 0.88  // Was 0.75 - less dip
        } else if (x < 2.5 / d) {
            return n * (x -= 2.25 / d) * x + 0.97  // Was 0.9375 - less dip
        } else {
            return n * (x -= 2.625 / d) * x + 0.995  // Was 0.984375 - less dip
        }
    },
    bounceInOut(x) {
        return x < 0.5
            ? (1 - easingFns.bounceOut(1 - 2 * x)) / 2
            : (1 + easingFns.bounceOut(2 * x - 1)) / 2
    },
    smoothStep(x) {
        return x * x * (3 - 2 * x)
    },
    smootherStep(x) {
        return x * x * x * (x * (x * 6 - 15) + 10)
    },
    step(x) {
        return x < 1 ? 0 : 1
    },
    lateCommit(x) {
        return x * x / (x * x + (1 - x))
    },
    earlyCommit(x) {
        const y = 1 - x
        return 1 - (y * y / (y * y + (1 - y)))
    },
    quantStep(x) {
        return x === 1 ? 1 : Math.floor(x * 3) / 3
    },
    powerStep(x) {
        const a = x * x
        const b = (1 - x) * (1 - x)
        return a / (a + b)
    },
    powerStepSharp(x) {
        const a = x * x * x * x
        const b = (1 - x) * (1 - x) * (1 - x) * (1 - x)
        return a / (a + b)
    },
    powerStep4(x) {
        const a = x * x; const b = (1 - x) * (1 - x)
        return (a * a) / (a * a + b * b)
    },
    segmentedLinear(x, steps = 3) {
        const s = 1 / steps
        const i = Math.floor(x / s)
        const t = (x - i * s) / s
        return (i + t) * s
    },
    criticallyDamped(x: number) {
        return 1 - Math.exp(-6 * x) - 6 * x * Math.exp(-6 * x);
    },
    spring(x: number) {
        return 1 + (-Math.exp(-6.9 * x) * Math.cos(-20 * x));
    },
    slingshot(x: number) {
        return x < 0.5
            ? 4 * x * x * x - 0.5 * x  // Anticipation
            : 1 - Math.pow(-2 * x + 2, 3) / 2; // Soft landing
    },
    staircase(x: number) {
        const steps = 5; // Configurable
        return (Math.floor(x * steps) + easingFns.cubicInOut((x * steps) % 1)) / steps;
    },
    staircase12(x: number) {
        const steps = 12; // Configurable
        return (Math.floor(x * steps) + easingFns.cubicInOut((x * steps) % 1)) / steps;
    }
}
/**
 * Distributes event start times uniformly in a given interval.
 * @param overallDuration Total interval duration
 * @param eventDuration Duration of each event
 * @param numEvents Number of events
 * @param mode "space-between" (default) or "space-around"
 * @returns Array of start times (ascending)
 */
export function distributeEventStartTimes(
    overallDuration: number,
    eventDuration: number,
    numEvents: number,
    mode: "space-between" | "space-around" | "ease-quad" | "ease-cubic" | "ease-sine" = "space-between"
): number[] {
    if (numEvents <= 0) return [];
    if (numEvents === 1) {
        if (mode === "space-around") {
            return [Math.max(0, (overallDuration - eventDuration) / 2)];
        }
        return [0];
    }
    if (overallDuration <= eventDuration) {
        return Array(numEvents).fill(0);
    }

    // Handle linear distribution modes
    if (mode === "space-between") {
        // First at 0, last at overallDuration - eventDuration
        const interval = (overallDuration - eventDuration) / (numEvents - 1);
        return Array.from({ length: numEvents }, (_, i) =>
            +(i * interval).toFixed(8)
        );
    } else if (mode === "space-around") {
        // space-around: equal gap at both ends and between events
        const totalEventsDuration = eventDuration * numEvents;
        const totalGap = overallDuration - totalEventsDuration;
        const gap = totalGap / (numEvents + 1);
        return Array.from({ length: numEvents }, (_, i) =>
            +(gap * (i + 1) + eventDuration * i).toFixed(8)
        );
    }

    // Handle easing distribution modes
    const maxStart = overallDuration - eventDuration;

    // Generate normalized positions (0 to 1) for each event
    const normalizedPositions = Array.from({ length: numEvents }, (_, i) => {
        if (numEvents === 1) return 0;
        return i / (numEvents - 1);
    });

    // Apply easing function based on mode (all use ease-in-out)
    const easedPositions = normalizedPositions.map(t => {
        switch (mode) {
            case "ease-quad":
                // Quadratic ease-in-out
                return t < 0.5
                    ? 2 * t * t
                    : 1 - Math.pow(-2 * t + 2, 2) / 2;

            case "ease-cubic":
                // Cubic ease-in-out
                return t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;

            case "ease-sine":
                // Sine ease-in-out
                return -(Math.cos(Math.PI * t) - 1) / 2;

            default:
                return t; // Linear fallback
        }
    });

    // Convert eased positions to actual start times
    return easedPositions.map(pos => +(pos * maxStart).toFixed(8));
}

export function getGlobalBBox(element: SVGGraphicsElement | HTMLElement): DOMRect {
    // This branch handles non-SVG elements like <div>s.
    if (!('getBBox' in element) || !element.ownerSVGElement) {
        const elementRect = element.getBoundingClientRect();

        const container = document.querySelector('#CONTAINERX') as HTMLElement;

        if (!container) {
            console.error(
                "CRITICAL ERROR: Could not find container with ID '#CONTAINERX'. Returning viewport-relative coordinates."
            );
            return elementRect;
        }

        const containerRect = container.getBoundingClientRect();

        // --- THIS IS THE CRITICAL FIX FOR SCALING ---

        // 1. Calculate the current scale factor of the Remotion player.
        // `offsetWidth` is the element's true layout width (e.g., 1920).
        // `getBoundingClientRect().width` is its visual, scaled-down width on screen.
        const scale = container.offsetWidth
            ? containerRect.width / container.offsetWidth
            : 1;

        // If scale is 0 or invalid, we can't proceed.
        if (!scale || !isFinite(scale)) {
            return new DOMRect(0, 0, 0, 0);
        }

        // 2. Calculate the element's position relative to the container's top-left.
        const relativeLeft = elementRect.left - containerRect.left;
        const relativeTop = elementRect.top - containerRect.top;

        // 3. Un-scale the relative position AND the element's size to get the
        //    true coordinates and dimensions within the composition's native resolution.
        return new DOMRect(
            relativeLeft / scale,
            relativeTop / scale,
            elementRect.width / scale,
            elementRect.height / scale
        );
        // ---------------------------------------------
    }

    // The SVG logic below is already correct because getBBox() and getCTM()
    // operate in the SVG's un-scaled coordinate space. It does not need changes.
    const bbox = element.getBBox();
    const ctm = element.getCTM();

    if (!ctm) {
        return new DOMRect(bbox.x, bbox.y, bbox.width, bbox.height);
    }

    const svg = element.ownerSVGElement;
    if (!svg) {
        console.warn('Element is not part of an SVG document.');
        return new DOMRect(bbox.x, bbox.y, bbox.width, bbox.height);
    }

    let p1 = svg.createSVGPoint();
    p1.x = bbox.x;
    p1.y = bbox.y;

    let p2 = svg.createSVGPoint();
    p2.x = bbox.x + bbox.width;
    p2.y = bbox.y;

    let p3 = svg.createSVGPoint();
    p3.x = bbox.x;
    p3.y = bbox.y + bbox.height;

    let p4 = svg.createSVGPoint();
    p4.x = bbox.x + bbox.width;
    p4.y = bbox.y + bbox.height;

    p1 = p1.matrixTransform(ctm);
    p2 = p2.matrixTransform(ctm);
    p3 = p3.matrixTransform(ctm);
    p4 = p4.matrixTransform(ctm);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}