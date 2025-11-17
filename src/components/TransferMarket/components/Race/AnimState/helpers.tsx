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
export function renormalizeKeyframeTimes(sequence: SequenceEvent[]): SequenceEvent[] {
    // Return a new array to avoid modifying the original data
    return sequence.map(event => {
        // Create a deep copy of the event to modify
        const newEvent = JSON.parse(JSON.stringify(event));

        // Only process events that are explicitly flagged for normalization
        if (!newEvent.Normalize) {
            return newEvent;
        }

        let maxTimeInEvent = 0.0;

        // 1. Find the absolute maximum time in the current event
        if (newEvent.Camera?.Keyframes) {
            for (const timeStr in newEvent.Camera.Keyframes) {
                maxTimeInEvent = Math.max(maxTimeInEvent, parseFloat(timeStr));
            }
        }
        if (newEvent.Objects) {
            for (const objDef of newEvent.Objects) {
                if (!objDef.Keyframes) continue;
                const tracks = isParallelTrack(objDef.Keyframes)
                    ? objDef.Keyframes
                    : [objDef.Keyframes as ObjectKeyframe[]];
                for (const track of tracks) {
                    for (const kf of track) {
                        maxTimeInEvent = Math.max(maxTimeInEvent, kf.Time);
                    }
                }
            }
        }

        // Avoid division by zero if there are no keyframes or times are all 0
        if (maxTimeInEvent <= 0) {
            return newEvent;
        }

        const factor = maxTimeInEvent;

        // 2. Set the event duration to the discovered max time
        newEvent.Duration = Math.round(factor);

        // 3. Renormalize all times within this event by the factor
        if (newEvent.Camera?.Keyframes) {
            const newKeyframes: Record<string, CameraKeyframe> = {};
            for (const timeStr in newEvent.Camera.Keyframes) {
                const newTime = parseFloat(timeStr) / factor;
                newKeyframes[newTime.toFixed(4)] = newEvent.Camera.Keyframes[timeStr];
            }
            newEvent.Camera.Keyframes = newKeyframes;
        }

        if (newEvent.Objects) {
            for (const objDef of newEvent.Objects) {
                if (!objDef.Keyframes) continue;
                const tracksToModify = isParallelTrack(objDef.Keyframes)
                    ? objDef.Keyframes
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
export function preprocessSequenceInheritance(sequence: SequenceEvent[]): SequenceEvent[] {
    const newSequence = JSON.parse(JSON.stringify(sequence));
    let lastCameraKeyframe: any = null;

    for (const event of newSequence) {
        // Camera state inheritance
        if (event.Camera && event.Camera.Keyframes) {
            const hasZeroKeyframe = '0' in event.Camera.Keyframes || '0.0' in event.Camera.Keyframes || '0.0000' in event.Camera.Keyframes;
            if (!hasZeroKeyframe && lastCameraKeyframe) {
                 event.Camera.Keyframes['0.0000'] = { ...lastCameraKeyframe };
            }
            const keyframeTimes = Object.keys(event.Camera.Keyframes).map(parseFloat).sort((a, b) => a - b);
            if (keyframeTimes.length > 0) {
                const finalTime = keyframeTimes[keyframeTimes.length - 1].toFixed(4);
                const finalKeyframe = event.Camera.Keyframes[finalTime];
                if (finalKeyframe) {
                    lastCameraKeyframe = { x: finalKeyframe.x, y: finalKeyframe.y, z: finalKeyframe.z };
                }
            }
        }

        // Object initial state injection
        if (event.Objects) {
            for (const objDef of event.Objects) {
                if (objDef.Keyframes && objDef.Initial) {
                    const tracks = objDef.Keyframes as ObjectKeyframe[][];
                    for (const track of tracks) {
                        const hasZeroKeyframe = track.some(kf => kf.Time === 0.0);
                        if (!hasZeroKeyframe) {
                            const initialKeyframe: ObjectKeyframe = { Time: 0.0 };
                            if (objDef.Initial.pos) initialKeyframe.Position = { ...objDef.Initial.pos };
                            if (objDef.Initial.scale !== undefined) initialKeyframe.Scale = objDef.Initial.scale;
                            // ... (add other initial properties as needed)
                            track.unshift(initialKeyframe);
                        }
                    }
                }
            }
        }
    }
    return newSequence;
}