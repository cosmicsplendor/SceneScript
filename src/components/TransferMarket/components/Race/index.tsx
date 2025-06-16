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
import { Datum, Frame } from '../../helpers';
// --- Type Definitions for State Management ---
type GameContext = {
	world: World;
	players: any[]; // Or more specific type like `DynamicObject[]`
	gameLoop: (time: number) => void;
};
type LoadedAssets = {
	atlasImage: HTMLImageElement;
	atlasMetaData: any; // Or a more specific type if you have one
};
type LoadingStatus = 'loading-assets' | 'initializing-engine' | 'ready';


// --- Component Configuration ---
const BASE_SPEED = 1000;
const DATA_MULTIPLIER = 300;

export const RaceScene: React.FC<{ currentData?: Frame, prevData?: Datum[], progress?: number, passive?: boolean, players?: { name: string, frame: string, scale: number, z: number, x: number, isSubject: boolean, flip?: boolean }[] }> = ({ passive, currentData, prevData, progress, players = [
	{ name: "Pep_Slot", frame: "pep_slot", scale: 0.7, z: 0, x: 0.36, isSubject: false, flip: true },
] }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameContextRef = useRef<GameContext | null>(null);

	const { width, height, fps } = useVideoConfig();
	const frame = useCurrentFrame();

	// --- State Management for the Loading Process ---
	const [handle] = useState(() => delayRender("Loading game assets..."));
	const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('loading-assets');
	const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);


	// --- PHASE 1: ASSET LOADING EFFECT ---
	// This effect runs once on mount. It has no dependency on the canvas.
	// Its only job is to fetch data and trigger the next phase.
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

				// Store the loaded assets in state and move to the next phase
				setLoadedAssets({ atlasImage, atlasMetaData });
				setLoadingStatus('initializing-engine');
			} catch (err) {
				console.error('Failed to load assets:', err);
				continueRender(handle); // Unpause on error to avoid timeout
			}
		})();
	}, [handle]); // Runs only once


	// --- PHASE 2: ENGINE INITIALIZATION EFFECT ---
	// This effect only runs when we enter the 'initializing-engine' state.
	useEffect(() => {
		// This guard ensures this logic runs exactly once, at the right time.
		if (loadingStatus !== 'initializing-engine' || !loadedAssets || !canvasRef.current) {
			return;
		}

		const { atlasImage, atlasMetaData } = loadedAssets;
		const canvas = canvasRef.current;

		// All your synchronous engine setup code is now guaranteed to have what it needs.
		const viewport = new Viewport({ width, height });
		const renderer = createRenderer({ canvas, scene: null, background: '#000000', viewport });
		DynamicObject.injectViewport(viewport);
		DynamicObject.injectAtlasMeta(atlasMetaData);
		renderer.setTexatlas(atlasImage, atlasMetaData);
		const scene = new Node();
		renderer.scene = scene;
		const world = new World({ renderer, atlasMeta: atlasMetaData, doFacs, segmentGenerator: (levelData as any).segmentGenerator, ...((levelData as any).world), viewport });
		const dLayers = new DynamicObjects(world);
		DynamicObjects.SCALE = 120;
		world.dLayers = dLayers;
		scene.add(world);
		const gameLoop = getGameLoop({ renderer, fps });

		gameContextRef.current = {
			world,
			gameLoop,
			players: players.map((player, i) => {
				if (passive && i > 0) return null;
				const { frame, x, z, scale, name } = player;
				const p = new DynamicObject({ frame, world, x, z, scale });
				if (passive) { p.x = 0; world.setSubject(p); }
				p.name = name;
				p.z0 = z;
				p.semp = true;
				dLayers.add(p);
				if (player.isSubject) world.setSubject(p);
				return p;
			}).filter((p): p is DynamicObject => !!p)
		};
		
		// Setup complete. Move to the final 'ready' state and unpause Remotion.
		setLoadingStatus('ready');
		continueRender(handle);

		return () => { URL.revokeObjectURL(atlasImage.src); };
	}, [loadingStatus, loadedAssets, width, height, fps, handle, players, passive]);


	// --- PHASE 3: FRAME & DATA UPDATE LOOPS (GUARDED) ---
	useEffect(() => {
		// Guard ensures this only runs when the engine is fully ready.
		if (loadingStatus !== 'ready' || !gameContextRef.current) return;
		
		const { world, players, gameLoop } = gameContextRef.current;
		const t = frame / fps;
		const deltaTime = 1 / fps;
		const baseMovement = t * BASE_SPEED;

		if (prevData && currentData && progress !== undefined) {
			currentData.data.forEach(d => {
				const player = players.find(p => p.name === d.name);
				if(!player) return;
				const curVal = d.value;
				const prevVal = prevData.find(pd => pd.name === player.name)?.value || 0;
				const dataMovement = (prevVal + (curVal - prevVal) * progress) * DATA_MULTIPLIER;
				player.z = player.z0 + baseMovement + dataMovement;
				player.update();
			});
			world.updateState(deltaTime, t);
		} else if (passive) {
			players.forEach(player => {
				player.z = player.z0 + baseMovement;
				player.update();
				if (world._subject === player) {
					world.updateState(deltaTime, t);
				}
			});
		}
		gameLoop(t);

	}, [loadingStatus, frame, fps, currentData, prevData, progress, passive]);

	useEffect(() => {
		if (loadingStatus !== 'ready' || !gameContextRef.current) return;
		if (currentData?.subject) {
			const { world, players } = gameContextRef.current;
			const player = players.find(p => p.name === currentData.subject);
			if (player) world.setSubject(player);
		}
	}, [loadingStatus, currentData]);


	// --- STATE-DRIVEN RENDER FUNCTION ---
	// Render `null` until the assets are loaded. Once they are, render the canvas
	// to make it available for the engine initialization phase.
	if (loadingStatus === 'loading-assets') {
		return null;
	}

	return (
		<canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
	);
};