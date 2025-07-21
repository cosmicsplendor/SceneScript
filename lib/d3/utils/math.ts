type EasingFns = {
    [Key: string]: (x: number) => number
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
        return 1 - (x - 1) * (x - 1)
    },
    quadInOut(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    },
    cubicIn(x) {
        return x * x * x
    },
    cubicOut(x) {
        return 1 - (1 - x) * (1 - x) * (1 - x)
    },
    cubicInOut(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    },
    sineIn(x) {
        return 1 - Math.cos((x * Math.PI) / 2);
    },
    sineOut(x) {
        return Math.sin((x * Math.PI) / 2);
    },
    sineOutHoldDouble(x) {
        if (x <= 1 / 3) {
            return Math.sin((x * 3 * Math.PI) / 2);
        } else {
            return 1;
        }
    },
    sineOutHoldThird(x) {
        if (x <= 2 / 3) {
            // Map the first 2/3 (from 0 to 2/3) to the full sine curve (0 to 1)
            const normalizedX = x / (2 / 3);
            return Math.sin((normalizedX * Math.PI) / 2);
        } else {
            return 1;
        }
    },
    sineOutHoldTenth(x) {
        if (x <= 9 / 10) {
            // Map the first 9/10 (from 0 to 9/10) to the full sine curve (0 to 1)
            const normalizedX = x / (9 / 10);
            return Math.sin((normalizedX * Math.PI) / 2);
        } else {
            return 1;
        }
    },
    linearHold(x) {
        if (x <= 9 / 10) {
            return x * 10 / 9;
        } else {
            return 1;
        }
    },
    smoothHold(x) {
        if (x <= 9 / 10) {
            // Map x from [0, 9/10] to [0, 1] and apply smoothStep
            const t = x / (9 / 10);
            return t * t * (3 - 2 * t);
        } else {
            return 1;
        }
    },
    sineOutHold(x) {
        if (x <= 0.5) {
            return Math.sin((x * 2 * Math.PI) / 2);
        } else {
            return 1;
        }
    },

    sineInOutHold(x) {
        if (x <= 0.5) {
            return -(Math.cos(Math.PI * x * 2) - 1) / 2;
        } else {
            return 1;
        }
    },
    sineInOut(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    },
    smoothStep(x) {
        return x * x * (3 - 2 * x)
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