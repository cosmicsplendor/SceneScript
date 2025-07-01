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
import doFacs from './levelData/DoFacs';
// @ts-ignore
import Viewport from './lib/utils/ViewPort';
import { Datum, Frame } from '../../helpers';

// --- Type Definitions for State Management ---
import World from './lib/entities/World';

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
    subject?: string;
    // --- Add frame number to keyframes for deterministic calculation ---
    frame: number;
};

// --- This will hold the calculated state at the start of the current segment ---
type DeterministicState = {
    initialPlayerPositions: Map<string, number>;
    initialCameraHeight: number;
    // This will store the TOTAL Z-distance from data accumulated up to the START of the current segment.
    cumulativeDataZ: Map<string, number>;
    // --- NEW: Renamed for clarity and to store both multipliers for the transition
    oldMultiplier: number;
    newMultiplier: number;
    cumulativeDataValue: Map<string, number>;
};
export const raceSceneObjectRegistry = Object.freeze({
    players: new Map<string, DynamicObject>()
})

const BASE_SPEED = 2400;
const DEFAULT_DATA_MULTIPLIER = 0.000075;

export const RaceScene: React.FC<{
    currentData?: EnhancedFrame,
    prevData?: EnhancedFrame, // <-- Use EnhancedFrame here too for consistency
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
        { "name": "Bayern Munich", "frame": "bayern", "scale": 1.6, "z": 0, "x": 0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "SV Werder Bremen", "frame": "werder", "scale": 1.6, "z": 0, "x": -0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "Borussia Dortmund", "frame": "dortmund", "scale": 1.6, "z": 0, "x": 0, "isSubject": true, "flip": true, "alpha": 0, "noFog": true },
        { "name": "VfB Stuttgart", "frame": "stuttgart", "scale": 1.6, "z": 0, "x": -0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "Bayer 04 Leverkusen", "frame": "leverkusen", "scale": 1.5, "z": 0, "x": 0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "1.FC Kaiserslautern", "frame": "fck", "scale": 1.3, "z": 0, "x": 0, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "Hamburger SV", "frame": "hamburger", "scale": 1.5, "z": 0, "x": -0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "FC Schalke 04", "frame": "schalke", "scale": 1.6, "z": 0, "x": 0, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "Hertha BSC", "frame": "hartha", "scale": 1.6, "z": 0, "x": -0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "VfL Wolfsburg", "frame": "wolfsburg", "scale": 1.6, "z": 0, "x": 0.5, "isSubject": false, "flip": true, "alpha": 0, "noFog": true },
        { "name": "RB Leipzig", "frame": "leipzig", "scale": 1.6, "z": 0, "x": 0, "isSubject": false, "flip": true, "alpha": 0, "noFog": true }
    ]
}) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const gameContextRef = useRef<GameContext | null>(null);

        const { width, height, fps } = useVideoConfig();
        const frame = useCurrentFrame();

        const [handle] = useState(() => delayRender("Loading game assets..."));
        const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('loading-assets');
        const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);

        const deterministicState = useMemo<DeterministicState>(() => {
            const initialPlayerPositions = new Map(players.map(p => [p.name, p.x]));
            let initialCameraHeight = (levelData as any).world.cameraHeight || 0;
            const cumulativeDataValue = new Map<string, number>(players.map(p => [p.name, 0]));

            // By default, multipliers are the same
            let oldMultiplier = DEFAULT_DATA_MULTIPLIER;
            let newMultiplier = DEFAULT_DATA_MULTIPLIER;

            const prevKeyframeIndex = prevData ? allKeyframes.findIndex(kf => kf.frame === prevData.frame) : -1;

            if (prevKeyframeIndex !== -1) {
                for (let i = 0; i <= prevKeyframeIndex; i++) {
                    const kf = allKeyframes[i];
                    if (i > 0) {
                        const segmentStartKf = allKeyframes[i - 1];
                        kf.data.forEach(playerData => {
                            const startValue = segmentStartKf.data.find(d => d.name === playerData.name)?.value ?? 0;
                            const valueDelta = playerData.value - startValue;
                            const currentTotal = cumulativeDataValue.get(playerData.name) ?? 0;
                            cumulativeDataValue.set(playerData.name, currentTotal + valueDelta);
                        });
                    }
                    if (kf.targetX) {
                        kf.targetX.forEach(target => initialPlayerPositions.set(target.name, target.value));
                    }
                    if (kf.cameraHeight !== undefined) {
                        initialCameraHeight = kf.cameraHeight;
                    }
                }

                // Find the "new" multiplier active at `prevData`
                for (let i = prevKeyframeIndex; i >= 0; i--) {
                    if (allKeyframes[i].dataMultiplier !== undefined) {
                        newMultiplier = allKeyframes[i].dataMultiplier;
                        break;
                    }
                }

                // Find the "old" multiplier active at the keyframe BEFORE `prevData`
                if (prevKeyframeIndex > 0) {
                    for (let i = prevKeyframeIndex - 1; i >= 0; i--) {
                        if (allKeyframes[i].dataMultiplier !== undefined) {
                            oldMultiplier = allKeyframes[i].dataMultiplier;
                            break;
                        }
                    }
                } else {
                    // If prevData is the very first keyframe, old and new are the same.
                    oldMultiplier = newMultiplier;
                }
            }

            return {
                initialPlayerPositions,
                initialCameraHeight,
                oldMultiplier,
                newMultiplier,
                cumulativeDataValue,
                cumulativeDataZ: new Map(), // This property seems unused, can be removed if not needed elsewhere
            };
        }, [allKeyframes, prevData, players]);

        // --- PHASE 1 & 2: Asset Loading & Engine Initialization (Unchanged) ---
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
            raceSceneObjectRegistry.players.clear()
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
                    raceSceneObjectRegistry.players.set(player.name, p);
                    return p;
                }).filter((p): p is DynamicObject => !!p)
            };
            setLoadingStatus('ready');
            continueRender(handle);
            return () => { URL.revokeObjectURL(atlasImage.src); };
        }, [loadingStatus, loadedAssets, width, height, fps, handle, players, passive]);


        // --- PHASE 3: FRAME & DATA UPDATE LOOPS (MODIFIED) ---
        useEffect(() => {
            if (loadingStatus !== 'ready' || !gameContextRef.current) return;

            const { world, players, gameLoop } = gameContextRef.current;
            const t = frame / fps;
            const deltaTime = 1 / fps;
            const baseMovement = t * BASE_SPEED;

            const { oldMultiplier, newMultiplier, cumulativeDataValue, initialPlayerPositions, initialCameraHeight } = deterministicState;

            // --- NEW: Calculate the global Z offset to prevent subject from moving backwards ---
            let globalZOffset = 0;
            // This offset is only needed during a data transition where the multiplier changes.
            if (progress !== undefined && oldMultiplier !== newMultiplier) {
                // First, find who the 'subject' is for this frame's calculation.
                // We deterministically find the last 'subject' declaration up to the current frame.
                let subjectName = players.find(p => p.isSubject)?.name; // Default subject
                const relevantKeyframes = allKeyframes.filter(kf => kf.frame <= frame);
                for (const kf of relevantKeyframes) {
                    if (kf.subject) {
                        subjectName = kf.subject;
                    }
                }

                if (subjectName) {
                    const subjectHistoryValue = cumulativeDataValue.get(subjectName) ?? 0;

                    // This is the total Z distance change the subject would experience over the
                    // whole transition due to their historical data being re-scaled.
                    const zShrinkage = subjectHistoryValue * (oldMultiplier - newMultiplier);

                    // We apply this shrinkage compensation smoothly over the transition.
                    // This amount is added to ALL objects to shift the world forward,
                    // preventing the subject from moving backwards (due to multiplier changes)
                    // and maintaining all relative distances.
                    globalZOffset = zShrinkage * progress;
                }
            }

            // Handle Z-axis movement
            if (prevData?.data && currentData && progress !== undefined) {
                currentData.data.forEach(d => {
                    const player = players.find(p => p.name === d.name);
                    if (!player) return;

                    const curVal = d.value;
                    const prevVal = prevData.data.find(pd => pd.name === player.name)?.value ?? 0;

                    // The original Z calculation logic remains...
                    const historyValue = cumulativeDataValue.get(d.name) ?? 0;
                    const historyZ_old = historyValue * oldMultiplier;
                    const historyZ_new = historyValue * newMultiplier;
                    const interpolatedHistoryZ = historyZ_old + (historyZ_new - historyZ_old) * progress;
                    const movementThisSegment = (curVal - prevVal) * newMultiplier * progress;

                    // ...but now we add the compensation offset to the final position.
                    // Final Z = base position + constant speed + historical data position (rescaling) + current data position + compensation offset.
                    player.z = player.z0 + baseMovement + interpolatedHistoryZ + movementThisSegment + globalZOffset;
                });
            } else if (passive) {
                players.forEach(player => player.z = player.z0 + baseMovement);
            }

            // Handle X-axis interpolation
            if (currentData?.targetX && progress !== undefined) {
                currentData.targetX.forEach(target => {
                    const player = players.find(p => p.name === target.name);
                    if (player) {
                        const startX = initialPlayerPositions.get(target.name) ?? player.x0;
                        player.x = startX + (target.value - startX) * progress;
                    }
                });
            } else {
                players.forEach(player => {
                    player.x = initialPlayerPositions.get(player.name) ?? player.x0;
                });
            }

            // Handle camera height interpolation
            if (currentData?.cameraHeight !== undefined && progress !== undefined) {
                const startHeight = initialCameraHeight;
                world.cameraHeight = startHeight + (currentData.cameraHeight - startHeight) * progress;
            } else {
                world.cameraHeight = initialCameraHeight;
            }

            players.forEach(player => player.update());
            world.updateState(deltaTime, t);
            gameLoop(t);

        }, [loadingStatus, frame, fps, currentData, prevData, progress, passive, deterministicState, allKeyframes, players]); // Added allKeyframes and players to dependency array for subject lookup

        // --- Subject change effect (Unchanged) ---
        useEffect(() => {
            if (loadingStatus !== 'ready' || !gameContextRef.current) return;

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
        }, [loadingStatus, frame, allKeyframes, players]); // Added players to dependency array

        if (loadingStatus === 'loading-assets') {
            return null;
        }

        return (
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
        );
    };