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
    activeDataMultiplier: number; // Renamed for clarity
    // This will store the TOTAL Z-distance from data accumulated up to the START of the current segment.
    cumulativeDataZ: Map<string, number>;
    // --- NEW: This stores the total compensation offset from ALL past transitions ---
    cumulativeZCompensation: number;
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

        const deterministicState = useMemo(() => {
            // --- I. INITIALIZE STATE ---
            const initialPlayerPositions = new Map(players.map(p => [p.name, p.x]));
            let initialCameraHeight = (levelData as any).world.cameraHeight || 0;
            const cumulativeDataValue = new Map<string, number>(players.map(p => [p.name, 0]));

            // --- NEW: Initialize our compensation tracker and state for the history loop ---
            let cumulativeZCompensation = 0;
            let lastKnownMultiplier = DEFAULT_DATA_MULTIPLIER;
            let activeSubjectName = players.find(p => p.isSubject)?.name; // Start with default subject

            // --- II. FIND HISTORY BOUNDARY ---
            const prevKeyframeIndex = prevData ? allKeyframes.findIndex(kf => kf.frame === prevData.frame) : -1;

            if (prevKeyframeIndex !== -1) {
                // --- III. FAST-FORWARD THROUGH HISTORY ---
                for (let i = 0; i <= prevKeyframeIndex; i++) {
                    const kf = allKeyframes[i];
                    const prevKf = i > 0 ? allKeyframes[i - 1] : null;

                    // A) Update cumulative raw data values (this part is the same)
                    if (prevKf) {
                        kf.data.forEach(playerData => {
                            const startValue = prevKf.data.find(d => d.name === playerData.name)?.value ?? 0;
                            const valueDelta = playerData.value - startValue;
                            const currentTotal = cumulativeDataValue.get(playerData.name) ?? 0;
                            cumulativeDataValue.set(playerData.name, currentTotal + valueDelta);
                        });
                    }

                    // --- NEW: Calculate and accumulate Z compensation for completed segments ---
                    const segmentEndMultiplier = kf.dataMultiplier ?? lastKnownMultiplier;

                    if (segmentEndMultiplier !== lastKnownMultiplier && activeSubjectName) {
                        // A multiplier change occurred at the end of the previous segment (ending at this keyframe `kf`).
                        // We need the subject's data value at the *start* of that segment.
                        const subjectDataAtStartOfSegment = prevKf?.data.find(d => d.name === activeSubjectName)?.value ?? 0;

                        // We need to subtract this from the cumulative total to get the history *before* this segment.
                        const subjectHistoryValueBeforeSegment = (cumulativeDataValue.get(activeSubjectName) ?? 0) - (kf.data.find(d => d.name === activeSubjectName)?.value - subjectDataAtStartOfSegment);

                        const zOffsetForSegment = subjectHistoryValueBeforeSegment * (lastKnownMultiplier - segmentEndMultiplier);

                        // Add this segment's full compensation to our running total.
                        cumulativeZCompensation += zOffsetForSegment;
                    }

                    // B) Apply persistent state changes for the next loop iteration
                    if (kf.targetX) {
                        kf.targetX.forEach(target => initialPlayerPositions.set(target.name, target.value));
                    }
                    if (kf.cameraHeight !== undefined) {
                        initialCameraHeight = kf.cameraHeight;
                    }
                    if (kf.subject) {
                        activeSubjectName = kf.subject;
                    }
                    lastKnownMultiplier = segmentEndMultiplier; // Update for the next segment
                }
            }

            // Determine the active multiplier for the *current* render segment
            const activeDataMultiplier = prevData?.dataMultiplier ?? lastKnownMultiplier;

            return {
                initialPlayerPositions,
                initialCameraHeight,
                activeDataMultiplier,
                cumulativeDataValue: cumulativeDataValue, // This is the cumulative *raw data*
                cumulativeZCompensation,
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

            // --- Destructure our new, more powerful state ---
            const {
                activeDataMultiplier,
                cumulativeDataValue,
                initialPlayerPositions,
                initialCameraHeight,
                cumulativeZCompensation // The total offset from the past
            } = deterministicState;

            // --- NEW: Determine the Z-offset for the CURRENT transition ---
            let zOffsetForThisSegment = 0;
            const currentSegmentMultiplier = currentData?.dataMultiplier ?? activeDataMultiplier;

            if (currentSegmentMultiplier !== activeDataMultiplier && progress !== undefined) {
                // A transition is happening right now.
                const subjectName = world.subject.name; // Get current subject
                const subjectHistoryValue = cumulativeDataValue.get(subjectName) ?? 0;

                // Calculate the compensation needed for *this* segment's transition
                const compensation = subjectHistoryValue * (activeDataMultiplier - currentSegmentMultiplier);

                // Interpolate it based on progress
                zOffsetForThisSegment = compensation * progress;
            }

            // --- The final, global Z-offset is the sum of the past and the present ---
            const finalZOffset = cumulativeZCompensation + zOffsetForThisSegment;

            // Handle Z-axis movement
            if (prevData?.data && currentData && progress !== undefined) {
                currentData.data.forEach(d => {
                    const player = players.find(p => p.name === d.name);
                    if (!player) return;

                    const historyValue = cumulativeDataValue.get(d.name) ?? 0;
                    const historyZ = historyValue * activeDataMultiplier;

                    const curVal = d.value;
                    const prevVal = prevData.data.find(pd => pd.name === player.name)?.value ?? 0;
                    const movementThisSegment = (curVal - prevVal) * currentSegmentMultiplier * progress;

                    // --- The new, anchored Z calculation ---
                    player.z = player.z0 + baseMovement + historyZ + movementThisSegment + finalZOffset;
                });
            } else if (passive) {
                players.forEach(player => player.z = player.z0 + baseMovement + finalZOffset);
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