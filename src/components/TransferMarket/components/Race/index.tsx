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

// --- Enhanced Frame type to include new properties ---
type EnhancedFrame = Frame & {
	targetX?: { name: string; value: number }[];
	cameraHeight?: number;
	dataMultiplier?: number;
};

// --- State tracking for interpolation ---
type InterpolationState = {
	playerPositions: Map<string, number>; // name -> x position
	cameraHeight: number;
};

// --- Component Configuration ---
const BASE_SPEED = 1900;
const DEFAULT_DATA_MULTIPLIER = 0.000075;

export const RaceScene: React.FC<{ 
	currentData?: EnhancedFrame, 
	prevData?: Datum[], 
	progress?: number, 
	passive?: boolean, 
	players?: { 
		name: string, 
		frame: string, 
		scale: number, 
		z: number, 
		x: number, 
		isSubject: boolean, 
		flip?: boolean, 
		noFog?: boolean 
	}[] 
}> = ({ 
	passive, 
	currentData, 
	prevData, 
	progress, 
	players = [
		{ name: "Manchester City", frame: "man_city", scale: 1.6, z: 0, x: -0.5, isSubject: false, flip: true, alpha: 0, noFog: true},
		{ name: "Chelsea FC", frame: "chelsea", scale: 1.6, z: 0, x: 0.5, isSubject: true, flip: true, alpha: 0, noFog: true},
		{ name: "Tottenham Hotspur", frame: "tottenham", scale: 1.6, z: 0, x: 0.5, isSubject: false, flip: true, alpha: 0, noFog: true},
		{ name: "Arsenal FC", frame: "arsenal", scale: 1, z: 0, x: 0.5, isSubject: true, flip: true, alpha: 0, noFog: true},
		{ name: "Manchester United", frame: "man_united", scale: 1.6, z: 0, x: 0, isSubject: false, flip: true, alpha: 0, noFog: true},
		{ name: "Liverpool FC", frame: "liverpool", scale: 1.6, z: 0, x: 0, isSubject: false, flip: true, alpha: 0, noFog: true},
	] 
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameContextRef = useRef<GameContext | null>(null);
	
	// --- Change 1: Use a ref to persist the data multiplier across renders ---
	const dataMultiplierRef = useRef(DEFAULT_DATA_MULTIPLIER);
	
	const [interpolationState, setInterpolationState] = useState<InterpolationState>(() => ({
		playerPositions: new Map(players.map(p => [p.name, p.x])),
		cameraHeight: 0
	}));
	
	const prevFrameDataRef = useRef<{
		targetX?: { name: string; value: number }[];
		cameraHeight?: number;
	}>({});

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
		const dLayers = new DynamicObjects(world);
		DynamicObjects.SCALE = 120;
		world.dLayers = dLayers;
		scene.add(world);
		const gameLoop = getGameLoop({ renderer, fps });

		setInterpolationState(prev => ({
			...prev,
			cameraHeight: world.cameraHeight || 0
		}));

		gameContextRef.current = {
			world,
			gameLoop,
			players: players.map((player, i) => {
				if (passive && i > 0) return null;
				const { frame, x, z, scale, name } = player;
				const p = new DynamicObject({ frame, world, x, z, scale });
				if (passive) { world.setSubject(p); }
				p.name = name;
				p.z0 = z;
				p.x0 = x;
				p.semp = true;
				if (player.noFog) p.noFog = true;
				dLayers.add(p);
				if (player.isSubject) world.setSubject(p);
				return p;
			}).filter((p): p is DynamicObject => !!p)
		};

		setLoadingStatus('ready');
		continueRender(handle);

		return () => { URL.revokeObjectURL(atlasImage.src); };
	}, [loadingStatus, loadedAssets, width, height, fps, handle, players, passive]);

	// --- Helper function to detect frame transitions ---
	const detectFrameTransition = (current: EnhancedFrame | undefined) => {
		// ... (this function is unchanged)
		const prev = prevFrameDataRef.current;
		const hasTargetXChanged = JSON.stringify(current?.targetX) !== JSON.stringify(prev.targetX);
		const hasCameraHeightChanged = current?.cameraHeight !== prev.cameraHeight;
		
		if (hasTargetXChanged || hasCameraHeightChanged) {
			if (gameContextRef.current) {
				const newPlayerPositions = new Map(interpolationState.playerPositions);
				const newCameraHeight = gameContextRef.current.world.cameraHeight || interpolationState.cameraHeight;
				
				if (current?.targetX) {
					current.targetX.forEach(target => {
						const player = gameContextRef.current!.players.find(p => p.name === target.name);
						if (player) {
							newPlayerPositions.set(target.name, player.x);
						}
					});
				}
				
				setInterpolationState({
					playerPositions: newPlayerPositions,
					cameraHeight: newCameraHeight
				});
			}
		}
		
		prevFrameDataRef.current = {
			targetX: current?.targetX,
			cameraHeight: current?.cameraHeight
		};
	};

	// --- PHASE 3: FRAME & DATA UPDATE LOOPS (GUARDED) ---
	useEffect(() => {
		if (loadingStatus !== 'ready' || !gameContextRef.current) return;
		
		const { world, players, gameLoop } = gameContextRef.current;
		const t = frame / fps;
		const deltaTime = 1 / fps;
		const baseMovement = t * BASE_SPEED;
		
		// --- Change 2: Check if a new multiplier is provided and update the ref ---
		// This ensures the value persists on subsequent frames if not specified again.
		if (currentData?.dataMultiplier !== undefined) {
			dataMultiplierRef.current = currentData.dataMultiplier;
		}

		detectFrameTransition(currentData);

		// Handle Z-axis movement (existing logic)
		if (prevData && currentData && progress !== undefined) {
			currentData.data.forEach(d => {
				const player = players.find(p => p.name === d.name);
				if(!player) return;
				const curVal = d.value;
				const prevVal = prevData.find(pd => pd.name === player.name)?.value || 0;
				// --- Change 3: Use the persisted value from the ref ---
				const dataMovement = (prevVal + (curVal - prevVal) * progress) * dataMultiplierRef.current;
				player.z = player.z0 + baseMovement + dataMovement;
			});
		} else if (passive) {
			players.forEach(player => {
				player.z = player.z0 + baseMovement;
			});
		}

		// Handle X-axis interpolation (new logic)
		if (currentData?.targetX && progress !== undefined) {
			// ... (rest of the code is unchanged)
			currentData.targetX.forEach(target => {
				const player = players.find(p => p.name === target.name);
				if (player) {
					const startX = interpolationState.playerPositions.get(target.name) || player.x0 || 0;
					const targetX = target.value;
					player.x = startX + (targetX - startX) * progress;
				}
			});
		}

		// Handle camera height interpolation (new logic)
		if (currentData?.cameraHeight !== undefined && progress !== undefined) {
			const startHeight = interpolationState.cameraHeight;
			const targetHeight = currentData.cameraHeight;
			world.cameraHeight = startHeight + (targetHeight - startHeight) * progress;
		}

		players.forEach(player => player.update());
		
		if (passive) {
			const subjectPlayer = players.find(p => world._subject === p);
			if (subjectPlayer) {
				world.updateState(deltaTime, t);
			}
		} else {
			world.updateState(deltaTime, t);
		}
		
		gameLoop(t);

	}, [loadingStatus, frame, fps, currentData, prevData, progress, passive, interpolationState]);

	// --- Subject change effect ---
	useEffect(() => {
		if (loadingStatus !== 'ready' || !gameContextRef.current) return;
		if (currentData?.subject) {
			const { world, players } = gameContextRef.current;
			const player = players.find(p => p.name === currentData.subject);
			if (player) world.setSubject(player);
		}
	}, [loadingStatus, currentData]);

	if (loadingStatus === 'loading-assets') {
		return null;
	}

	return (
		<canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
	);
};