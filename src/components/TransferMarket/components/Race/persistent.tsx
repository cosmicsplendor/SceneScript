import {
    continueRender,
    delayRender,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import doFacs from './levelData/DoFacs';
// @ts-ignore
import Viewport from './lib/utils/ViewPort';
import { Datum, Frame } from '../../helpers';
import World from './lib/entities/World';

// --- Target Property Types ---
type TargetProperty<T> = { name: string; value: T };

type InterpolatedProperty = 'x' | 'alpha' | 'yOffset' | 'rotation';
type InstantProperty = 'frame';

// --- Enhanced Frame type ---
type EnhancedFrame = Frame & {
    targetX?: TargetProperty<number>[];
    targetFrame?: TargetProperty<string>[];
    targetAlpha?: TargetProperty<number>[];
    targetYOffset?: TargetProperty<number>[];
    targetRotation?: TargetProperty<number>[];
    cameraHeight?: number;
    dataMultiplier?: number;
    subject?: string;
    frame: number;
};

// --- Property Configuration ---
const PROPERTY_CONFIG = {
    interpolated: ['x', 'alpha', 'yOffset', 'rotation'] as InterpolatedProperty[],
    instant: ['frame'] as InstantProperty[],
    defaults: {
        x: (player: any) => player.x0,
        alpha: () => 1,
        yOffset: () => 0,
        rotation: () => 0,
        frame: (player: any) => player.frame
    }
} as const;

// --- Property Management Utilities ---
const getTargetKey = (prop: string) => `target${prop.charAt(0).toUpperCase() + prop.slice(1)}` as keyof EnhancedFrame;

const initializePropertyStates = (players: any[], properties: readonly string[]) => {
    return Object.fromEntries(
        properties.map(prop => [
            prop,
            new Map(players.map(p => [p.name, PROPERTY_CONFIG.defaults[prop as keyof typeof PROPERTY_CONFIG.defaults](p)]))
        ])
    );
};

const updatePropertyStatesFromKeyframes = (
    allKeyframes: EnhancedFrame[],
    upToIndex: number,
    propertyStates: Record<string, Map<string, any>>
) => {
    for (let i = 0; i <= upToIndex; i++) {
        const kf = allKeyframes[i];
        
        [...PROPERTY_CONFIG.interpolated, ...PROPERTY_CONFIG.instant].forEach(prop => {
            const targetKey = getTargetKey(prop);
            const targets = kf[targetKey] as TargetProperty<any>[] | undefined;
            
            if (targets) {
                targets.forEach(target => {
                    propertyStates[prop].set(target.name, target.value);
                });
            }
        });
    }
};

const applyPropertyUpdates = (
    players: DynamicObject[],
    currentData: EnhancedFrame | undefined,
    propertyStates: Record<string, Map<string, any>>,
    progress: number | undefined
) => {
    // Apply instant properties (no interpolation)
    PROPERTY_CONFIG.instant.forEach(prop => {
        if (currentData) {
            const targetKey = getTargetKey(prop);
            const targets = currentData[targetKey] as TargetProperty<any>[] | undefined;
            
            if (targets) {
                targets.forEach(target => {
                    const player = players.find(p => p.name === target.name);
                    if (player) {
                        (player as any)[prop] = target.value;
                    }
                });
            }
        }
    });

    // Apply interpolated properties
    PROPERTY_CONFIG.interpolated.forEach(prop => {
        if (currentData && progress !== undefined) {
            const targetKey = getTargetKey(prop);
            const targets = currentData[targetKey] as TargetProperty<any>[] | undefined;
            
            if (targets) {
                targets.forEach(target => {
                    const player = players.find(p => p.name === target.name);
                    if (player) {
                        const startValue = propertyStates[prop].get(target.name);
                        const interpolatedValue = startValue + (target.value - startValue) * progress;
                        (player as any)[prop] = interpolatedValue;
                    }
                });
            } else {
                // Only reset to property state if it exists and is valid
                players.forEach(player => {
                    const stateValue = propertyStates[prop].get(player.name);
                    if (stateValue !== undefined) {
                        (player as any)[prop] = stateValue;
                    }
                });
            }
        } else {
            // Only reset to property state if it exists and is valid
            players.forEach(player => {
                const stateValue = propertyStates[prop].get(player.name);
                if (stateValue !== undefined) {
                    (player as any)[prop] = stateValue;
                }
            });
        }
    });
};

// --- Main Component Types ---
type GameContext = {
    world: World;
    players: any[];
    gameLoop: (time: number) => void;
};

type LoadedAssets = {
    atlasImage: HTMLImageElement;
    atlasMetaData: any;
};

type LoadingStatus = 'loading-assets' | 'initializing-engine' | 'ready';

type DeterministicState = {
    propertyStates: Record<string, Map<string, any>>;
    initialCameraHeight: number;
    cumulativeDataZ: Map<string, number>;
    oldMultiplier: number;
    newMultiplier: number;
    cumulativeDataValue: Map<string, number>;
};

export const raceSceneObjectRegistry = Object.freeze({
    players: new Map<string, DynamicObject>()
});

const BASE_SPEED = 2800;
const DEFAULT_DATA_MULTIPLIER = 750;

export const RaceScene: React.FC<{
    currentData?: EnhancedFrame,
    prevData?: EnhancedFrame,
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
        noFog?: boolean,
        alpha?: number,
        yOffset?: number,
        rotation?: number
    }[]
}> = ({
    passive,
    currentData,
    prevData,
    allKeyframes,
    progress,
    players = [
        { "name": "Ronaldo", "frame": "ronaldo_ride", "scale": 2, "z": 350, "x": 1, "isSubject": false, "flip": true, "noFog": true },
        { "name": "Messi", "frame": "ronaldo_ride", "scale": 2, "z": 350, "x": -0.5, "flip": true, "noFog": true },
        { "name": "bird1", "frame": "bird1", "scale": 1.5, "z": 0, "x": 0.4, "flip": true, alpha: 0, isSubject: true, "noFog": true },
        { "name": "police", "frame": "police_car", "scale": 3.5, "z": -3000, "x": 0.4, "flip": true, isSubject: true, "noFog": true },
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
        // Initialize property states
        const allProperties = [...PROPERTY_CONFIG.interpolated, ...PROPERTY_CONFIG.instant];
        const propertyStates = initializePropertyStates(players, allProperties);
        
        let initialCameraHeight = (levelData as any).world.cameraHeight || 0;
        const cumulativeDataValue = new Map<string, number>(players.map(p => [p.name, 0]));
        
        let oldMultiplier = DEFAULT_DATA_MULTIPLIER;
        let newMultiplier = DEFAULT_DATA_MULTIPLIER;

        const prevKeyframeIndex = prevData ? allKeyframes.findIndex(kf => kf.frame === prevData.frame) : -1;

        if (prevKeyframeIndex !== -1) {
            // Process data cumulation
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
                
                // Update camera height
                if (kf.cameraHeight !== undefined) {
                    initialCameraHeight = kf.cameraHeight;
                }
            }

            // Update all property states up to prevData
            updatePropertyStatesFromKeyframes(allKeyframes, prevKeyframeIndex, propertyStates);

            // Handle multipliers
            for (let i = prevKeyframeIndex; i >= 0; i--) {
                if (allKeyframes[i].dataMultiplier !== undefined) {
                    newMultiplier = allKeyframes[i].dataMultiplier;
                    break;
                }
            }

            if (prevKeyframeIndex > 0) {
                for (let i = prevKeyframeIndex - 1; i >= 0; i--) {
                    if (allKeyframes[i].dataMultiplier !== undefined) {
                        oldMultiplier = allKeyframes[i].dataMultiplier;
                        break;
                    }
                }
            } else {
                oldMultiplier = newMultiplier;
            }
        }

        return {
            propertyStates,
            initialCameraHeight,
            oldMultiplier,
            newMultiplier,
            cumulativeDataValue,
            cumulativeDataZ: new Map(),
        };
    }, [allKeyframes, prevData, players]);

    // Asset loading effect (unchanged)
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

    // Engine initialization effect (unchanged)
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
        raceSceneObjectRegistry.players.clear();
        
        const createdPlayers = players.map((player, i) => {
            if (passive && i > 0) return null;
            const { frame, x, z, scale, name } = player;
            const p = new DynamicObject({ frame, world, x, z, scale });
            if (passive) { world.setSubject(p); }
            p.name = name;
            p.z0 = z;
            p.x0 = x;
            p.semp = true;
            if (player.noFog) p.noFog = true;
            if (typeof player.alpha === "number") p.alpha = player.alpha;
            if (typeof player.yOffset === "number") p.yOffset = player.yOffset;
            if (typeof player.rotation === "number") p.rotation = player.rotation;
            dLayers.add(p);
            raceSceneObjectRegistry.players.set(player.name, p);
            return p;
        }).filter((p): p is DynamicObject => !!p);

        // Ensure subject is set immediately after all players are created
        let initialSubject = createdPlayers.find(p => {
            const playerConfig = players.find(pc => pc.name === p.name);
            return playerConfig?.isSubject;
        });
        
        if (initialSubject) {
            world.setSubject(initialSubject);
            console.log('Initial subject set to:', initialSubject.name);
        } else if (createdPlayers.length > 0) {
            // Fallback: set first player as subject if no explicit subject
            world.setSubject(createdPlayers[0]);
            console.log('Fallback subject set to:', createdPlayers[0].name);
        }

        gameContextRef.current = {
            world,
            gameLoop,
            players: createdPlayers
        };
        
        setLoadingStatus('ready');
        continueRender(handle);
        return () => { URL.revokeObjectURL(atlasImage.src); };
    }, [loadingStatus, loadedAssets, width, height, fps, handle, players, passive]);

    // Main update effect
    useEffect(() => {
        if (loadingStatus !== 'ready' || !gameContextRef.current) return;

        const { world, players, gameLoop } = gameContextRef.current;
        const t = frame / fps;
        const deltaTime = 1 / fps;
        const baseMovement = t * BASE_SPEED;

        const { oldMultiplier, newMultiplier, cumulativeDataValue, initialCameraHeight, propertyStates } = deterministicState;

        // Global Z offset calculation (unchanged)
        let globalZOffset = 0;
        if (progress !== undefined && oldMultiplier !== newMultiplier) {
            let subjectName = players.find(p => p.isSubject)?.name;
            const relevantKeyframes = allKeyframes.filter(kf => kf.frame <= frame);
            for (const kf of relevantKeyframes) {
                if (kf.subject) {
                    subjectName = kf.subject;
                }
            }

            if (subjectName) {
                const subjectHistoryValue = cumulativeDataValue.get(subjectName) ?? 0;
                const zShrinkage = subjectHistoryValue * (oldMultiplier - newMultiplier);
                globalZOffset = zShrinkage * progress;
            }
        }

        // Handle Z-axis movement (unchanged)
        if (prevData?.data && currentData && progress !== undefined) {
            currentData.data.forEach(d => {
                const player = players.find(p => p.name === d.name);
                if (!player) return;

                const curVal = d.value;
                const prevVal = prevData.data.find(pd => pd.name === player.name)?.value ?? 0;

                const historyValue = cumulativeDataValue.get(d.name) ?? 0;
                const historyZ_old = historyValue * oldMultiplier;
                const historyZ_new = historyValue * newMultiplier;
                const interpolatedHistoryZ = historyZ_old + (historyZ_new - historyZ_old) * progress;
                const movementThisSegment = (curVal - prevVal) * newMultiplier * progress;

                player.z = player.z0 + baseMovement + interpolatedHistoryZ + movementThisSegment + globalZOffset;
            });
        } else if (passive) {
            players.forEach(player => player.z = player.z0 + baseMovement);
        }

        // Apply all property updates using the modular system
        applyPropertyUpdates(players, currentData, propertyStates, progress);

        // Handle camera height interpolation (unchanged)
        if (currentData?.cameraHeight !== undefined && progress !== undefined) {
            const startHeight = initialCameraHeight;
            world.cameraHeight = startHeight + (currentData.cameraHeight - startHeight) * progress;
        } else {
            world.cameraHeight = initialCameraHeight;
        }

        players.forEach(player => player.update());
        world.updateState(deltaTime, t);
        gameLoop(t);

    }, [loadingStatus, frame, fps, currentData, prevData, progress, passive, deterministicState, allKeyframes, players]);

    // Subject change effect (unchanged)
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
    }, [loadingStatus, frame, allKeyframes, players]);

    if (loadingStatus === 'loading-assets') {
        return null;
    }

    return (
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: "absolute", top: 0, left: 0 }} />
    );
};