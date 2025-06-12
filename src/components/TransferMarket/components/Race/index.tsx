import {
	AbsoluteFill,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import React, {useEffect, useRef} from 'react';

// --- Step 1: Import your custom library ---
// These imports now automatically pick up the types from their corresponding .d.ts files.
// @ts-ignore
import {DynamicObject, DynamicObjects, Node} from './lib/index';
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

// Define a strict type for the context object to be stored in the ref.
// The types `World`, `DynamicObject`, etc. are now properly recognized.
type GameContext = {
	world: World;
	messi: DynamicObject;
	ronaldo: DynamicObject;
	gameLoop: (time: number) => void;
};

export const GameScene: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameContextRef = useRef<GameContext | null>(null);

	const {width, height, fps} = useVideoConfig();
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
				const atlasImgUrl = staticFile('texatlas.png');
				const atlasMetaUrl = staticFile('atlasMeta.json');

				const [atlasImageResponse, atlasMetaResponse] = await Promise.all([
					fetch(atlasImgUrl).then((res) => res.blob()),
					fetch(atlasMetaUrl).then((res) => res.json()),
				]);

				const atlasImage = new Image();
				atlasImage.src = URL.createObjectURL(atlasImageResponse);
				await atlasImage.decode();

				const atlasMetaData = atlasMetaResponse;

				// Scene Initialization
				const viewport = new Viewport({width, height});
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
				const messi = new DynamicObject({frame: 'messi', world, x: -0.36, z: 3000});
				const ronaldo = new DynamicObject({frame: 'ronaldo', world, x: 0.36, y: 0, z: 3500});

				dLayers.add(messi);
				dLayers.add(ronaldo);
				DynamicObjects.SCALE = 120;
				world.dLayers = dLayers;
				world.setSubject(messi);
				scene.add(world);

				ronaldo.scale = messi.scale = 0.6;
				ronaldo.semp = messi.semp = true;
				// @ts-ignore
				const gameLoop = getGameLoop({renderer, fps});

				gameContextRef.current = {world, messi, ronaldo, gameLoop};

				URL.revokeObjectURL(atlasImage.src);
			} catch (err) {
				console.error('Failed to initialize Remotion game scene:', err);
			}
		})();
	}, [width, height, fps]);

	// Update Loop - This part remains the same.
	if (gameContextRef.current) {
		const {world, messi, ronaldo, gameLoop} = gameContextRef.current;

		const t = frame / fps;
		const deltaTime = 1 / fps;

		world.updateState(deltaTime, t);
		ronaldo.z += 2000 * deltaTime;
		messi.z += 2000 * deltaTime;

		if (t > 3) {
			world.setSubject(ronaldo);
		}

		gameLoop(t);
	}

	// Render Output - This part remains the same.
	return (
		<AbsoluteFill style={{zIndex: -1, backgroundColor: 'black'}}>
			<canvas ref={canvasRef} style={{width: '100%', height: '100%'}} />
		</AbsoluteFill>
	);
};