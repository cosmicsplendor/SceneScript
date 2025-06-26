import {
    continueRender,
    delayRender,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// --- Your library imports ---
// ... (imports are the same)
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
    atlasMetaData: any;
};
type LoadingStatus = 'loading-assets' | 'initializing-engine' | 'ready';

// --- Enhanced Frame type to include new properties ---
type EnhancedFrame = Frame & {
    targetX?: { name: string; value: number }[];
    cameraHeight?: number;
    dataMultiplier?: number;
    // --- Add frame number to keyframes for deterministic calculation ---
    frame: number;
};

// --- This will hold the calculated state at the start of the current segment ---
type DeterministicState = {
    initialPlayerPositions: Map<string, number>;
    initialCameraHeight: number;
    activeDataMultiplier: number;
    // This will store the TOTAL Z-distance from data accumulated up to the START of the current segment.
    cumulativeDataZ: Map<string, number>;
};


// --- Component Configuration ---
const BASE_SPEED = 1900;
const DEFAULT_DATA_MULTIPLIER = 0.000075;

export const RaceScene: React.FC<{
    currentData?: EnhancedFrame,
    prevData?: EnhancedFrame, // <-- Use EnhancedFrame here too for consistency
    // --- Change 1: Add a prop for the full history of keyframes ---
    allKeyframes: EnhancedFrame[],
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
    allKeyframes,
    progress,
    players = [
        { name: "Manchester City", frame: "man_city", scale: 1.6, z: 0, x: -0.5, isSubject: false, flip: true, alpha: 0, noFog: true },
        { name: "Chelsea FC", frame: "chelsea", scale: 1.6, z: 0, x: 0.5, isSubject: true, flip: true, alpha: 0, noFog: true },
        { name: "Tottenham Hotspur", frame: "tottenham", scale: 1.6, z: 0, x: 0.5, isSubject: false, flip: true, alpha: 0, noFog: true },
        { name: "Arsenal FC", frame: "arsenal", scale: 1.6, z: 0, x: -0.5, isSubject: true, flip: true, alpha: 0, noFog: true },
        { name: "Manchester United", frame: "man_united", scale: 1.6, z: 0, x: 0, isSubject: false, flip: true, alpha: 0, noFog: true },
        { name: "Liverpool FC", frame: "liverpool", scale: 1.6, z: 0, x: 0, isSubject: false, flip: true, alpha: 0, noFog: true },
    ]
}) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const gameContextRef = useRef<GameContext | null>(null);

        const { width, height, fps } = useVideoConfig();
        const frame = useCurrentFrame();

        const [handle] = useState(() => delayRender("Loading game assets..."));
        const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('loading-assets');
        const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);

        // --- Change 2: Calculate the state deterministically using all past keyframes ---
        const deterministicState = useMemo<DeterministicState>(() => {
            // --- I. INITIALIZE STATE ---
            // These maps and variables will be mutated as we loop through history.
            const initialPlayerPositions = new Map(players.map(p => [p.name, p.x]));
            let initialCameraHeight = (levelData as any).world.cameraHeight || 0;
            const cumulativeDataZ = new Map<string, number>(players.map(p => [p.name, 0]));
            let currentMultiplier = DEFAULT_DATA_MULTIPLIER;

            // --- II. FIND HISTORY BOUNDARY ---
            // We need to process all keyframes up to and including `prevData` to get the
            // state at the beginning of the current segment.
            const prevKeyframeIndex = prevData ? allKeyframes.findIndex(kf => kf.frame === prevData.frame) : -1;

            if (prevKeyframeIndex !== -1) {
                // --- III. FAST-FORWARD THROUGH HISTORY ---
                // Loop through all keyframes that occurred before the current segment.
                for (let i = 0; i <= prevKeyframeIndex; i++) {
                    const kf = allKeyframes[i];

                    // A) Calculate Z-distance traveled in the segment that *ended* at this keyframe.
                    if (i > 0) {
                        const segmentStartKf = allKeyframes[i - 1];
                        // The multiplier for the completed segment is the one defined at its start.
                        const segmentMultiplier = segmentStartKf.dataMultiplier ?? currentMultiplier;

                        kf.data.forEach(playerData => {
                            const startValue = segmentStartKf.data.find(d => d.name === playerData.name)?.value ?? 0;
                            const valueDelta = playerData.value - startValue;
                            const distanceThisSegment = valueDelta * segmentMultiplier;

                            const currentTotal = cumulativeDataZ.get(playerData.name) ?? 0;
                            cumulativeDataZ.set(playerData.name, currentTotal + distanceThisSegment);
                        });
                    }

                    // B) Apply the persistent state changes defined *at* this keyframe.
                    // These values will persist until another keyframe overrides them.
                    if (kf.targetX) {
                        kf.targetX.forEach(target => initialPlayerPositions.set(target.name, target.value));
                    }
                    if (kf.cameraHeight !== undefined) {
                        initialCameraHeight = kf.cameraHeight;
                    }

                    // C) Update the multiplier for the *next* segment's calculation.
                    currentMultiplier = kf.dataMultiplier ?? currentMultiplier;
                }
            }

            // --- IV. RETURN FINAL STATE ---
            // After the loop, `currentMultiplier` holds the value set by `prevData` (or the last one seen).
            // This is the active multiplier for the current rendering segment.
            const activeDataMultiplier = currentMultiplier;

            return {
                initialPlayerPositions,
                initialCameraHeight,
                activeDataMultiplier,
                cumulativeDataZ
            };

        }, [allKeyframes, prevData, players]);




        // --- PHASE 1 & 2: Asset Loading & Engine Initialization (Unchanged) ---
        // ... (no changes in these useEffect hooks)
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

        useEffect(() => {
            if (loadingStatus !== 'initializing-engine' || !loadedAssets || !canvasRef.current) {
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


        // --- PHASE 3: FRAME & DATA UPDATE LOOPS (GUARDED) ---
        useEffect(() => {
            if (loadingStatus !== 'ready' || !gameContextRef.current) return;

            const { world, players, gameLoop } = gameContextRef.current;
            const t = frame / fps;
            const deltaTime = 1 / fps;
            const baseMovement = t * BASE_SPEED;

            const { activeDataMultiplier, cumulativeDataZ, initialPlayerPositions, initialCameraHeight } = deterministicState;

            // Handle Z-axis movement (This logic was already correct)
            if (prevData?.data && currentData && progress !== undefined) {
                currentData.data.forEach(d => {
                    const player = players.find(p => p.name === d.name);
                    if (!player) return;

                    const curVal = d.value;
                    const prevVal = prevData.data.find(pd => pd.name === player.name)?.value ?? 0;

                    const historyZ = cumulativeDataZ.get(d.name) ?? 0;
                    const interpolatedValue = prevVal + (curVal - prevVal) * progress;
                    const movementThisSegment = (interpolatedValue - prevVal) * activeDataMultiplier;

                    player.z = player.z0 + baseMovement + historyZ + movementThisSegment;
                });
            } else if (passive) {
                players.forEach(player => player.z = player.z0 + baseMovement);
            }

            // --- Change 2: The render logic for X now correctly uses the calculated start position. ---
            // Handle X-axis interpolation
            if (currentData?.targetX && progress !== undefined) {
                currentData.targetX.forEach(target => {
                    const player = players.find(p => p.name === target.name);
                    if (player) {
                        // Get the starting X position from our cumulative calculation.
                        const startX = initialPlayerPositions.get(target.name) ?? player.x0;
                        // Interpolate from that starting point to the new target.
                        player.x = startX + (target.value - startX) * progress;
                    }
                });
            } else {
                // If there's no active `targetX` transition, just ensure players are at their last known position.
                players.forEach(player => {
                    player.x = initialPlayerPositions.get(player.name) ?? player.x0;
                });
            }

            // Handle camera height interpolation (This logic was already correct)
            if (currentData?.cameraHeight !== undefined && progress !== undefined) {
                const startHeight = initialCameraHeight;
                world.cameraHeight = startHeight + (currentData.cameraHeight - startHeight) * progress;
            } else {
                world.cameraHeight = initialCameraHeight;
            }

            players.forEach(player => player.update());

            world.updateState(deltaTime, t);
            gameLoop(t);

        }, [loadingStatus, frame, fps, currentData, prevData, progress, passive, deterministicState]);

        // --- Subject change effect ---
        useEffect(() => {
            if (loadingStatus !== 'ready' || !gameContextRef.current) return;

            // To be fully deterministic, we find the last subject set at or before this frame
            let subjectName = players.find(p => p.isSubject)?.name;
            const relevantKeyframes = allKeyframes.filter(kf => kf.frame <= frame);
            for (const kf of relevantKeyframes) {
                if (kf.subject) {
                    subjectName = kf.subject;
                }
            }

            if (subjectName) {
                const { world, players } = gameContextRef.current;
                const player = players.find(p => p.name === subjectName);
                if (player) world.setSubject(player);
            }
        }, [loadingStatus, frame, allKeyframes]); // Depends on frame and history

        if (loadingStatus === 'loading-assets') {
            return null;
        }

        return (
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
        );
    };