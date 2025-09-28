import {
	continueRender,
	delayRender,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import React, { useEffect, useRef, useState } from 'react';
import * as yaml from 'js-yaml';

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

// --- Animation State Management ---
class AnimationState {
	private clips: Record<string, ClipDefinition> = {};
	private sequence: SequenceEvent[] = [];
	private actors: Map<string, DynamicObject> = new Map();
	private cameraSubject: DynamicObject | null = null;

	constructor(animationData: AnimationData) {
		this.clips = animationData.Clips || {};
		this.sequence = animationData.Sequence || [];
	}

	setActors(actors: Map<string, DynamicObject>) {
		this.actors = actors;
	}

	setCameraSubject(subject: DynamicObject) {
		this.cameraSubject = subject;
	}

	// Get current sequence event based on frame
	getCurrentSequenceEvent(frame: number): { event: SequenceEvent; localFrame: number; progress: number } | null {
		let currentFrame = 0;

		for (const event of this.sequence) {
			if (frame >= currentFrame && frame < currentFrame + event.Duration) {
				const localFrame = frame - currentFrame;
				const progress = localFrame / event.Duration;
				return { event, localFrame, progress };
			}
			currentFrame += event.Duration;
		}

		return null;
	}

	// Get clip frame for a given time
	getClipFrame(clipName: string, time: number): string | null {
		const clip = this.clips[clipName];
		if (!clip) return null;

		const cycleDuration = clip.Frames.length * clip.FrameDuration;
		let adjustedTime = time;

		if (clip.Playback === 'Loop') {
			adjustedTime = time % cycleDuration;
		} else if (time >= cycleDuration) {
			// For 'Once', stick to the last frame after completion
			adjustedTime = cycleDuration - 0.001; // Just before the end
		}

		const frameIndex = Math.floor(adjustedTime / clip.FrameDuration);
		const clampedIndex = Math.min(frameIndex, clip.Frames.length - 1);
		const frameNumber = clip.Frames[clampedIndex];

		return `${clip.Prefix}${frameNumber}`;
	}

	// Interpolate between keyframes
	interpolateProperty(
		keyframes: ObjectKeyframe[],
		progress: number,
		property: string,
		easingProperty?: string
	): any {
		// Sort keyframes by time
		const sortedKeyframes = [...keyframes].sort((a, b) => a.Time - b.Time);

		// Find the two keyframes we're between
		let prevKeyframe = sortedKeyframes[0];
		let nextKeyframe = sortedKeyframes[sortedKeyframes.length - 1];

		for (let i = 0; i < sortedKeyframes.length - 1; i++) {
			if (progress >= sortedKeyframes[i].Time && progress <= sortedKeyframes[i + 1].Time) {
				prevKeyframe = sortedKeyframes[i];
				nextKeyframe = sortedKeyframes[i + 1];
				break;
			}
		}

		const prevValue = this.getPropertyValue(prevKeyframe, property);
		const nextValue = this.getPropertyValue(nextKeyframe, property);

		if (prevValue === undefined || nextValue === undefined) {
			return prevValue !== undefined ? prevValue : nextValue;
		}

		// If times are the same, return next value
		if (nextKeyframe.Time === prevKeyframe.Time) {
			return nextValue;
		}

		// Calculate interpolation progress
		const localProgress = (progress - prevKeyframe.Time) / (nextKeyframe.Time - prevKeyframe.Time);

		// Apply easing if specified
		let easedProgress = localProgress;
		if (prevKeyframe.Easing && easingProperty && prevKeyframe.Easing[easingProperty]) {
			const easingName = prevKeyframe.Easing[easingProperty];
			if (easingFns[easingName]) {
				easedProgress = easingFns[easingName](localProgress);
			}
		}

		// Handle different property types
		if (typeof prevValue === 'number' && typeof nextValue === 'number') {
			return prevValue + (nextValue - prevValue) * easedProgress;
		}

		if (typeof prevValue === 'object' && typeof nextValue === 'object') {
			const result: any = {};
			const keys = new Set([...Object.keys(prevValue), ...Object.keys(nextValue)]);

			for (const key of keys) {
				const prev = prevValue[key] !== undefined ? prevValue[key] : nextValue[key];
				const next = nextValue[key] !== undefined ? nextValue[key] : prevValue[key];

				if (typeof prev === 'number' && typeof next === 'number') {
					result[key] = prev + (next - prev) * easedProgress;
				} else {
					result[key] = easedProgress < 0.5 ? prev : next;
				}
			}
			return result;
		}

		// For non-numeric values, use step interpolation
		return easedProgress < 0.5 ? prevValue : nextValue;
	}

	// Get property value from keyframe
	private getPropertyValue(keyframe: ObjectKeyframe, property: string): any {
		switch (property) {
			case 'Position':
				return keyframe.Position;
			case 'Scale':
				return keyframe.Scale;
			case 'Alpha':
				return keyframe.Alpha;
			case 'Frame':
				return keyframe.Frame;
			case 'Clip':
				return keyframe.Clip;
			default:
				return undefined;
		}
	}

	// Update all actors based on current progress
	updateActors(progress: number, deltaTime: number) {
		const currentSeq = this.getCurrentSequenceEvent(Math.floor(progress * 1000)); // Convert to frame-like number
		if (!currentSeq) return;

		const { event } = currentSeq;

		// Update camera
		if (event.Camera && this.cameraSubject) {
			this.updateCamera(event.Camera, progress);
		}

		// Update objects
		if (event.Objects) {
			for (const objDef of event.Objects) {
				const actor = this.actors.get(objDef.ID);
				if (!actor) continue;

				this.updateActor(actor, objDef, progress, deltaTime);
			}
		}
	}

	private updateCamera(cameraDef: CameraDefinition, progress: number) {
		if (!this.cameraSubject) return;

		// Convert camera keyframes to array format
		const keyframes: any[] = [];
		for (const [timeStr, keyframe] of Object.entries(cameraDef.Keyframes)) {
			keyframes.push({
				Time: parseFloat(timeStr),
				Position: { x: keyframe.x, y: keyframe.y, z: keyframe.z },
				Easing: keyframe.Easing
			});
		}

		const position = this.interpolateProperty(keyframes, progress, 'Position', 'Position');

		if (position) {
			if (position.x !== undefined) this.cameraSubject.x = position.x;
			if (position.y !== undefined) this.cameraSubject.yOffset = position.y;
			if (position.z !== undefined) this.cameraSubject.z = position.z;
		}
	}

	private updateActor(actor: DynamicObject, objDef: ObjectDefinition, progress: number, deltaTime: number) {
		// Handle clips first
		const currentClip = this.interpolateProperty(objDef.Keyframes, progress, 'Clip');
		if (currentClip && this.clips[currentClip]) {
			const clipFrame = this.getClipFrame(currentClip, progress * 10); // Scale time appropriately
			if (clipFrame) {
				actor.frame = clipFrame;
			}
		}

		// Handle frame changes (overrides clip if specified)
		const currentFrame = this.interpolateProperty(objDef.Keyframes, progress, 'Frame');
		if (currentFrame) {
			actor.frame = currentFrame;
		}

		// Handle position
		const position = this.interpolateProperty(objDef.Keyframes, progress, 'Position', 'Position');
		if (position) {
			if (position.x !== undefined) actor.x = position.x;
			if (position.y !== undefined) actor.yOffset = position.y;
			if (position.z !== undefined) actor.z = position.z;
		}

		// Handle scale
		const scale = this.interpolateProperty(objDef.Keyframes, progress, 'Scale', 'Scale');
		if (scale !== undefined) {
			actor.scale = scale;
		}

		// Handle alpha
		const alpha = this.interpolateProperty(objDef.Keyframes, progress, 'Alpha', 'Alpha');
		if (alpha !== undefined) {
			actor.alpha = alpha;
		}
	}
}

export const RaceScene: React.FC<{
	data?: string,
	cameraSubjectSprite?: string
}> = ({
	data="animation.yaml",
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

		const [animationData, setAnimationData] = useState<AnimationData | null>(null);

		// --- PHASE 1: ASSET LOADING EFFECT ---
		useEffect(() => {
			(async () => {
				try {
					const atlasImgUrl = staticFile('texatlas/texatlas.png');
					const atlasMetaUrl = staticFile('texatlas/atlasmeta.cson');
					const animationDataUrl = data ? staticFile(data) : null;

					// Load assets and animation data
					const promises = [
						fetch(atlasImgUrl).then((res) => res.blob()),
						fetch(atlasMetaUrl).then((res) => res.json()),
					];

					if (animationDataUrl) {
						promises.push(fetch(animationDataUrl).then((res) => res.text()));
					}

					const [atlasImageResponse, atlasMetaData, yamlText] = await Promise.all(promises);

					const atlasImage = new Image();
					atlasImage.src = URL.createObjectURL(atlasImageResponse);
					await atlasImage.decode();

					// Parse YAML data if provided
					let parsedAnimationData: AnimationData | null = null;
					if (yamlText) {
						try {
							parsedAnimationData = yaml.load(yamlText as string) as AnimationData;
						} catch (error) {
							console.error('Failed to parse YAML data:', error);
						}
					}

					setLoadedAssets({ atlasImage, atlasMetaData });
					setAnimationData(parsedAnimationData);
					setLoadingStatus('initializing-engine');
				} catch (err) {
					console.error('Failed to load assets:', err);
					continueRender(handle);
				}
			})();
		}, [handle, data]);

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
				z: 0,
				scale: 1,
				rotation: 0,
				alpha: 0
			});

			const dLayers = new DynamicObjects(world);
			DynamicObjects.SCALE = 120;
			world.dLayers = dLayers;
			world.subject = cameraSubject;
			scene.add(world);

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

			// Update animation state
			animationState.updateActors(frame, deltaTime);

			// Update all actors
			actors.forEach(actor => actor.update());

			// Update world state
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
					top: 0,
					left: 0
				}}
			/>
		);
	};