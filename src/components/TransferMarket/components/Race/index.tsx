import {
	continueRender,
	delayRender,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import animationData from './../../../../../animation.yaml';
// Import watchStaticFile and restartStudio from the Remotion Studio package
import { watchStaticFile, restartStudio } from '@remotion/studio';
import React, { useEffect, useRef, useState } from 'react';

// --- Your library imports ---
// @ts-ignore
import { DynamicObject, DynamicObjects, Node } from './lib/index';
// @ts-ignore
import createRenderer from './lib/renderer/create';
// @ts-ignore
import getGameLoop from './lib/utils/Game/getGameLoop';
// @ts-ignore
import levelData from './levelData';
// @ts-ignore
import World from './lib/entities/World';
// @ts-ignore
import doFacs from './levelData/DoFacs';
// @ts-ignore
import Viewport from './lib/utils/ViewPort';
// @ts-ignore
import { easingFns } from '../../../../../lib/d3/utils/math';

// --- Type Definitions ---
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
}

interface ObjectKeyframe {
	Time: number;
	Clip?: string;
	Frame?: string;
	Position?: Position;
	Scale?: number;
	Alpha?: number;
	Easing?: Record<string, string>;
}

interface ObjectDefinition {
	ID: string;
	Initial: ObjectInitial;
	Keyframes: ObjectKeyframe[];
}

interface CameraKeyframe {
	x?: number;
	y?: number;
	z?: number;
	Easing?: Record<string, string>;
}

interface CameraDefinition {
	Initial: Position;
	Keyframes: Record<string, CameraKeyframe>;
}

interface SequenceEvent {
	EventID: string;
	Duration: number;
	Camera?: CameraDefinition;
	Objects?: ObjectDefinition[];
}

interface AnimationData {
	Clips: Record<string, ClipDefinition>;
	Sequence: SequenceEvent[];
}

type GameContext = {
	world: World;
	actors: DynamicObject[];
	gameLoop: (time: number) => void;
};

type LoadedAssets = {
	atlasImage: HTMLImageElement;
	atlasMetaData: any;
};

type LoadingStatus = 'loading-assets' | 'initializing-engine' | 'ready';

interface ClipDefinition {
	FrameDuration: number;
	Prefix: string;
	Frames: number[];
	Playback: 'Loop' | 'Once';
}

interface ModifierDefinition {
	Type: 'Oscillator' | 'Sequence';
	TargetProperty: 'position.x' | 'position.y' | 'position.z' | 'scale';
	Waveform?: 'Sine' | 'Noise';
	Frequency?: number;
	Playback?: 'Loop';
	Interpolation?: 'SineInOut' | 'Step' | 'Linear';
	Values?: number[];
	CycleDuration?: number;
	Amplitude?: number;
}

interface ObjectKeyframe {
	Time: number;
	Position?: { x?: number; y?: number; z?: number };
	Scale?: number;
	Alpha?: number;
	Frame?: string;
	Clip?: string;
	Flip?: boolean;
	Easing?: Record<string, string>;
	Modifiers?: Record<string, { State?: 'Active' | 'Inactive'; Amplitude?: number }>;
}

interface ObjectDefinition {
	ID: string;
	Initial?: {
		pos?: { x: number; y: number; z: number };
		scale?: number;
		alpha?: number;
		frame?: string;
		flip?: boolean;
	};
	Keyframes?: ObjectKeyframe[];
}

interface CameraKeyframe {
	x?: number;
	y?: number;
	z?: number;
	Easing?: Record<string, string>;
}

interface CameraDefinition {
	Initial?: { x: number; y: number; z: number };
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

// --- Dynamic Object Type (Represents an object in your game/scene) ---
interface DynamicObject {
	id: string; // The ID of the actor
	x: number;
	yOffset: number;
	z: number;
	scale: number;
	alpha: number;
	frame: string;
	flip: boolean;
}

/**
 * =================================================================================
 * Deterministic AnimationState Class
 * =================================================================================
 */
const xOffset = -19.5
animationData.Sequence?.forEach((event) => {
	console.log(event)
	event.Camera.Keyframes && Object.values(event.Camera.Keyframes).forEach(kf => {
		if (kf.x !== undefined) {
			kf.x += xOffset;
		}
	})
	event.Objects?.forEach((obj) => {
		if (obj.Keyframes) {
			obj.Keyframes.forEach((kf) => {
				if (kf.Position && kf.Position.x !== undefined) {
					kf.Position.x += xOffset;
				}
				if (kf.x && kf.x !== undefined) {
					kf.x += xOffset;
				}
			})
			if (obj.Initial.x) {
				obj.Initial.x += xOffset
			}
			if (obj.Initial.pos) {
				obj.Initial.pos.x += xOffset
			}
		}
	})
})
class AnimationState {
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
		this.preprocessSequenceInheritance();
	}

	public setActors(actors: Map<string, DynamicObject>): void {
		this.actors = actors;
	}

	public setCameraSubject(subject: DynamicObject): void {
		this.cameraSubject = subject;
	}
	private getLastKnownValue(
		keyframes: ObjectKeyframe[],
		progress: number,
		propertyAccessor: (kf: ObjectKeyframe) => any
	): any {
		// Returns the last known value at or before the current progress
		// This is used for discrete properties like flip, clip names, etc.
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
	/**
	 * Updates all actors and the camera to a specific frame in the animation sequence.
	 * This is the main entry point for rendering a frame.
	 * @param frame The absolute frame number of the animation.
	 */
	// THE FIX IS HERE: Renamed back to 'updateActors' and kept as an arrow function.
	public updateActors = (frame: number): void => {
		const currentSeq = this.getCurrentSequenceEvent(frame);
		if (!currentSeq) return;

		const { event, progress } = currentSeq;

		if (event.Camera && this.cameraSubject) {
			this.updateCamera(event.Camera, progress);
		}

		if (event.Objects) {
			for (const objDef of event.Objects) {
				const actor = this.actors.get(objDef.ID);
				if (!actor) continue;
				this.updateActor(actor, objDef, event, progress);
			}
		}
	}

	// --- Private Helper Methods ---

	private preprocessSequenceInheritance(): void {
		let lastCameraKeyframe: any = null;
		for (const event of this.sequence) {
			if (event.Camera && event.Camera.Keyframes) {
				const hasZeroKeyframe = '0' in event.Camera.Keyframes || '0.0' in event.Camera.Keyframes;
				if (!hasZeroKeyframe && lastCameraKeyframe) {
					event.Camera.Keyframes['0.0'] = { ...lastCameraKeyframe };
				}
				const keyframeTimes = Object.keys(event.Camera.Keyframes).map(parseFloat).sort((a, b) => b - a);
				if (keyframeTimes.length > 0) {
					const finalTime = keyframeTimes[0].toString();
					const finalKeyframe = event.Camera.Keyframes[finalTime];
					if (finalKeyframe) {
						lastCameraKeyframe = { x: finalKeyframe.x, y: finalKeyframe.y, z: finalKeyframe.z };
					}
				}
			}
			if (event.Objects) {
				for (const objDef of event.Objects) {
					if (objDef.Keyframes && objDef.Initial) {
						const hasZeroKeyframe = objDef.Keyframes.some(kf => kf.Time === 0.0);
						if (!hasZeroKeyframe) {
							const initialKeyframe: ObjectKeyframe = { Time: 0.0 };
							if (objDef.Initial.pos) initialKeyframe.Position = { ...objDef.Initial.pos };
							if (objDef.Initial.scale !== undefined) initialKeyframe.Scale = objDef.Initial.scale;
							if (objDef.Initial.alpha !== undefined) initialKeyframe.Alpha = objDef.Initial.alpha;
							if (objDef.Initial.frame) initialKeyframe.Frame = objDef.Initial.frame;
							if (objDef.Initial.flip !== undefined) initialKeyframe.Flip = objDef.Initial.flip;
							objDef.Keyframes.unshift(initialKeyframe);
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
				// Avoid division by zero and ensure progress reaches 1.0 on the last frame
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

	private updateCamera(cameraDef: CameraDefinition, progress: number): void {
		if (!this.cameraSubject) return;
		const keyframes: any[] = Object.entries(cameraDef.Keyframes)
			.map(([timeStr, keyframe]) => ({
				Time: parseFloat(timeStr),
				x: keyframe.x,
				y: keyframe.y,
				z: keyframe.z,
				Easing: keyframe.Easing
			}))
			.sort((a, b) => a.Time - b.Time);


		// Interpolate each axis separately with its own easing (or fallback to Position easing)
		const x = this.interpolateProperty(keyframes, progress, kf => kf.x, kf => {
			const result = kf.Easing?.x || kf.Easing?.Position;
			return result;
		});
		const y = this.interpolateProperty(keyframes, progress, kf => kf.y, kf => kf.Easing?.y || kf.Easing?.Position);
		const z = this.interpolateProperty(keyframes, progress, kf => kf.z, kf => kf.Easing?.z || kf.Easing?.Position);

		if (x !== undefined) this.cameraSubject.x = x;
		if (y !== undefined) this.cameraSubject.yOffset = y;
		if (z !== undefined) this.cameraSubject.z = z;
	}
	private updateActor(actor: DynamicObject, objDef: ObjectDefinition, event: SequenceEvent, progress: number): void {
		const keyframes = objDef.Keyframes || [];

		const basePosition = this.interpolateProperty(keyframes, progress, kf => kf.Position, kf => kf.Easing?.Position) || {};
		const baseScale = this.interpolateProperty(keyframes, progress, kf => kf.Scale, kf => kf.Easing?.Scale);
		const baseAlpha = this.interpolateProperty(keyframes, progress, kf => kf.Alpha, kf => kf.Easing?.Alpha);

		const clipName = this.interpolateProperty(keyframes, progress, kf => kf.Clip, () => undefined);
		const frameName = this.interpolateProperty(keyframes, progress, kf => kf.Frame, () => undefined);
		let flip = this.getLastKnownValue(keyframes, progress, kf => kf.Flip);
		if (flip === undefined && objDef.Initial?.flip !== undefined) {
			flip = objDef.Initial.flip;
		}

		const totalOffsets = { position: { x: 0, y: 0, z: 0 }, scale: 0 };
		for (const modName in this.modifiers) {
			const modDef = this.modifiers[modName];
			const { isActive, params, activationTime } = this.getModifierStateAtProgress(keyframes, progress, modName);

			if (isActive) {
				const timeSinceActive = (progress - activationTime) * event.Duration / 60;
				const offset = this.calculateModifierOffset(modDef, params, timeSinceActive);

				if (offset.position) {
					totalOffsets.position.x += offset.position.x || 0;
					totalOffsets.position.y += offset.position.y || 0;
					totalOffsets.position.z += offset.position.z || 0;
				}
				if (offset.scale !== undefined) {
					totalOffsets.scale += offset.scale;
				}
			}
		}

		if (basePosition.x !== undefined) actor.x = basePosition.x + totalOffsets.position.x;
		if (basePosition.y !== undefined) actor.yOffset = basePosition.y + totalOffsets.position.y;
		if (basePosition.z !== undefined) actor.z = basePosition.z + totalOffsets.position.z;
		if (baseScale !== undefined) actor.scale = baseScale + totalOffsets.scale;
		if (baseAlpha !== undefined) actor.alpha = baseAlpha;
		if (flip !== undefined) actor.flip = flip;

		if (frameName) actor.frame = frameName;
		else if (clipName) {
			const clipTime = progress * event.Duration / 60;
			const newFrame = this.getClipFrame(clipName, clipTime);
			if (newFrame) actor.frame = newFrame;
		}
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
					activationTime = relevantKeyframes[i + 1].Time; break;
				}
				activationTime = kf.Time;
			}
		}
		return { isActive: lastKnownState, params: lastKnownParams, activationTime };
	}

	private calculateModifierOffset(
		modDef: ModifierDefinition,
		params: { Amplitude?: number },
		time: number
	): { position?: { x?: number; y?: number; z?: number }; scale?: number } {
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
		}
		return result;
	}
}

// --- Main Component ---
export const RaceScene: React.FC<{
	data?: string,
	cameraSubjectSprite?: string
}> = ({
	data = "animation.yaml",
	cameraSubjectSprite = "dot"
}) => {
		const canvasRef = useRef<HTMLCanvasElement>(null);
		const gameContextRef = useRef<GameContext | null>(null);
		const animationStateRef = useRef<AnimationState | null>(null);

		const { width, height, fps } = useVideoConfig();
		const frame = useCurrentFrame();

		const [handle] = useState(() => delayRender("Loading game assets..."));
		const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('loading-assets');
		const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);

		// --- PHASE 1: ASSET LOADING EFFECT (SIMPLIFIED) ---
		useEffect(() => {
			(async () => {
				try {
					const atlasImgUrl = staticFile('texatlas/texatlas.png');
					const atlasMetaUrl = staticFile('texatlas/atlasmeta.cson');

					// Load only the image assets here
					const [atlasImageResponse, atlasMetaData] = await Promise.all([
						fetch(atlasImgUrl).then((res) => res.blob()),
						fetch(atlasMetaUrl).then((res) => res.json()),
					]);

					const atlasImage = new Image();
					atlasImage.src = URL.createObjectURL(atlasImageResponse);
					await atlasImage.decode();

					setLoadedAssets({ atlasImage, atlasMetaData });
					// The animationData is already loaded, so we can proceed
					setLoadingStatus('initializing-engine');
				} catch (err) {
					console.error('Failed to load assets:', err);
					continueRender(handle);
				}
			})();
		}, [handle]); // data prop is removed from dependencies


		// --- NEW: EFFECT FOR WATCHING YAML FILE AND RELOADING THE STUDIO ---
		useEffect(() => {
			if (!data) {
				return;
			}

			// watchStaticFile will notify us of changes to the specified file.
			const watcher = watchStaticFile(data, async (newFile) => {
				if (newFile) {
					try {
						// Restart the entire Remotion Studio to ensure a clean state
						await restartStudio();
					} catch (err) {
						console.error("Failed to restart Studio:", err);
					}
				} else {
					try {
						await restartStudio();
					} catch (err) {
						console.error("Failed to restart Studio:", err);
					}
				}
			});

			// Cleanup function to stop watching when the component unmounts.
			return () => {
				watcher.cancel();
			};
		}, [data]);


		// --- PHASE 2: ENGINE INITIALIZATION EFFECT ---
		useEffect(() => {
			if (loadingStatus !== 'initializing-engine' || !loadedAssets || !canvasRef.current || !animationData) {
				return;
			}

			const { atlasImage, atlasMetaData } = loadedAssets;
			const canvas = canvasRef.current;
			const viewport = new Viewport({ width, height });
			const renderer = createRenderer({ canvas, scene: null, background: '#000000', viewport });

			DynamicObject.injectViewport(viewport);
			DynamicObject.injectAtlasMeta(atlasMetaData);
			renderer.setTexatlas(atlasImage, atlasMetaData);

			const scene = new Node();
			renderer.scene = scene;

			const world = new World({
				renderer,
				atlasMeta: atlasMetaData,
				doFacs,
				segmentGenerator: (levelData as any).segmentGenerator,
				...((levelData as any).world),
				viewport
			});

			// Create camera subject
			const cameraSubject = new DynamicObject({
				frame: cameraSubjectSprite,
				world: world,
				x: 0,
				yOffset: 0,
				z: 1000,
				scale: 1,
				rotation: 0,
				semp: true,
				alpha: 0
			});
			const dLayers = new DynamicObjects(world);
			DynamicObjects.SCALE = 120;
			world.dLayers = dLayers;
			scene.add(world);
			dLayers.add(cameraSubject);
			world.setSubject(cameraSubject);
			// Initialize animation system
			const animationState = new AnimationState(animationData);
			animationState.setCameraSubject(cameraSubject);

			// Create actors from animation data
			const actors: DynamicObject[] = [];
			const actorMap = new Map<string, DynamicObject>();

			// Collect all unique objects from all sequences
			const allObjects = new Set<string>();
			animationData.Sequence.forEach(seq => {
				seq.Objects?.forEach(obj => allObjects.add(obj.ID));
			});

			// Create actors for all objects
			for (const objectId of allObjects) {
				// Find the first definition of this object to get initial state
				let objectDef: ObjectDefinition | undefined;
				for (const seq of animationData.Sequence) {
					objectDef = seq.Objects?.find(obj => obj.ID === objectId);
					if (objectDef) break;
				}

				if (!objectDef) continue;

				const initial = objectDef.Initial;
				const actor = new DynamicObject({
					frame: initial.frame || 'default',
					world: world,
					x: initial.pos?.x || 0,
					yOffset: initial.pos?.y || 0,
					z: initial.pos?.z || 0,
					scale: initial.scale || 1,
					rotation: 0,
					alpha: initial.alpha !== undefined ? initial.alpha : 1
				});

				actor.name = objectId;
				actor.semp = true;
				dLayers.add(actor);
				actors.push(actor);
				actorMap.set(objectId, actor);
			}

			animationState.setActors(actorMap);
			animationStateRef.current = animationState;

			const gameLoop = getGameLoop({ renderer, fps });

			gameContextRef.current = {
				world,
				gameLoop,
				actors
			};

			setLoadingStatus('ready');
			continueRender(handle);

			return () => {
				URL.revokeObjectURL(atlasImage.src);
			};
		}, [loadingStatus, loadedAssets, width, height, fps, handle, animationData]);

		// --- PHASE 3: FRAME & DATA UPDATE LOOPS ---
		useEffect(() => {
			if (loadingStatus !== 'ready' || !gameContextRef.current || !animationStateRef.current) return;

			const { world, actors, gameLoop } = gameContextRef.current;
			const animationState = animationStateRef.current;

			const t = frame / fps;
			const deltaTime = 1 / fps;
			// Update animation state with raw frame number
			animationState.updateActors(frame, deltaTime);

			// Update all actors
			actors.forEach(actor => actor.update());

			// Update world state
			world.subject.update()
			world.updateState(deltaTime, t);
			// Render
			gameLoop(t);
		}, [loadingStatus, frame, fps]);

		if (loadingStatus === 'loading-assets') {
			return null;
		}

		return (
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					position: "absolute",
					backgroundSize: "contain",
					top: 0,
					left: 0
				}}
			/>
		);
	};