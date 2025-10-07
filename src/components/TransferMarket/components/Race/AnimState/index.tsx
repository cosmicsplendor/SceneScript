import { easingFns } from '../../../../../../lib/d3/utils/math';

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
}

interface ObjectKeyframe {
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
type KeyframeTrack = ObjectKeyframe[] | ObjectKeyframe[][];

interface ObjectDefinition {
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

interface CameraKeyframe {
    x?: number;
    y?: number;
    z?: number;
    Easing?: Record<string, string>;
    ShakeForce?: number; // The instantaneous force/amplitude of the shake
    ShakeDecay?: number; // A factor (0 to 1) representing the decay per frame
}

interface CameraDefinition {
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
    private lastCameraState: { x?: number; y?: number; z?: number } | null = null;

    constructor(animationData: AnimationData) {
        this.clips = animationData.Clips || {};
        this.modifiers = animationData.Modifiers || {};
        this.sequence = animationData.Sequence || [];

        // NEW: Renormalize keyframe times before other preprocessing steps
        this.renormalizeKeyframeTimes();

        this.normalizeKeyframeTracks();
        this.preprocessSequenceInheritance();
    }

    // ... (rest of the class)

    public setActors(actors: Map<string, DynamicObject>): void {
        this.actors = actors;
    }

    public setCameraSubject(subject: DynamicObject): void {
        this.cameraSubject = subject;
    }

    /**
     * NEW: Renormalizes all keyframe times (Camera and Object) back to 0-1 range
     * if any keyframe time exceeds 1.0.
     */
    private renormalizeKeyframeTimes(): void {
        let maxTime = 1.0;

        // 1. Find maxTime across all keyframes in the sequence
        for (const event of this.sequence) {
            // Camera Keyframes
            if (event.Camera?.Keyframes) {
                for (const timeStr in event.Camera.Keyframes) {
                    maxTime = Math.max(maxTime, parseFloat(timeStr));
                }
            }

            // Object Keyframes
            if (event.Objects) {
                for (const objDef of event.Objects) {
                    if (!objDef.Keyframes) continue;

                    const isParallel = Array.isArray(objDef.Keyframes) && Array.isArray(objDef.Keyframes[0]);

                    const tracks = isParallel
                        ? objDef.Keyframes as ObjectKeyframe[][]
                        : [objDef.Keyframes as ObjectKeyframe[]];

                    for (const track of tracks) {
                        for (const kf of track) {
                            maxTime = Math.max(maxTime, kf.Time);
                        }
                    }
                }
            }
        }

        // If maxTime is 1.0 or less, no renormalization or duration extension is needed
        if (maxTime <= 1.0) return;

        const factor = maxTime;

        // 2. Renormalize all times and extend event Duration

        for (const event of this.sequence) {
            // Extend Event Duration
            event.Duration = Math.round(event.Duration * factor);

            // Camera Keyframes Renormalization (requires recreating the Keyframes object)
            if (event.Camera?.Keyframes) {
                const newKeyframes: Record<string, CameraKeyframe> = {};
                for (const timeStr in event.Camera.Keyframes) {
                    const time = parseFloat(timeStr);
                    const newTime = time / factor;
                    const newTimeStr = newTime.toFixed(4);
                    newKeyframes[newTimeStr] = event.Camera.Keyframes[timeStr];
                }
                event.Camera.Keyframes = newKeyframes;
            }

            // Object Keyframes Renormalization (modifies in place)
            if (event.Objects) {
                for (const objDef of event.Objects) {
                    if (!objDef.Keyframes) continue;

                    const isParallel = Array.isArray(objDef.Keyframes) && Array.isArray(objDef.Keyframes[0]);

                    const tracksToModify = isParallel
                        ? objDef.Keyframes as ObjectKeyframe[][]
                        : [objDef.Keyframes as ObjectKeyframe[]];

                    for (const track of tracksToModify) {
                        for (const kf of track) {
                            kf.Time /= factor;
                        }
                    }
                }
            }
        }
    }

    /**
     * NEW: Normalizes all keyframe tracks to be arrays of arrays (parallel tracks).
     * Single arrays become single-track parallel arrays for unified processing.
     */
    private normalizeKeyframeTracks(): void {
        for (const event of this.sequence) {
            if (!event.Objects) continue;

            for (const objDef of event.Objects) {
                if (!objDef.Keyframes) continue;

                // Convert single track to parallel format
                if (!this.isParallelTrack(objDef.Keyframes)) {
                    objDef.Keyframes = [objDef.Keyframes as ObjectKeyframe[]];
                }
            }
        }
    }

    /**
     * Determines if keyframes represent parallel tracks
     */
    private isParallelTrack(keyframes: KeyframeTrack): keyframes is ObjectKeyframe[][] {
        return Array.isArray(keyframes) &&
            keyframes.length > 0 &&
            Array.isArray(keyframes[0]);
    }

    /**
     * NEW: Interpolates a property across multiple parallel tracks.
     * Each track is evaluated independently, and results are merged with last-track priority.
     */
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
        const clipName = this.interpolatePropertyMultiTrack(tracks, progress, kf => kf.Clip, () => undefined);
        const frameName = this.interpolatePropertyMultiTrack(tracks, progress, kf => kf.Frame, () => undefined);
        let flip = this.getLastKnownValueMultiTrack(tracks, progress, kf => kf.Flip);
        if (flip === undefined && objDef.Initial?.flip !== undefined) {
            flip = objDef.Initial.flip;
        }

        // Modifier processing across all tracks
        const totalOffsets = { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: 0 };
        for (const modName in this.modifiers) {
            const modDef = this.modifiers[modName];
            const { isActive, params, activationTime } = this.getModifierStateAtProgressMultiTrack(tracks, progress, modName);

            if (isActive) {
                // `activationTime` is now normalized 0-1, convert to local frame duration
                const timeSinceActiveProgress = progress - activationTime;
                // Convert progress delta to seconds/time unit (assuming 60 FPS in a typical setup)
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

        // Only update properties that are actually defined in keyframes
        if (basePosition) {
            if (basePosition.x !== undefined) actor.x = basePosition.x + totalOffsets.position.x;
            if (basePosition.y !== undefined) actor.yOffset = basePosition.y + totalOffsets.position.y;
            if (basePosition.z !== undefined) actor.z = basePosition.z + totalOffsets.position.z;
        }
        if (baseScale !== undefined) {
            actor.scale = baseScale * totalOffsets.scale;
        } else {
            // Use initial scale as base when no keyframe scale exists
            actor.scale = (objDef?.Initial?.scale || 1) * totalOffsets.scale;
        }
        if (baseAlpha !== undefined) actor.alpha = baseAlpha;
        if (baseRotation !== undefined) {
            actor.rotation = baseRotation + totalOffsets.rotation
        } else {
            actor.rotation = (objDef?.Initial?.rotation || 0) + totalOffsets.rotation;
        }
        if (flip !== undefined) actor.flip = flip;

        if (frameName) actor.frame = frameName;
        else if (clipName) {
            const clipTime = progress * event.Duration / 60;
            const newFrame = this.getClipFrame(clipName, clipTime);
            if (newFrame) actor.frame = newFrame;
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
}