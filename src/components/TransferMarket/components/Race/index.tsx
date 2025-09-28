import {
	continueRender,
	delayRender,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
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

// --- Type Definitions for State Management ---
type GameContext = {
	world: World;
	actors: DynamicObject[]; // Or more specific type like `DynamicObject[]`
	gameLoop: (time: number) => void;
};
type LoadedAssets = {
	atlasImage: HTMLImageElement;
	atlasMetaData: any; // Or a more specific type if you have one
};
type LoadingStatus = 'loading-assets' | 'initializing-engine' | 'ready';

export const RaceScene: React.FC<{ 
	currentData?: string, 
	cameraSubjectSprite?: string
}> = ({ 
	data, // yaml string
	cameraSubjectSprite="dot"
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameContextRef = useRef<GameContext | null>(null);

	const { width, height, fps } = useVideoConfig();
	const frame = useCurrentFrame();

	const [handle] = useState(() => delayRender("Loading game assets..."));
	const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('loading-assets');
	const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);

	// --- PHASE 1: ASSET LOADING EFFECT ---
	useEffect(() => {
		(async () => {
			try {
				const atlasImgUrl = staticFile('texatlas/texatlas.png');
				const atlasMetaUrl = staticFile('texatlas/atlasmeta.cson');

				const [atlasImageResponse, atlasMetaData] = await Promise.all([
					fetch(atlasImgUrl).then((res) => res.blob()),
					fetch(atlasMetaUrl).then((res) => res.json()),
				]);

				const atlasImage = new Image();
				atlasImage.src = URL.createObjectURL(atlasImageResponse);
				await atlasImage.decode();

				setLoadedAssets({ atlasImage, atlasMetaData });
				setLoadingStatus('initializing-engine');
			} catch (err) {
				console.error('Failed to load assets:', err);
				continueRender(handle);
			}
		})();
	}, [handle]);

	// --- PHASE 2: ENGINE INITIALIZATION EFFECT ---
	useEffect(() => {
		if (loadingStatus !== 'initializing-engine' || !loadedAssets || !canvasRef.current) {
			return;
		}
		// ... (rest of the initialization code is unchanged)
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
		const cameraSubject = new DynamicObject({ frame: cameraSubjectSprite,
			 world: world, x: 0, yOffset: 0, z: 0, scale: 1, rotation: 0, alpha: 0 // hide subject that camera is centered/focused at 
		}); // basically supposed to initially be derived from initial camera state and updated accordingly
		const dLayers = new DynamicObjects(world);
		DynamicObjects.SCALE = 120;
		world.dLayers = dLayers;
		world.subject = cameraSubject
		scene.add(world);
		const gameLoop = getGameLoop({ renderer, fps });

		gameContextRef.current = {
			world,
			gameLoop,
			actors: flattenToGetAllActors.map((actor, i) => {
				const { frame, x, y, z, scale, rotation, name, alpha } = computedInitialState; // grab initial properties
				const p = new DynamicObject({ frame, world, x, z, yOffset: y, rotation, alpha, scale });
				p.name = name;
				p.semp = true; // all actors are semps
				dLayers.add(p);
				return p;
			})
		};

		setLoadingStatus('ready');
		continueRender(handle);

		return () => { URL.revokeObjectURL(atlasImage.src); };
	}, [loadingStatus, loadedAssets, width, height, fps, handle]);

	// --- PHASE 3: FRAME & DATA UPDATE LOOPS (GUARDED) ---
	useEffect(() => {
		if (loadingStatus !== 'ready' || !gameContextRef.current) return;
		
		const { world, actors, gameLoop } = gameContextRef.current;
		const t = frame / fps;
		const deltaTime = 1 / fps;
	
		// based on the properties
		actors.forEach(actor => actor.update());
		world.updateState(deltaTime, t);
		gameLoop(t);

	}, [loadingStatus, frame, fps]);

	if (loadingStatus === 'loading-assets') {
		return null;
	}

	return (
		<canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
	);
};