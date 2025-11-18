import { ObjectKeyframe, KeyframeTrack, CameraDefinition, ObjectDefinition, CameraKeyframe } from '.';

// --- Type Definitions (with updated SequenceEvent) ---
// (omitted for brevity, assume they are the same as provided, but with this change:)
interface SequenceEvent {
    EventID: string;
    Duration: number;
    Normalize?: boolean; // NEW: Flag to control normalization
    Camera?: CameraDefinition;
    Objects?: ObjectDefinition[];
}
// ... other interfaces remain the same

/**
 * Determines if keyframes represent parallel tracks.
 * This is a utility function moved outside the class.
 */
export function isParallelTrack(keyframes: KeyframeTrack): keyframes is ObjectKeyframe[][] {
    return Array.isArray(keyframes) &&
        keyframes.length > 0 &&
        Array.isArray(keyframes[0]);
}
/**
 * Normalization Step 1: Renormalizes Keyframe Times
 * 
 * For each event where `Normalize` is true, this function:
 * 1. Scans all camera and object keyframes to find the maximum time value.
 * 2. Stretches or squashes all keyframe times so the maximum time becomes 1.0.
 * 3. Sets the event's Duration to be the max time found (rounded), effectively
 *    converting a frame-based timeline into a normalized one.
 */
/**
 * Normalization Step 1: Renormalizes Keyframe Times and Adjusts Duration
 *
 * For each event where `Normalize: true`, this function performs a two-part adjustment:
 * 1.  It proportionally scales the event's `Duration`. For example, if the highest
 *     keyframe time found is `0.95`, the new Duration will be `originalDuration * 0.95`.
 *     If the highest time is `120` (implying frames), the new Duration becomes `originalDuration * 120`.
 * 2.  It then normalizes all keyframe times by dividing them by the highest time found.
 *     This "stretches" or "squashes" the keyframe timeline so that it always ends at exactly `1.0`.
 */
/**
 * A pure function that normalizes keyframe times and scales event duration.
 *
 * If `Normalize: true`, this function performs a unified scaling operation
 * based on the maximum keyframe time (`maxTime`) found within the event:
 *
 * 1.  The event's `Duration` is ALWAYS SCALED by `maxTime`.
 *     - newDuration = originalDuration * maxTime
 *
 * 2.  All keyframe times are then normalized by dividing by `maxTime`, ensuring
 *     the animation's timeline is perfectly stretched to the 0-1 range.
 *
 * This single logic correctly handles contraction (maxTime < 1.0),
 * expansion (maxTime > 1.0), and frame-based authoring.
 */
export function renormalizeKeyframeTimes(sequence: SequenceEvent[]): SequenceEvent[] {
    // Return a new array, making this a pure transformation.
    return sequence.map(event => {
        // Only process events that are explicitly flagged for normalization.
        if (!event.Normalize) {
            return event;
        }

        // Deep copy the event to avoid modifying the original array data.
        const newEvent = JSON.parse(JSON.stringify(event));
        const originalDuration = newEvent.Duration;

        let maxTimeInEvent = 0.0;

        // 1. Find the absolute maximum time in the current event.
        if (newEvent.Camera?.Keyframes) {
            for (const timeStr in newEvent.Camera.Keyframes) {
                maxTimeInEvent = Math.max(maxTimeInEvent, parseFloat(timeStr));
            }
        }
        if (newEvent.Objects) {
            for (const objDef of newEvent.Objects) {
                if (!objDef.Keyframes) continue;
                // A simple check for parallel tracks without an external function.
                const tracks = Array.isArray(objDef.Keyframes[0])
                    ? objDef.Keyframes as ObjectKeyframe[][]
                    : [objDef.Keyframes as ObjectKeyframe[]];
                for (const track of tracks) {
                    for (const kf of track) {
                        maxTimeInEvent = Math.max(maxTimeInEvent, kf.Time);
                    }
                }
            }
        }

        // If there's no animation, return the event unmodified.
        if (maxTimeInEvent <= 0) {
            return newEvent;
        }

        const factor = maxTimeInEvent;

        // 2. UNIFIED DURATION LOGIC: Always scale the original duration.
        newEvent.Duration = Math.round(originalDuration * factor);

        // 3. Renormalize all times by the factor so the new max time is 1.0.
        if (newEvent.Camera?.Keyframes) {
            const newKeyframes: Record<string, CameraKeyframe> = {};
            for (const timeStr in newEvent.Camera.Keyframes) {
                const originalKeyframe = newEvent.Camera.Keyframes[timeStr];
                const newTime = parseFloat(timeStr) / factor;
                newKeyframes[newTime.toFixed(4)] = originalKeyframe;
            }
            newEvent.Camera.Keyframes = newKeyframes;
        }

        if (newEvent.Objects) {
            for (const objDef of newEvent.Objects) {
                if (!objDef.Keyframes) continue;
                const tracksToModify = Array.isArray(objDef.Keyframes[0])
                    ? objDef.Keyframes as ObjectKeyframe[][]
                    : [objDef.Keyframes as ObjectKeyframe[]];
                for (const track of tracksToModify) {
                    for (const kf of track) {
                        kf.Time /= factor;
                    }
                }
            }
        }
        
        return newEvent;
    });
}


/**
 * Normalization Step 2: Normalize Keyframe Tracks to Parallel Format
 * 
 * Ensures all object keyframe tracks are arrays of arrays for unified processing.
 * Single track arrays are wrapped in another array to become a single-track parallel array.
 */
export function normalizeKeyframeTracks(sequence: SequenceEvent[]): SequenceEvent[] {
    return sequence.map(event => {
        if (!event.Objects) return event;
        
        const newEvent = JSON.parse(JSON.stringify(event));

        for (const objDef of newEvent.Objects) {
            if (!objDef.Keyframes) continue;

            // Convert single track to parallel format if it isn't already
            if (!isParallelTrack(objDef.Keyframes)) {
                objDef.Keyframes = [objDef.Keyframes as ObjectKeyframe[]];
            }
        }
        return newEvent;
    });
}

/**
 * Normalization Step 3: Preprocess State Inheritance Between Events
 * 
 * - Ensures camera animations have a keyframe at time 0, inheriting the last
 *   state from the previous event if necessary.
 * - Ensures every object track has a keyframe at time 0, using the object's
 *   `Initial` state if one isn't present.
 */
/**
 * Normalization Step 3: Preprocess State Inheritance Between Events (Corrected)
 *
 * - Injects a `Time: 0` keyframe if one is missing, inheriting state from the
 *   previous event.
 * - FIX: Robustly finds the true "last keyframe" of an event by iterating
 *   and finding the maximum time, rather than relying on key order or sorting.
 *   This guarantees the correct final state is always passed to the next event.
 */
export function preprocessSequenceInheritance(sequence: SequenceEvent[]): SequenceEvent[] {
    const newSequence = JSON.parse(JSON.stringify(sequence));
    let lastCameraState: Partial<Position> | null = null;

    for (const event of newSequence) {
        if (event.Camera) {
            if (!event.Camera.Keyframes) {
                event.Camera.Keyframes = {};
            }
            const keyframes = event.Camera.Keyframes;
            const hasZeroKeyframe = '0' in keyframes || '0.0' in keyframes || '0.0000' in keyframes;

            // 1. Inject the inherited starting state if needed.
            if (!hasZeroKeyframe && lastCameraState) {
                keyframes['0.0000'] = { ...lastCameraState };
            }

            // 2. Find the keyframe with the maximum time to update the state for the *next* event.
            let maxTime = -1;
            let finalKeyString: string | null = null;

            for (const timeStr in keyframes) {
                const time = parseFloat(timeStr);
                if (time > maxTime) {
                    maxTime = time;
                    finalKeyString = timeStr;
                }
            }

            // 3. Update lastCameraState using the true final keyframe.
            if (finalKeyString) {
                const finalKeyframe = keyframes[finalKeyString];
                lastCameraState = {
                    x: finalKeyframe.x ?? lastCameraState?.x,
                    y: finalKeyframe.y ?? lastCameraState?.y,
                    z: finalKeyframe.z ?? lastCameraState?.z,
                };
            } else {
                // If there were no keyframes in this event, there's no state to carry over.
                lastCameraState = null;
            }
        } else {
            // If the event has no Camera block, it breaks the chain of inheritance.
            lastCameraState = null;
        }

        // --- Object Initial State Injection (Unchanged) ---
        if (event.Objects) {
            for (const objDef of event.Objects) {
                if (objDef.Keyframes && objDef.Initial) {
                    const tracks = objDef.Keyframes as ObjectKeyframe[][];
                    for (const track of tracks) {
                        if (!track.some(kf => kf.Time === 0.0)) {
                            const initialKeyframe: ObjectKeyframe = { Time: 0.0, ...objDef.Initial };
                            if (objDef.Initial.pos) initialKeyframe.Position = { ...objDef.Initial.pos };
                            track.unshift(initialKeyframe);
                        }
                    }
                }
            }
        }
    }
    return newSequence;
}