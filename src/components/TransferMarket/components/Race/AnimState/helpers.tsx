import { ObjectKeyframe, KeyframeTrack, CameraDefinition, ObjectDefinition, CameraKeyframe, ClipDefinition, ModifierDefinition, Position } from '.';
import { easingFns } from '../../../../../../lib/d3/utils/math';

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

        console.log(newEvent)
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

/**
 * =================================================================================
 * MOVED HELPER FUNCTIONS
 * =================================================================================
 */

// Helper to generate noise
export function simplePseudoRandom(seed: number): number {
    let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
}

export function getClipFrame(clip: ClipDefinition, time: number): string | null {
    if (!clip) return null;
    const cycleDuration = clip.Frames.length * clip.FrameDuration;
    if (cycleDuration <= 0) return `${clip.Prefix}${clip.Frames[0]}`;
    let adjustedTime = time;
    if (clip.Playback === 'Loop') {
        adjustedTime = time % cycleDuration;
    } else if (time >= cycleDuration) {
        adjustedTime = cycleDuration - 0.001;
    }
    const frameIndex = Math.floor(adjustedTime / clip.FrameDuration);
    const clampedIndex = Math.min(frameIndex, clip.Frames.length - 1);
    const frameNumber = clip.Frames[clampedIndex];
    return `${clip.Prefix}${frameNumber}`;
}

export function interpolateProperty(
    keyframes: ObjectKeyframe[],
    progress: number,
    propertyAccessor: (kf: ObjectKeyframe) => any,
    easingAccessor: (kf: ObjectKeyframe) => string | undefined
): any {
    const sortedKeyframes = [...keyframes].sort((a, b) => a.Time - b.Time);
    if (sortedKeyframes.length === 0) return undefined;
    if (progress <= sortedKeyframes[0].Time) return propertyAccessor(sortedKeyframes[0]);
    const lastKeyframe = sortedKeyframes[sortedKeyframes.length - 1];
    if (progress >= lastKeyframe.Time) return propertyAccessor(lastKeyframe);

    let prevKeyframe = sortedKeyframes[0], nextKeyframe = lastKeyframe;
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        if (progress >= sortedKeyframes[i].Time && progress < sortedKeyframes[i + 1].Time) {
            prevKeyframe = sortedKeyframes[i]; nextKeyframe = sortedKeyframes[i + 1]; break;
        }
    }

    const prevValue = propertyAccessor(prevKeyframe), nextValue = propertyAccessor(nextKeyframe);
    if (prevValue === undefined) return nextValue;
    if (nextValue === undefined) return prevValue;
    if (nextKeyframe.Time === prevKeyframe.Time) return nextValue;

    const localProgress = (progress - prevKeyframe.Time) / (nextKeyframe.Time - prevKeyframe.Time);
    let easedProgress = localProgress;
    const easingName = easingAccessor(prevKeyframe);
    if (easingName && easingFns[easingName]) easedProgress = easingFns[easingName](localProgress);

    if (typeof prevValue === 'number' && typeof nextValue === 'number') {
        return prevValue + (nextValue - prevValue) * easedProgress;
    }
    if (typeof prevValue === 'object' && prevValue !== null && typeof nextValue === 'object' && nextValue !== null) {
        const result: any = {};
        const keys = new Set([...Object.keys(prevValue), ...Object.keys(nextValue)]);
        for (const key of keys) {
            const prev = (prevValue as any)[key] ?? (nextValue as any)[key];
            const next = (nextValue as any)[key] ?? (prevValue as any)[key];
            if (typeof prev === 'number' && typeof next === 'number') result[key] = prev + (next - prev) * easedProgress;
            else result[key] = localProgress < 0.5 ? prev : next;
        }
        return result;
    }
    return localProgress < 0.5 ? prevValue : nextValue;
}

export function interpolatePropertyMultiTrack(
    tracks: ObjectKeyframe[][],
    progress: number,
    propertyAccessor: (kf: ObjectKeyframe) => any,
    easingAccessor: (kf: ObjectKeyframe) => string | undefined
): any {
    let result: any = undefined;

    for (const track of tracks) {
        const trackResult = interpolateProperty(track, progress, propertyAccessor, easingAccessor);

        if (trackResult !== undefined) {
            if (typeof result === 'object' && result !== null &&
                typeof trackResult === 'object' && trackResult !== null) {
                result = { ...result, ...trackResult };
            } else {
                result = trackResult;
            }
        }
    }
    return result;
}

export function getLastKnownValue(
    keyframes: ObjectKeyframe[],
    progress: number,
    propertyAccessor: (kf: ObjectKeyframe) => any
): any {
    const sortedKeyframes = [...keyframes].sort((a, b) => a.Time - b.Time);
    let lastValue: any = undefined;

    for (const kf of sortedKeyframes) {
        if (kf.Time > progress) break;
        const value = propertyAccessor(kf);
        if (value !== undefined) {
            lastValue = value;
        }
    }
    return lastValue;
}

export function getLastKnownValueMultiTrack(
    tracks: ObjectKeyframe[][],
    progress: number,
    propertyAccessor: (kf: ObjectKeyframe) => any
): any {
    let result: any = undefined;
    for (const track of tracks) {
        const trackResult = getLastKnownValue(track, progress, propertyAccessor);
        if (trackResult !== undefined) {
            result = trackResult;
        }
    }
    return result;
}

export function getModifierStateAtProgress(
    keyframes: ObjectKeyframe[],
    progress: number,
    modName: string
): { isActive: boolean; params: any; activationTime: number } {
    let lastKnownState = false;
    let activationTime = 0;

    // Filter keyframes that actually mention this modifier
    const relevantKeyframes = keyframes
        .filter(kf => kf.Time <= progress && kf.Modifiers?.[modName] !== undefined)
        .sort((a, b) => a.Time - b.Time);

    if (relevantKeyframes.length > 0) {
        // 1. Determine the current state based on the most recent keyframe
        const lastControlKeyframe = relevantKeyframes[relevantKeyframes.length - 1];
        const val = lastControlKeyframe.Modifiers![modName];
        
        // Strict check: It is active ONLY if it says 'on' (case-insensitive)
        lastKnownState = val.toLowerCase() === 'on';

        // 2. Backtrack to find exactly when this state started
        // (e.g., if we are at time 1.0, and it turned 'on' at 0.5, we need 0.5)
        for (let i = relevantKeyframes.length - 1; i >= 0; i--) {
            const kf = relevantKeyframes[i];
            const currentVal = kf.Modifiers![modName];
            const isCurrentActive = currentVal.toLowerCase() === 'on';

            // If the state at this keyframe is different from our target state,
            // the change happened at the *next* keyframe (forward in time).
            if (isCurrentActive !== lastKnownState) {
                if (relevantKeyframes[i + 1]) {
                    activationTime = relevantKeyframes[i + 1].Time;
                } else {
                    activationTime = relevantKeyframes[i].Time;
                }
                break;
            }
            // Otherwise, keep pushing the activation time back to this keyframe
            activationTime = kf.Time;
        }
    }

    // Default: if it's active but we couldn't find a start time (rare), default to first keyframe
    if (lastKnownState && activationTime === 0 && relevantKeyframes.length > 0) {
        activationTime = relevantKeyframes[0].Time;
    }

    // params is returned as empty object since we are only using string switches now
    return { isActive: lastKnownState, params: {}, activationTime };
}

export function getModifierStateAtProgressMultiTrack(
    tracks: ObjectKeyframe[][],
    progress: number,
    modName: string
): { isActive: boolean; params: any; activationTime: number } {
    let result = { isActive: false, params: {}, activationTime: 0 };
    for (const track of tracks) {
        const trackResult = getModifierStateAtProgress(track, progress, modName);
        if (trackResult.isActive || Object.keys(trackResult.params).length > 0) {
            result = trackResult;
        }
    }
    return result;
}
const SINE = "Sine"
const COSINE = "Cosine"
export function calculateModifierOffset(
    modDef: ModifierDefinition,
    params: { Amplitude?: number },
    time: number
): { position?: { x?: number; y?: number; z?: number }; scale?: number; rotation?: number; alpha?: number } {
    let value = 0;
    const amplitude = params.Amplitude ?? modDef.Amplitude ?? 1.0;

    switch (modDef.Type) {
        case 'Oscillator':
            const frequency = modDef.Frequency ?? 1.0;
            if (modDef.Waveform === SINE) value = Math.sin(time * frequency * 2 * Math.PI);
            if (modDef.Waveform === COSINE) value = Math.cos(time * frequency * 2 * Math.PI);
            break;
        case 'Sequence':
            const duration = modDef.CycleDuration ?? 1.0;
            const values = modDef.Values ?? [0, 1, 0];
            if (values.length > 1 && duration > 0) {
                const sequenceProgress = (time % duration) / duration;
                const segmentProgress = sequenceProgress * (values.length - 1);
                const index = Math.floor(segmentProgress), localProgress = segmentProgress - index;
                const prev = values[index], next = values[Math.min(index + 1, values.length - 1)];
                value = prev + (next - prev) * localProgress;
            }
            break;
    }

    const finalValue = value * amplitude;
    const result: { position?: { x?: number; y?: number; z?: number }; scale?: number; rotation?: number; alpha?: number } = {};

    if (modDef.TargetProperty.startsWith('position.')) {
        const axis = modDef.TargetProperty.split('.')[1] as 'x' | 'y' | 'z';
        result.position = { [axis]: finalValue };
    } else if (modDef.TargetProperty === 'scale') {
        result.scale = finalValue;
    } else if (modDef.TargetProperty === 'rotation') {
        result.rotation = finalValue;
    } else if (modDef.TargetProperty === 'alpha') {
        result.alpha = finalValue;
    }
    return result;
}

export function getClipActivationState(
    tracks: ObjectKeyframe[][],
    progress: number
): { clipName: string | undefined; activationTime: number } {
    let lastClipKeyframe: ObjectKeyframe | null = null;

    for (const track of tracks) {
        for (const kf of track) {
            if (kf.Time > progress) continue;
            if (kf.Clip !== undefined) {
                if (!lastClipKeyframe || kf.Time > lastClipKeyframe.Time) {
                    lastClipKeyframe = kf;
                }
            }
        }
    }

    if (lastClipKeyframe && lastClipKeyframe.Clip) {
        return { clipName: lastClipKeyframe.Clip, activationTime: lastClipKeyframe.Time };
    }
    return { clipName: undefined, activationTime: 0 };
}