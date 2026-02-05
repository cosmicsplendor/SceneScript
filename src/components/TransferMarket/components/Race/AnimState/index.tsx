import { easingFns } from '../../../../../../lib/d3/utils/math';
import {
  normalizeKeyframeTracks,
  preprocessSequenceInheritance,
  renormalizeKeyframeTimes,
  interpolateProperty,
  interpolatePropertyMultiTrack,
  getLastKnownValueMultiTrack,
  getClipFrame,
  simplePseudoRandom,
  getModifierStateAtProgressMultiTrack,
  calculateModifierOffset,
  getClipActivationState
} from './helpers';
import { GeneratorDefinition } from './preprocessGenerators';

// --- Type Definitions ---

export interface ClipDefinition {
  FrameDuration: number;
  Prefix: string;
  Frames: number[];
  Playback: 'Loop' | 'Once';
}

export interface Position {
  x?: number;
  y?: number;
  z?: number;
}

export interface ObjectInitial {
  frame?: string;
  pos?: Position;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
  flip?: boolean;
  rotation?: number;
  anchor?: Position;
  Clip?: string;
  hidebeforehand?: boolean;
  invisibleTill?: number;
  hideAfter?: number;
  fadeoutDuration?: number;
  startAlpha?: number;
  BlendMode?: 'Screen' | 'Normal';
  mask?: {
    frame: string;
    dest?: { x: number; y: number; width: number; height: number };
  };
}

export interface ObjectKeyframe {
  Time: number;
  Clip?: string;
  Frame?: string;
  Position?: Position;
  Scale?: number;
  ScaleX?: number;
  ScaleY?: number;
  Alpha?: number;
  Rotation?: number;
  Flip?: boolean;
  Easing?: Record<string, string>;
  Modifiers?: Record<string, any>;
  MaskDest?: { x: number; y: number; width: number; height: number };
}

// NEW: Support both single track and parallel tracks
export type KeyframeTrack = ObjectKeyframe[] | ObjectKeyframe[][];

export interface CrossfadeDefinition {
  Time: number;
  Duration: number;
  TargetFrame: string;
  Offset?: Position;
  Curve?: 'Linear' | 'EaseInOut'; // Default Linear
}

export interface HighlightDefinition {
  Time: number;
  Duration: number;
  Frame: string;
  Color?: string; // Optional (not implemented yet but good to have)
  BlendMode?: string;
}

export interface ObjectDefinition {
  ID: string;
  Initial?: ObjectInitial;
  Keyframes?: KeyframeTrack;
  CrossFade?: CrossfadeDefinition[];
  Highlight?: HighlightDefinition[];
}

export interface ModifierDefinition {
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
  fov?: number; // NEW: Field of view in degrees
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
  Generators?: GeneratorDefinition[];
  ORIGIN_Y?: number;
}

export interface AnimationData {
  Clips?: Record<string, ClipDefinition>;
  Modifiers?: Record<string, ModifierDefinition>;
  Sequence?: SequenceEvent[];
  StartSequence?: String;
  HidePrevious?: boolean; // NEW: Flag to hide objects from previous sequences
  FOV?: number; // NEW: Global default FOV
  ORIGIN_Y?: number;
}

interface DynamicObject {
  id: string;
  x: number;
  yOffset: number;
  z: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  alpha: number;
  frame: string;
  flip: boolean;
  rotation: number;
  maskFrame?: string;
  BlendMode?: "Screen" | "Normal",
  maskDest?: { x: number; y: number; width: number; height: number };
}

interface World {
  setFov(degrees: number): void;
  ORIGIN_Y: number;
}

const getPosX = (kf: ObjectKeyframe) => kf.Position?.x;
const getPosY = (kf: ObjectKeyframe) => kf.Position?.y;
const getPosZ = (kf: ObjectKeyframe) => kf.Position?.z;

// --- Easing Accessors ---
// Logic: 
// 1. Try to access the specific axis (.x). 
// 2. If undefined, check if the value is a global string (e.g. "Linear"). 
// 3. Otherwise return undefined.
const getEasingX = (kf: ObjectKeyframe) => kf.Easing?.x ?? kf.Easing?.Position;

const getEasingY = (kf: ObjectKeyframe) => kf.Easing?.y ?? kf.Easing?.Position;

const getEasingZ = (kf: ObjectKeyframe) => kf.Easing?.z ?? kf.Easing?.Position;

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
  private world: World | null = null;

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

  public setWorld(world: World): void {
    this.world = world;
  }

  private getCurrentSequenceEventContext(frame: number): {
    event: SequenceEvent;
    localFrame: number;
    duration: number;
    progress: number;
  } | null {
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

    if (event.ORIGIN_Y !== undefined && this.world) {
        this.world.ORIGIN_Y = event.ORIGIN_Y;
    }
  };
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
        fov: keyframe.fov, // NEW: Include FOV
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

    // Interpolate Base Values with individual component easing support
    const base_x = interpolateProperty(keyframes, progress, kf => kf.x, kf => kf.Easing?.x || kf.Easing?.Position);
    const base_y = interpolateProperty(keyframes, progress, kf => kf.y, kf => kf.Easing?.y || kf.Easing?.Position);
    const base_z = interpolateProperty(keyframes, progress, kf => kf.z, kf => kf.Easing?.z || kf.Easing?.Position);

    // NEW: Interpolate FOV with individual easing support
    const base_fov = interpolateProperty(keyframes, progress, kf => kf.fov, kf => kf.Easing?.fov);

    // --- NEW Shake Calculation Logic (Scrubbable with Additive/Decay) ---
    let currentShakeOffset = { x: 0, y: 0, z: 0 };
    for (let frameN = 0; frameN <= localFrame; frameN++) {
      const frameProgress = duration > 1 ? frameN / (duration - 1) : 0;

      // 1. Interpolate current force, decay, and **ratios** at frame N
      const force = interpolateProperty(keyframes, frameProgress, kf => kf.ShakeForce, () => undefined) ?? 0;
      const decayValue = interpolateProperty(keyframes, frameProgress, kf => kf.ShakeDecay, () => undefined) ?? 0;
      const decayFactor = 1.0 - decayValue;

      // NEW: Interpolate ratios, defaulting to 1.0 (no scaling)
      const ratioX = interpolateProperty(keyframes, frameProgress, kf => kf.ShakeRatioX, () => undefined) ?? 1.0;
      const ratioY = interpolateProperty(keyframes, frameProgress, kf => kf.ShakeRatioY, () => undefined) ?? 1.0;
      const ratioZ = interpolateProperty(keyframes, frameProgress, kf => kf.ShakeRatioZ, () => undefined) ?? 1.0;

      // 2. Apply decay to the previous offset (S_N = S_{N-1} * D_interp)
      currentShakeOffset.x *= decayFactor;
      currentShakeOffset.y *= decayFactor;
      currentShakeOffset.z *= decayFactor;

      // 3. Apply new noise force (S_N = S_N + F_interp * Ratio * Noise(N))
      if (force > 0) {
        const noiseX = simplePseudoRandom(frameN * 1.1);
        const noiseY = simplePseudoRandom(frameN * 2.3);
        const noiseZ = simplePseudoRandom(frameN * 3.7);

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

    // NEW: Apply FOV to world
    if (base_fov !== undefined && this.world) {
      this.world.setFov(base_fov);
    }
  }
  private updateActor(actor: DynamicObject, objDef: ObjectDefinition, event: SequenceEvent, progress: number): void {
    const tracks = (objDef.Keyframes || [[]]) as ObjectKeyframe[][];

    // --- MODIFIER PROCESSING ---
    const totalOffsets = { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: 0 };
    for (const modName in this.modifiers) {
      const modDef = this.modifiers[modName];
      const { isActive, params, activationTime } = getModifierStateAtProgressMultiTrack(tracks, progress, modName);
      if (isActive) {
        const timeSinceActiveProgress = progress - activationTime;
        const timeSinceActive = timeSinceActiveProgress * event.Duration / 60;
        const offset = calculateModifierOffset(modDef, params, timeSinceActive);
        if (offset.position) {
          totalOffsets.position.x += offset.position.x || 0;
          totalOffsets.position.y += offset.position.y || 0;
          totalOffsets.position.z += offset.position.z || 0;
        }
        if (offset.scale !== undefined) totalOffsets.scale += offset.scale;
        if (offset.rotation !== undefined) totalOffsets.rotation += offset.rotation;
      }
    }

    // --- POSITION (Component-wise) ---
    // 1. Interpolate X (Supports Easing.x)
    const posX = interpolatePropertyMultiTrack(tracks, progress, getPosX, getEasingX);
    if (posX !== undefined) {
      actor.x = posX + totalOffsets.position.x;
    }

    // 2. Interpolate Y (Supports Easing.y)
    const posY = interpolatePropertyMultiTrack(tracks, progress, getPosY, getEasingY);
    if (posY !== undefined) {
      actor.yOffset = posY + totalOffsets.position.y;
    }

    // 3. Interpolate Z (Supports Easing.z)
    const posZ = interpolatePropertyMultiTrack(tracks, progress, getPosZ, getEasingZ);
    if (posZ !== undefined) {
      actor.z = posZ + totalOffsets.position.z;
    }

    // [REMOVED] The conflicting "basePosition" logic was here. 
    // It was overwriting the values above.

    // --- SCALE ---
    const baseScale = interpolatePropertyMultiTrack(tracks, progress, kf => kf.Scale, kf => kf.Easing?.Scale);
    if (baseScale !== undefined) {
      actor.scale = baseScale * totalOffsets.scale;
    } else {
      actor.scale = (objDef?.Initial?.scale || 1) * totalOffsets.scale;
    }

    // --- SCALEX ---
    const baseScaleX = interpolatePropertyMultiTrack(tracks, progress, kf => kf.ScaleX, kf => kf.Easing?.ScaleX);
    if (baseScaleX !== undefined) {
      actor.scaleX = baseScaleX;
    } else {
      if (objDef.Initial?.scaleX !== undefined) actor.scaleX = objDef.Initial.scaleX;
    }

    // --- SCALEY ---
    const baseScaleY = interpolatePropertyMultiTrack(tracks, progress, kf => kf.ScaleY, kf => kf.Easing?.ScaleY);
    if (baseScaleY !== undefined) {
      actor.scaleY = baseScaleY;
    } else {
      if (objDef.Initial?.scaleY !== undefined) actor.scaleY = objDef.Initial.scaleY;
    }

    // --- ALPHA ---
    const baseAlpha = interpolatePropertyMultiTrack(tracks, progress, kf => kf.Alpha, kf => kf.Easing?.Alpha);
    if (baseAlpha !== undefined) actor.alpha = baseAlpha;

    // --- ROTATION ---
    const baseRotation = interpolatePropertyMultiTrack(tracks, progress, kf => kf.Rotation, kf => kf.Easing?.Rotation);
    if (baseRotation !== undefined) {
      actor.rotation = baseRotation + totalOffsets.rotation;
    } else {
      actor.rotation = (objDef?.Initial?.rotation || 0) + totalOffsets.rotation;
    }

    // --- FLIP ---
    let flip = getLastKnownValueMultiTrack(tracks, progress, kf => kf.Flip);
    if (flip === undefined && objDef.Initial?.flip !== undefined) {
      flip = objDef.Initial.flip;
    }
    if (flip !== undefined) {
      actor.flip = flip;
    }

    // --- BLEND MODE ---
    let blendMode = getLastKnownValueMultiTrack(tracks, progress, kf => kf.BlendMode);
    if (blendMode === undefined && objDef.Initial?.BlendMode !== undefined) {
      blendMode = objDef.Initial.BlendMode;
    }
    if (blendMode !== undefined) {
      actor.blendMode = blendMode;
    }

    // --- MASK ---
    if (objDef.Initial?.mask) {
      if (!actor.maskFrame) actor.maskFrame = objDef.Initial.mask.frame;
      if (!actor.maskDest && objDef.Initial.mask.dest) {
        actor.maskDest = { ...objDef.Initial.mask.dest };
      }
    }

    const maskDest = interpolatePropertyMultiTrack(tracks, progress, kf => kf.MaskDest, kf => kf.Easing?.MaskDest);
    if (maskDest) {
      actor.maskDest = maskDest;
    }

    // --- CLIP AND FRAME ---
    const { clipName, activationTime } = getClipActivationState(tracks, progress);
    if (clipName) {
      const progressSinceActive = Math.max(0, progress - activationTime);
      const framesSinceActive = progressSinceActive * (event.Duration > 1 ? (event.Duration - 1) : 0);
      const clipTimeInSeconds = framesSinceActive / 60.0;
      const newFrame = getClipFrame(this.clips[clipName], clipTimeInSeconds);
      if (newFrame) {
        actor.frame = newFrame;
      }
    } else {
      const frameName = getLastKnownValueMultiTrack(tracks, progress, kf => kf.Frame);
      if (frameName) {
        actor.frame = frameName;
      }
    }
  }
}