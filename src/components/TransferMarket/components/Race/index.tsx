import {
	continueRender,
	delayRender,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import animationData from './../../../../../animation.yaml';
// Import watchStaticFile and restartStudio from the Remotion Studio package
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
import { AnimationState } from './AnimState';
import applyOffset from './AnimState/applyOffset';
import fastForwardSequence from './AnimState/fastforwardSequence';
import getStartSequenceFrame from './AnimState/getStartSequenceFrame';
type GameContext = {
	world: World;
	actors: any[];
	gameLoop: (time: number) => void;
};
type LoadedAssets = {
	atlasImage: HTMLImageElement;
	atlasMetaData: any;
};
type LoadingStatus = 'loading-assets' | 'initializing-engine' | 'ready';
export const startSequenceFrame = getStartSequenceFrame(animationData)
const xOffset = animationData.XOffset || 0
const zOffset = animationData.ZOffset || 0
applyOffset(animationData, xOffset, zOffset)
fastForwardSequence(animationData)
// --- Main Component ---
export const raceSceneObjectRegistry = new Map<string, DynamicObject>()
export const RaceScene: React.FC<{
	data?: Object,
	cameraSubjectSprite?: string
}> = ({
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
				viewport,
				ORIGIN_Y: animationData.ORIGIN_Y
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
			raceSceneObjectRegistry.clear();
			world.dLayers = dLayers;
			scene.add(world);
			dLayers.add(cameraSubject);
			// Initialize animation system
			const animationState = new AnimationState(animationData);

			// Create actors from animation data
			const actors: DynamicObject[] = [];
			const actorMap = new Map<string, DynamicObject>();

			// Collect all unique objects from all sequences
			const allObjects = new Set<string>();
			const startSeqIdx = animationData.HidePrevious && animationData.StartSequence ? animationData.Sequence.findIndex(x => animationData.StartSequence === x.EventID): 0
			const endSeqIdx = animationData.EndSequence ? animationData.Sequence.findIndex(x => animationData.EndSequence === x.EventID): animationData.Sequence.length
			animationData.Sequence.slice(startSeqIdx, endSeqIdx).forEach(seq => {
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
					rotation: initial.rotation || 0,
					alpha: initial.alpha !== undefined ? initial.alpha : 1,
					anchor: initial.anchor,
					flip: initial.flip || false,
					noCull: initial.noCull
				});
				raceSceneObjectRegistry.set(objectId, actor);
				actor.name = objectId;
				actor.semp = true;
				dLayers.add(actor);
				actors.push(actor);
				actorMap.set(objectId, actor);
			}

			animationState.setActors(actorMap);
			animationState.updateActors(0);
			world.setSubject(cameraSubject);
			animationState.setCameraSubject(cameraSubject);
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
			animationState.updateActors(frame);

			// Update all actors
			actors.forEach(actor => actor.update());

			// Update world state
			// Note: world.subject is the camera, so world.subject.update() is the camera's own update logic
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