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
import { AnimationState } from './AnimState';
import applyOffset from './AnimState/applyOffset';
// @ts-ignore
const xOffset = animationData.XOffset || 0
applyOffset(animationData, xOffset)
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
					rotation: initial.rotation || 0,
					alpha: initial.alpha !== undefined ? initial.alpha : 1,
					anchor: initial.anchor
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