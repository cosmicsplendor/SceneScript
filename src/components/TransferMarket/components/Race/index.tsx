import {
	AbsoluteFill,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import React, { useEffect, useMemo, useRef } from 'react';

// --- Step 1: Import your custom library ---
// These imports now automatically pick up the types from their corresponding .d.ts files.
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

// Define a strict type for the context object to be stored in the ref.
// The types `World`, `DynamicObject`, etc. are now properly recognized.
type GameContext = {
	world: World;
	players: any[],
	gameLoop: (time: number) => void;
};

// Configuration for base movement
const BASE_SPEED = 1400; // Units per second - adjust this value to control base speed
const DATA_MULTIPLIER = 300; // Keep your existing data-driven multiplier

export const RaceScene: React.FC<{ currentData?: Frame, prevData?: Datum[], progress?: number, passive?: boolean, players?: { name: string, frame: string, scale: number, z: number, x: number, isSubject: boolean }[] }> = ({ passive, currentData, prevData, progress, players = [
	{ name: "Ronaldo", frame: "ronaldo", scale: 0.6, z: 3000, x: 0.36, isSubject: false },
	{ name: "Messi", frame: "messi", scale: 0.6, z: 3000, x: -0.36, isSubject: true }
] }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameContextRef = useRef<GameContext | null>(null);

	const { width, height, fps } = useVideoConfig();
	const frame = useCurrentFrame();

	// Initialization logic - This part remains the same.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		(async () => {
			try {
				// Asset Loading
				const atlasImgUrl = staticFile('texatlas/texatlas.png');
				const atlasMetaUrl = staticFile('texatlas/atlasmeta.cson');

				const [atlasImageResponse, atlasMetaResponse] = await Promise.all([
					fetch(atlasImgUrl).then((res) => res.blob()),
					fetch(atlasMetaUrl).then((res) => res.json()),
				]);

				const atlasImage = new Image();
				atlasImage.src = URL.createObjectURL(atlasImageResponse);
				await atlasImage.decode();

				const atlasMetaData = atlasMetaResponse;
				console.log({ width, height })
				// Scene Initialization
				const viewport = new Viewport({ width, height });
				const renderer = createRenderer({
					canvas,
					scene: null,
					background: '#000000',
					viewport,
				});

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
					...(levelData as any).world,
					viewport,
				});

				const dLayers = new DynamicObjects(world);
				DynamicObjects.SCALE = 120;
				world.dLayers = dLayers;
				scene.add(world);

				// @ts-ignore
				const gameLoop = getGameLoop({ renderer, fps });

				gameContextRef.current = {
					world, gameLoop, players: players.map((player, i) => {
						if (passive && i > 0) return
						const { frame, x, z, scale, name } = player
						const p = new DynamicObject({ frame, world, x, z, scale })
						if (passive) {
							p.x = 0
							p.alpha = 0
							world.setSubject(p)
						}
						p.name = name
						p.z0 = z
						p.semp = true
						dLayers.add(p)
						if (player.isSubject) world.setSubject(p)
						return p
					}).filter(x => !!x)
				};

				URL.revokeObjectURL(atlasImage.src);
			} catch (err) {
				console.error('Failed to initialize Remotion game scene:', err);
			}
		})();
	}, [width, height, fps]);

	useEffect(() => {
		if (!gameContextRef.current) return
		const t = frame / fps;
		const deltaTime = 1 / fps;
		const { world, players, gameLoop } = gameContextRef.current;
		const baseMovement = t * BASE_SPEED;
		if (prevData && currentData && progress) {
			currentData.data.forEach(d => {
				const player = players.find(p => p.name === d.name)
				const curVal = d.value
				const prevVal = prevData.find(d => d.name === player.name)?.value || 0

				// Combine base movement with data-driven movement
				const dataMovement = (prevVal + (curVal - prevVal) * progress) * DATA_MULTIPLIER;
				player.z = player.z0 + baseMovement + dataMovement;
			})
		} else if (passive) {
			players.forEach(player => {
				player.z = player.z0 + baseMovement
			})
		}

		world.updateState(deltaTime, t);
		gameLoop(t);

	}, [currentData, prevData, progress, frame, fps])

	useEffect(() => {
		if (currentData && currentData.subject && gameContextRef.current) {
			const { world, players } = gameContextRef.current;
			const player = players.find(p => p.name === currentData.subject)
			if (player) {
				world.setSubject(player)
			}
		}
	}, [currentData])

	return (
		<canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
	);
};