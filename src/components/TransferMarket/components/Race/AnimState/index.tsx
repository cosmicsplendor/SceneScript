import { easingFns } from '../../../../../../lib/d3/utils/math';
import { normalizeKeyframeTracks, preprocessSequenceInheritance, renormalizeKeyframeTimes } from './helpers';

// --- Type Definitions (omitted for brevity, assume they are the same as provided) ---
interface ClipDefinition {
    FrameDuration: number;
    Prefix: string;
    Frames: number[];
    Playback: 'Loop' | 'Once';
}

interface Position {
    x?: number;
    y?: number;
    z?: number;
}

interface ObjectInitial {
    frame?: string;
    pos?: Position;
    scale?: number;
    alpha?: number;
    flip?: boolean;
    rotation?: number;
    anchor?: Position;
}

export interface ObjectKeyframe {
    Time: number;
    Clip?: string;
    Frame?: string;
    Position?: Position;
    Scale?: number;
    Alpha?: number;
    Rotation?: number;
    Flip?: boolean;
    Easing?: Record<string, string>;
    Modifiers?: Record<string, { State?: 'Active' | 'Inactive'; Amplitude?: number }>;
}

// NEW: Support both single track and parallel tracks
export type KeyframeTrack = ObjectKeyframe[] | ObjectKeyframe[][];

export interface ObjectDefinition {
    ID: string;
    Initial?: ObjectInitial;
    Keyframes?: KeyframeTrack;
}

interface ModifierDefinition {
    Type: 'Oscillator' | 'Sequence';
    TargetProperty: 'position.x' | 'position.y' | 'position.z' | 'scale' | 'rotation';
    Waveform?: 'Sine' | 'Noise';
    Frequency?: number;
    Playback?: 'Loop';
    Interpolation?: 'SineInOut' | 'Step' | 'Linear';
    Values?: number[];
    CycleDuration?: number;
    Amplitude?: number;
}

export interface CameraKeyframe {
    x?: number;
    y?: number;
    z?: number;
    Easing?: Record<string, string>;
    ShakeForce?: number; // The instantaneous force/amplitude of the shake
    ShakeDecay?: number; // A factor (0 to 1) representing the decay per frame
    // Added based on usage in class methods
    ShakeRatioX?: number;
    ShakeRatioY?: number;
    ShakeRatioZ?: number;
}

export interface CameraDefinition {
    Initial?: Position;
    Keyframes: Record<string, CameraKeyframe>;
}

interface SequenceEvent {
    EventID: string;
    Duration: number;
    Camera?: CameraDefinition;
    Objects?: ObjectDefinition[];
}

interface AnimationData {
    Clips?: Record<string, ClipDefinition>;
    Modifiers?: Record<string, ModifierDefinition>;
    Sequence?: SequenceEvent[];
    StartSequence?: String;
    HidePrevious?: boolean; // NEW: Flag to hide objects from previous sequences
}

interface DynamicObject {
    id: string;
    x: number;
    yOffset: number;
    z: number;
    scale: number;
    alpha: number;
    frame: string;
    flip: boolean;
    rotation: number;
}

/**
 * =================================================================================
 * Deterministic AnimationState Class with Parallel Keyframe Support
 * =================================================================================
 */
export class AnimationState {
    private clips: Record<string, ClipDefinition> = {};
    private modifiers: Record<string, ModifierDefinition> = {};
    private sequence: SequenceEvent[] = [];
    private actors: Map<string, DynamicObject> = new Map();
    private cameraSubject: DynamicObject | null = null;

    constructor(animationData: AnimationData) {
        this.clips = animationData.Clips || {};
        this.modifiers = animationData.Modifiers || {};

        // The robust, final processing pipeline
        let processedSequence = animationData.Sequence || [];

        // STEP 1: (THE FIX) Solidify all frame counts into integers first.
        processedSequence = (processedSequence);

        // STEP 2: Normalize times and scale durations where requested.
        processedSequence = renormalizeKeyframeTimes(processedSequence);

        // STEP 3: Ensure all tracks are in the parallel [[]] format.
        processedSequence = normalizeKeyframeTracks(processedSequence);

        // NEW: If HidePrevious is true and a StartSequence exists, remove objects from earlier events
        if (animationData.StartSequence && animationData.HidePrevious) {
            const startIndex = processedSequence.findIndex(evt => evt.EventID === animationData.StartSequence);
            if (startIndex > 0) {
                // Clear objects from all sequences preceding the start sequence
                // This prevents the inheritance preprocessor from picking them up
                for (let i = 0; i < startIndex; i++) {
                    processedSequence[i].Objects = [];
                }
            }
        }

        // STEP 4: Handle state inheritance between events now that data is clean.
        processedSequence = preprocessSequenceInheritance(processedSequence);

        this.sequence = processedSequence;
    }
    public setActors(actors: Map<string, DynamicObject>): void {
        this.actors = actors;
    }

    public setCameraSubject(subject: DynamicObject): void {
        this.cameraSubject = subject;
    }

    private interpolatePropertyMultiTrack(
        tracks: ObjectKeyframe[][],
        progress: number,
        propertyAccessor: (kf: ObjectKeyframe) => any,
        easingAccessor: (kf: ObjectKeyframe) => string | undefined
    ): any {
        let result: any = undefined;

        // Process each track independently
        for (const track of tracks) {
            const trackResult = this.interpolateProperty(track, progress, propertyAccessor, easingAccessor);

            if (trackResult !== undefined) {
                // Deep merge for Position objects, otherwise override
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

    /**
     * NEW: Gets the last known value across all parallel tracks.
     * Processes tracks in order, with later tracks overriding earlier ones.
     */
    private getLastKnownValueMultiTrack(
        tracks: ObjectKeyframe[][],
        progress: number,
        propertyAccessor: (kf: ObjectKeyframe) => any
    ): any {
        let result: any = undefined;

        for (const track of tracks) {
            const trackResult = this.getLastKnownValue(track, progress, propertyAccessor);
            if (trackResult !== undefined) {
                result = trackResult;
            }
        }

        return result;
    }

    private getLastKnownValue(
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
    private getCurrentSequenceEventContext(frame: number): { event: SequenceEvent; localFrame: number; duration: number; progress: number } | null {
        let currentFrame = 0;
        for (const event of this.sequence) {
            if (frame >= currentFrame && frame < currentFrame + event.Duration) {
                const localFrame = frame - currentFrame;
                const progress = event.Duration > 1 ? localFrame / (event.Duration - 1) : 0;
                return { event, localFrame, duration: event.Duration, progress };
            }
            currentFrame += event.Duration;
        }
        return null;
    }
    public updateActors = (frame: number): void => {
        // CHANGED: Use a context-retrieval function to get localFrame and duration
        const currentSeq = this.getCurrentSequenceEventContext(frame);
        if (!currentSeq) return;

        const { event, progress, localFrame, duration } = currentSeq; // Destructure new values

        if (event.Camera && this.cameraSubject) {
            // CHANGED: Pass localFrame and duration to updateCamera
            this.updateCamera(event.Camera, localFrame, duration, progress);
        }

        if (event.Objects) {
            for (const objDef of event.Objects) {
                const actor = this.actors.get(objDef.ID);
                if (!actor) continue;
                this.updateActor(actor, objDef, event, progress);
            }
        }
    }

    private preprocessSequenceInheritance(): void {
        let lastCameraKeyframe: any = null;
        for (const event of this.sequence) {
            if (event.Camera && event.Camera.Keyframes) {
                const hasZeroKeyframe = '0' in event.Camera.Keyframes || '0.0' in event.Camera.Keyframes;
                if (!hasZeroKeyframe && lastCameraKeyframe) {
                    // Check if initial keyframe is needed
                    const keyframeTimes = Object.keys(event.Camera.Keyframes).map(parseFloat);
                    if (keyframeTimes.length === 0 || keyframeTimes[0] !== 0) {
                        event.Camera.Keyframes['0.0'] = { ...lastCameraKeyframe };
                    }
                }

                // Update lastCameraKeyframe with the final keyframe of the current event
                const keyframeTimes = Object.keys(event.Camera.Keyframes).map(parseFloat).sort((a, b) => b - a);
                if (keyframeTimes.length > 0) {
                    const finalTime = keyframeTimes[0].toFixed(4); // Use fixed precision for string key
                    const finalKeyframe = event.Camera.Keyframes[finalTime];
                    if (finalKeyframe) {
                        lastCameraKeyframe = { x: finalKeyframe.x, y: finalKeyframe.y, z: finalKeyframe.z };
                    }
                }
            }
            if (event.Objects) {
                for (const objDef of event.Objects) {
                    if (objDef.Keyframes && objDef.Initial) {
                        const tracks = objDef.Keyframes as ObjectKeyframe[][];

                        // Add initial keyframe to ALL tracks that don't have Time 0
                        for (const track of tracks) {
                            const hasZeroKeyframe = track.some(kf => kf.Time === 0.0);

                            if (!hasZeroKeyframe) {
                                const initialKeyframe: ObjectKeyframe = { Time: 0.0 };
                                if (objDef.Initial.pos) initialKeyframe.Position = { ...objDef.Initial.pos };
                                if (objDef.Initial.scale !== undefined) initialKeyframe.Scale = objDef.Initial.scale;
                                if (objDef.Initial.alpha !== undefined) initialKeyframe.Alpha = objDef.Initial.alpha;
                                if (objDef.Initial.frame) initialKeyframe.Frame = objDef.Initial.frame;
                                if (objDef.Initial.flip !== undefined) initialKeyframe.Flip = objDef.Initial.flip;
                                if (objDef.Initial.rotation !== undefined) initialKeyframe.Rotation = objDef.Initial.rotation;
                                track.unshift(initialKeyframe);
                            }
                        }
                    }
                }
            }
        }
    }

    private getCurrentSequenceEvent(frame: number): { event: SequenceEvent; localFrame: number; progress: number } | null {
        let currentFrame = 0;
        for (const event of this.sequence) {
            if (frame >= currentFrame && frame < currentFrame + event.Duration) {
                const localFrame = frame - currentFrame;
                const progress = event.Duration > 1 ? localFrame / (event.Duration - 1) : 0;
                return { event, localFrame, progress };
            }
            currentFrame += event.Duration;
        }
        return null;
    }

    private getClipFrame(clipName: string, time: number): string | null {
        const clip = this.clips[clipName];
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

    private interpolateProperty(
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
                const prev = prevValue[key] ?? nextValue[key], next = nextValue[key] ?? prevValue[key];
                if (typeof prev === 'number' && typeof next === 'number') result[key] = prev + (next - prev) * easedProgress;
                else result[key] = localProgress < 0.5 ? prev : next;
            }
            return result;
        }
        return localProgress < 0.5 ? prevValue : nextValue;
    }

    // CHANGED: Implemented per-axis scaling (ShakeRatioX/Y/Z) to handle non-homogeneous coordinates.
    private updateCamera(cameraDef: CameraDefinition, localFrame: number, duration: number, progress: number): void {
        if (!this.cameraSubject) return;

        // Keyframe times are now normalized to 0-1
        const keyframes: any[] = Object.entries(cameraDef.Keyframes)
            .map(([timeStr, keyframe]) => ({
                Time: parseFloat(timeStr),
                x: keyframe.x,
                y: keyframe.y,
                z: keyframe.z,
                Easing: keyframe.Easing,
                // Assumed properties from the prompt
                ShakeForce: keyframe.ShakeForce,
                ShakeDecay: keyframe.ShakeDecay,
                // NEW: Per-axis shake ratios
                ShakeRatioX: keyframe.ShakeRatioX,
                ShakeRatioY: keyframe.ShakeRatioY,
                ShakeRatioZ: keyframe.ShakeRatioZ,
            }))
            .sort((a, b) => a.Time - b.Time);

        // Interpolate Base Values
        const base_x = this.interpolateProperty(keyframes, progress, kf => kf.x, kf => kf.Easing?.x || kf.Easing?.Position);
        const base_y = this.interpolateProperty(keyframes, progress, kf => kf.y, kf => kf.Easing?.y || kf.Easing?.Position);
        const base_z = this.interpolateProperty(keyframes, progress, kf => kf.z, kf => kf.Easing?.z || kf.Easing?.Position);

        // --- NEW Shake Calculation Logic (Scrubbable with Additive/Decay) ---
        let currentShakeOffset = { x: 0, y: 0, z: 0 };

        for (let frameN = 0; frameN <= localFrame; frameN++) {
            const frameProgress = duration > 1 ? frameN / (duration - 1) : 0;

            // 1. Interpolate current force, decay, and **ratios** at frame N
            const force = this.interpolateProperty(keyframes, frameProgress, kf => kf.ShakeForce, () => undefined) ?? 0;

            const decayValue = this.interpolateProperty(keyframes, frameProgress, kf => kf.ShakeDecay, () => undefined) ?? 0;
            const decayFactor = 1.0 - decayValue;

            // NEW: Interpolate ratios, defaulting to 1.0 (no scaling)
            const ratioX = this.interpolateProperty(keyframes, frameProgress, kf => kf.ShakeRatioX, () => undefined) ?? 1.0;
            const ratioY = this.interpolateProperty(keyframes, frameProgress, kf => kf.ShakeRatioY, () => undefined) ?? 1.0;
            const ratioZ = this.interpolateProperty(keyframes, frameProgress, kf => kf.ShakeRatioZ, () => undefined) ?? 1.0;

            // 2. Apply decay to the previous offset (S_N = S_{N-1} * D_interp)
            currentShakeOffset.x *= decayFactor;
            currentShakeOffset.y *= decayFactor;
            currentShakeOffset.z *= decayFactor;

            // 3. Apply new noise force (S_N = S_N + F_interp * Ratio * Noise(N))
            if (force > 0) {
                const noiseX = this.simplePseudoRandom(frameN * 1.1);
                const noiseY = this.simplePseudoRandom(frameN * 2.3);
                const noiseZ = this.simplePseudoRandom(frameN * 3.7);

                // CHANGED: Apply the interpolated ratio to the force for each axis
                currentShakeOffset.x += force * ratioX * noiseX;
                currentShakeOffset.y += force * ratioY * noiseY;
                currentShakeOffset.z += force * ratioZ * noiseZ;
            }
        }
        // --- END Shake Calculation Logic ---

        // Apply interpolated base values + accumulated shake offset
        if (base_x !== undefined) this.cameraSubject.x = base_x + currentShakeOffset.x;
        if (base_y !== undefined) this.cameraSubject.yOffset = base_y + currentShakeOffset.y;
        if (base_z !== undefined) this.cameraSubject.z = base_z + currentShakeOffset.z;
    }

    private updateActor(actor: DynamicObject, objDef: ObjectDefinition, event: SequenceEvent, progress: number): void {
        // Now always an array of tracks after normalization
        const tracks = (objDef.Keyframes || [[]]) as ObjectKeyframe[][];

        // Use multi-track interpolation for all properties
        const basePosition = this.interpolatePropertyMultiTrack(tracks, progress, kf => kf.Position, kf => kf.Easing?.Position);
        const baseScale = this.interpolatePropertyMultiTrack(tracks, progress, kf => kf.Scale, kf => kf.Easing?.Scale);
        const baseAlpha = this.interpolatePropertyMultiTrack(tracks, progress, kf => kf.Alpha, kf => kf.Easing?.Alpha);
        const baseRotation = this.interpolatePropertyMultiTrack(tracks, progress, kf => kf.Rotation, kf => kf.Easing?.Rotation);

        // --- THIS IS THE RESTORED FLIP LOGIC ---
        // 1. Try to get the flip value from the keyframes first.
        let flip = this.getLastKnownValueMultiTrack(tracks, progress, kf => kf.Flip);
        // 2. If no keyframe has defined flip yet, fall back to the initial value.
        if (flip === undefined && objDef.Initial?.flip !== undefined) {
            flip = objDef.Initial.flip;
        }

        // --- MODIFIER PROCESSING (Unchanged) ---
        const totalOffsets = { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: 0 };
        for (const modName in this.modifiers) {
            const modDef = this.modifiers[modName];
            const { isActive, params, activationTime } = this.getModifierStateAtProgressMultiTrack(tracks, progress, modName);

            if (isActive) {
                const timeSinceActiveProgress = progress - activationTime;
                const timeSinceActive = timeSinceActiveProgress * event.Duration / 60;

                const offset = this.calculateModifierOffset(modDef, params, timeSinceActive);

                if (offset.position) {
                    totalOffsets.position.x += offset.position.x || 0;
                    totalOffsets.position.y += offset.position.y || 0;
                    totalOffsets.position.z += offset.position.z || 0;
                }
                if (offset.scale !== undefined) {
                    totalOffsets.scale += offset.scale;
                }
                if (offset.rotation !== undefined) {
                    totalOffsets.rotation += offset.rotation;
                }
            }
        }

        // --- APPLYING FINAL VALUES ---

        // Apply position
        if (basePosition) {
            if (basePosition.x !== undefined) actor.x = basePosition.x + totalOffsets.position.x;
            if (basePosition.y !== undefined) actor.yOffset = basePosition.y + totalOffsets.position.y;
            if (basePosition.z !== undefined) actor.z = basePosition.z + totalOffsets.position.z;
        }
        // Apply scale
        if (baseScale !== undefined) {
            actor.scale = baseScale * totalOffsets.scale;
        } else {
            actor.scale = (objDef?.Initial?.scale || 1) * totalOffsets.scale;
        }
        // Apply alpha
        if (baseAlpha !== undefined) actor.alpha = baseAlpha;
        // Apply rotation
        if (baseRotation !== undefined) {
            actor.rotation = baseRotation + totalOffsets.rotation
        } else {
            actor.rotation = (objDef?.Initial?.rotation || 0) + totalOffsets.rotation;
        }
        // Apply flip (only if a value was determined)
        if (flip !== undefined) {
            actor.flip = flip;
        }

        // --- CORRECTED CLIP AND FRAME LOGIC (from previous fix) ---

        const frameName = this.getLastKnownValueMultiTrack(tracks, progress, kf => kf.Frame);
        if (frameName) {
            actor.frame = frameName;
        } else {
            const { clipName, activationTime } = this.getClipActivationState(tracks, progress);
            if (clipName) {
                const progressSinceActive = Math.max(0, progress - activationTime);
                const framesSinceActive = progressSinceActive * (event.Duration > 1 ? (event.Duration - 1) : 0);
                const clipTimeInSeconds = framesSinceActive / 60.0;
                const newFrame = this.getClipFrame(clipName, clipTimeInSeconds);
                if (newFrame) {
                    actor.frame = newFrame;
                }
            }
        }
    }

    /**
     * NEW: Gets modifier state across multiple parallel tracks.
     */
    private getModifierStateAtProgressMultiTrack(
        tracks: ObjectKeyframe[][],
        progress: number,
        modName: string
    ): { isActive: boolean; params: any; activationTime: number } {
        let result = { isActive: false, params: {}, activationTime: 0 };

        // Process each track, with later tracks overriding
        for (const track of tracks) {
            const trackResult = this.getModifierStateAtProgress(track, progress, modName);
            if (trackResult.isActive || Object.keys(trackResult.params).length > 0) {
                result = trackResult;
            }
        }

        return result;
    }

    private getModifierStateAtProgress(
        keyframes: ObjectKeyframe[],
        progress: number,
        modName: string
    ): { isActive: boolean; params: any; activationTime: number } {
        let lastKnownState = false, lastKnownParams = {}, activationTime = 0;

        const relevantKeyframes = keyframes
            .filter(kf => kf.Time <= progress && kf.Modifiers?.[modName] !== undefined)
            .sort((a, b) => a.Time - b.Time);

        if (relevantKeyframes.length > 0) {
            const lastControlKeyframe = relevantKeyframes[relevantKeyframes.length - 1];
            const controlBlock = lastControlKeyframe.Modifiers[modName];
            lastKnownState = controlBlock.State !== 'Inactive';
            lastKnownParams = controlBlock;

            for (let i = relevantKeyframes.length - 1; i >= 0; i--) {
                const kf = relevantKeyframes[i];
                const currentState = kf.Modifiers[modName].State !== 'Inactive';
                if (currentState !== lastKnownState) {
                    // This is the keyframe *before* activation (or deactivation), 
                    // the activation time should be the next keyframe's time.
                    // Since the list is sorted, next keyframe is i+1.
                    if (relevantKeyframes[i + 1]) {
                        activationTime = relevantKeyframes[i + 1].Time;
                    } else {
                        // Edge case: if the very first keyframe activates it
                        activationTime = relevantKeyframes[i].Time;
                    }
                    break;
                }
                activationTime = kf.Time;
            }
        }
        // If lastKnownState is true, and we found no previous change of state, 
        // the activation time is the time of the first relevant keyframe (or 0 if initial is active).
        if (lastKnownState && activationTime === 0 && relevantKeyframes.length > 0) {
            activationTime = relevantKeyframes[0].Time;
        }


        return { isActive: lastKnownState, params: lastKnownParams, activationTime };
    }

    private calculateModifierOffset(
        modDef: ModifierDefinition,
        params: { Amplitude?: number },
        time: number
    ): { position?: { x?: number; y?: number; z?: number }; scale?: number, rotation?: number } {
        let value = 0;
        const amplitude = params.Amplitude ?? modDef.Amplitude ?? 1.0;

        switch (modDef.Type) {
            case 'Oscillator':
                const frequency = modDef.Frequency ?? 1.0;
                if (modDef.Waveform === 'Sine') value = Math.sin(time * frequency * 2 * Math.PI);
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
        const result: ReturnType<typeof this.calculateModifierOffset> = {};

        if (modDef.TargetProperty.startsWith('position.')) {
            const axis = modDef.TargetProperty.split('.')[1] as 'x' | 'y' | 'z';
            result.position = { [axis]: finalValue };
        } else if (modDef.TargetProperty === 'scale') {
            result.scale = finalValue;
        } else if (modDef.TargetProperty === 'rotation') {
            result.rotation = finalValue;
        }
        return result;
    }
    private simplePseudoRandom(seed: number): number {
        // A simple hash function to generate a deterministic pseudo-random value between -1.0 and 1.0
        // Multiplying by different prime-like numbers for x/y/z axes ensures different-looking noise
        let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return (x - Math.floor(x)) * 2 - 1; // Range [-1, 1]
    }
    private getClipActivationState(
        tracks: ObjectKeyframe[][],
        progress: number
    ): { clipName: string | undefined; activationTime: number } {
        let lastClipKeyframe: ObjectKeyframe | null = null;

        // Find the single latest keyframe that defines a clip across all tracks up to the current progress
        for (const track of tracks) {
            for (const kf of track) {
                if (kf.Time > progress) continue; // Ignore keyframes in the future

                // We are looking for the last keyframe that *set* a clip value.
                if (kf.Clip !== undefined) {
                    if (!lastClipKeyframe || kf.Time > lastClipKeyframe.Time) {
                        lastClipKeyframe = kf;
                    }
                }
            }
        }

        if (lastClipKeyframe && lastClipKeyframe.Clip) {
            // The activation time is the time of the keyframe that set the clip.
            return { clipName: lastClipKeyframe.Clip, activationTime: lastClipKeyframe.Time };
        }

        // Return undefined if no clip is active at the current progress
        return { clipName: undefined, activationTime: 0 };
    }
}