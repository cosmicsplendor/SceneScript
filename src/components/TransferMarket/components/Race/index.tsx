import {
	continueRender,
	delayRender,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import rawAnimationData from './../../../../../animation.yaml';
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as THREE from 'three';

import { AnimationState, ObjectDefinition } from './AnimState';
import applyOffset from './AnimState/applyOffset';
import fastForwardSequence from './AnimState/fastforwardSequence';
import getStartSequenceFrame from './AnimState/getStartSequenceFrame';
import preprocessData from './AnimState/preprocessData';

// 2.5D Projection Constants matching animation data scale
const ROAD_WIDTH = 180000;
const Y_SCALE = 1000;
const SPRITE_SCALE = 125;
const CAMERA_Z_OFFSET = -200;

export interface FrameMetaData {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type AtlasMetaData = Record<string, FrameMetaData>;

export interface Rotation3D {
	x?: number;
	y?: number;
	z?: number;
}

export class DynamicObject {
	id: string = '';
	name: string = '';
	frame: string = '';
	x: number = 0;
	yOffset: number = 0;
	y: number = 0;
	z: number = 0;
	scale: number = 1;
	scaleX: number = 1;
	scaleY: number = 1;
	alpha: number = 1;
	rotation: number = 0;
	rotation3d: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
	flip: boolean = false;
	centerY: boolean = false;
	anchor?: { x: number; y: number };
	blendMode?: 'Screen' | 'Normal';
	maskFrame?: string;
	maskDest?: { x: number; y: number; width: number; height: number };
	noCull: boolean = false;
	semp: boolean = true;
	removed: boolean = false;
	toRemove: boolean = false;

	// Screen-space position & size for speech bubbles / overlays
	pos: { x: number; y: number } = { x: 0, y: 0 };
	width: number = 0;
	height: number = 0;

	// Three.js references
	mesh?: THREE.Mesh;
	geometry?: THREE.BufferGeometry;
	material?: THREE.MeshBasicMaterial;
	lastFrame?: string;
	lastFlip?: boolean;

	constructor(
		init: Partial<DynamicObject> & {
			rotation?: number | Rotation3D;
			rot?: Rotation3D;
			rotX?: number;
			rotY?: number;
			rotZ?: number;
			baseRotation?: Rotation3D;
		} = {}
	) {
		Object.assign(this, init);
		if (init.yOffset !== undefined && init.y === undefined) {
			this.y = init.yOffset;
		}
		if (init.y !== undefined && init.yOffset === undefined) {
			this.yOffset = init.y;
		}

		// Initial 3D rotation property (x, y, z) specified in degrees, converted to radians for Three.js
		const r3d =
			init.rotation3d ||
			init.baseRotation ||
			init.rot ||
			(typeof init.rotation === 'object' && init.rotation !== null ? init.rotation : undefined);

		const degToRad = (deg?: number) =>
			typeof deg === 'number' && !isNaN(deg) ? (deg * Math.PI) / 180 : 0;

		this.rotation3d = {
			x: degToRad(r3d?.x ?? init.rotX),
			y: degToRad(r3d?.y ?? init.rotY),
			z: degToRad(r3d?.z ?? init.rotZ),
		};

		if (typeof init.rotation === 'number') {
			this.rotation = init.rotation;
		} else if (typeof init.rotation === 'object') {
			this.rotation = 0;
		}
	}

	update() {}
}

class SimpleWorld {
	fov: number;
	ORIGIN_Y: number;
	subject: DynamicObject;

	constructor(fov: number = 120, originY: number = 0.6, subject: DynamicObject) {
		this.fov = fov;
		this.ORIGIN_Y = originY;
		this.subject = subject;
	}

	setFov(degrees: number) {
		this.fov = degrees;
	}

	setSubject(subject: DynamicObject) {
		this.subject = subject;
	}
}

// Deep clone raw YAML data so we NEVER mutate the Webpack-cached module across HMR cycles
function initProcessedAnimationData() {
	const cloned = JSON.parse(JSON.stringify(rawAnimationData));
	const startFrame = getStartSequenceFrame(cloned);
	const xOffset = cloned.XOffset || 0;
	const zOffset = cloned.ZOffset || 0;
	preprocessData(cloned);
	applyOffset(cloned, xOffset, zOffset);
	fastForwardSequence(cloned);
	return { data: cloned, startSequenceFrame: startFrame };
}

const { data: animationData, startSequenceFrame } = initProcessedAnimationData();
export { startSequenceFrame };

export const raceSceneObjectRegistry = new Map<string, DynamicObject>();

interface CachedAssets {
	image: HTMLImageElement;
	metaData: AtlasMetaData;
	imgWidth: number;
	imgHeight: number;
}

const GLOBAL_CACHE_KEY = '__REMOTION_RACE_SCENE_ASSETS__';

function getGlobalAssetCache(): CachedAssets | null {
	if (typeof globalThis !== 'undefined' && (globalThis as any)[GLOBAL_CACHE_KEY]) {
		return (globalThis as any)[GLOBAL_CACHE_KEY];
	}
	return null;
}

function setGlobalAssetCache(cache: CachedAssets) {
	if (typeof globalThis !== 'undefined') {
		(globalThis as any)[GLOBAL_CACHE_KEY] = cache;
	}
}

async function loadAtlasAssets(): Promise<CachedAssets> {
	const cached = getGlobalAssetCache();
	if (cached) return cached;

	const atlasImgUrl = staticFile('texatlas/texatlas.png');
	const atlasMetaUrl = staticFile('texatlas/atlasmeta.cson');

	const [image, metaData] = await Promise.all([
		new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = (e) => reject(new Error('Failed to load texatlas.png: ' + e));
			img.src = atlasImgUrl;
		}),
		fetch(atlasMetaUrl).then((r) => r.json()),
	]);

	const assets: CachedAssets = {
		image,
		metaData,
		imgWidth: image.width || 5600,
		imgHeight: image.height || 5400,
	};
	setGlobalAssetCache(assets);
	return assets;
}

export const RaceScene: React.FC<{
	data?: Object;
	cameraSubjectSprite?: string;
	passive?: boolean;
	[key: string]: any;
}> = ({ cameraSubjectSprite = 'dot' }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { width, height } = useVideoConfig();
	const frame = useCurrentFrame();

	const [isReady, setIsReady] = useState(false);
	const [handle] = useState(() => delayRender('Loading Three.js race scene...'));

	const threeRef = useRef<{
		renderer: THREE.WebGLRenderer;
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		world: SimpleWorld;
		cameraSubject: DynamicObject;
		actors: DynamicObject[];
		animationState: AnimationState;
		atlasTexture: THREE.Texture;
		atlasMetaData: AtlasMetaData;
		imgWidth: number;
		imgHeight: number;
	} | null>(null);

	// Phase 1: Initialize Three.js once on mount
	useEffect(() => {
		setIsReady(false);
		let isMounted = true;
		let hasContinued = false;
		const safeContinueRender = () => {
			if (!hasContinued) {
				hasContinued = true;
				continueRender(handle);
			}
		};

		const container = containerRef.current;
		if (!container) {
			safeContinueRender();
			return;
		}

		// Clean up any existing children in container
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		// Create a fresh canvas element to guarantee a clean WebGL context on every mount/HMR cycle
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';
		container.appendChild(canvas);

		(async () => {
			try {
				const assets = await loadAtlasAssets();
				if (!isMounted) {
					safeContinueRender();
					return;
				}

				const { image, metaData: atlasMetaData, imgWidth, imgHeight } = assets;

				const atlasTexture = new THREE.Texture(image);
				atlasTexture.colorSpace = THREE.LinearSRGBColorSpace;
				atlasTexture.flipY = false;
				atlasTexture.generateMipmaps = false;
				atlasTexture.minFilter = THREE.LinearFilter;
				atlasTexture.magFilter = THREE.LinearFilter;
				atlasTexture.needsUpdate = true;

				const renderer = new THREE.WebGLRenderer({
					canvas,
					alpha: true,
					antialias: true,
					powerPreference: 'high-performance',
				});
				renderer.setSize(width, height, false);
				renderer.setPixelRatio(1);
				renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
				renderer.toneMapping = THREE.NoToneMapping;

				const scene = new THREE.Scene();

				const initialFov = animationData.FOV || 120;
				const initialOriginY = animationData.ORIGIN_Y || 0.6;
				const camera = new THREE.PerspectiveCamera(initialFov, width / height, 1, 200000);
				camera.up.set(0, 1, 0);

				const cameraSubject = new DynamicObject({
					name: 'cameraSubject',
					frame: cameraSubjectSprite,
					x: 0,
					yOffset: 0,
					y: 0,
					z: 1000,
					scale: 1,
					rotation: 0,
					semp: true,
					alpha: 0,
				});

				const world = new SimpleWorld(initialFov, initialOriginY, cameraSubject);
				const animationState = new AnimationState(JSON.parse(JSON.stringify(animationData)));

				const actors: DynamicObject[] = [];
				const actorMap = new Map<string, DynamicObject>();
				raceSceneObjectRegistry.clear();

				// Collect unique objects
				const allObjects = new Set<string>();
				const startSeqIdx =
					animationData.HidePrevious && animationData.StartSequence
						? animationData.Sequence.findIndex((x: any) => animationData.StartSequence === x.EventID)
						: 0;
				const endSeqIdx = animationData.EndSequence
					? animationData.Sequence.findIndex((x: any) => animationData.EndSequence === x.EventID)
					: animationData.Sequence.length - 1;

				animationData.Sequence.slice(startSeqIdx, endSeqIdx + 1).forEach((seq: any) => {
					seq.Objects?.forEach((obj: any) => allObjects.add(obj.ID));
				});

				for (const objectId of allObjects) {
					let objectDef: ObjectDefinition | undefined;
					for (const seq of animationData.Sequence) {
						objectDef = seq.Objects?.find((obj: any) => obj.ID === objectId);
						if (objectDef) break;
					}
					if (!objectDef) continue;

					const initial = objectDef.Initial || {};
					const frameName = initial.frame || 'default';
					const rot3d =
						(initial as any).rotation3d ||
						(initial as any).rot ||
						(initial as any).baseRotation ||
						(typeof initial.rotation === 'object' && initial.rotation !== null ? initial.rotation : undefined);

					const actor = new DynamicObject({
						id: objectId,
						name: objectId,
						frame: frameName,
						x: initial.pos?.x || 0,
						yOffset: initial.pos?.y || 0,
						y: initial.pos?.y || 0,
						z: initial.pos?.z || 0,
						scale: initial.scale || 1,
						scaleX: initial.scaleX || 1,
						scaleY: initial.scaleY || 1,
						rotation: typeof initial.rotation === 'number' ? initial.rotation : 0,
						rotation3d: rot3d,
						alpha: initial.alpha !== undefined ? initial.alpha : 1,
						anchor: initial.anchor,
						flip: initial.flip || false,
						noCull: initial.noCull,
						blendMode: initial.BlendMode,
						maskFrame: initial.mask?.frame,
						maskDest: initial.mask?.dest,
						centerY: initial.centerY || false,
						semp: true,
					});

					const material = new THREE.MeshBasicMaterial({
						map: atlasTexture,
						transparent: true,
						depthWrite: false,
						depthTest: false,
						side: THREE.DoubleSide,
					});

					const anchorX = actor.anchor ? actor.anchor.x : 0.5;
					const anchorY = actor.anchor ? actor.anchor.y : (actor.centerY ? 0.5 : 0);

					// Static unit quad vertices based on fixed anchor points
					const positions = new Float32Array([
						-anchorX, -anchorY, 0,
						1 - anchorX, -anchorY, 0,
						1 - anchorX, 1 - anchorY, 0,
						-anchorX, 1 - anchorY, 0,
					]);
					const uvs = new Float32Array(8);
					const indices = [0, 1, 2, 0, 2, 3];

					const geometry = new THREE.BufferGeometry();
					geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
					geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
					geometry.setIndex(indices);

					// Pre-populate UV coordinates for initial frame
					const frameData = atlasMetaData[frameName];
					if (frameData) {
						const u0 = frameData.x / imgWidth;
						const u1 = (frameData.x + frameData.width) / imgWidth;
						const v0 = frameData.y / imgHeight;
						const v1 = (frameData.y + frameData.height) / imgHeight;
						const uLeft = actor.flip ? u1 : u0;
						const uRight = actor.flip ? u0 : u1;

						uvs[0] = uLeft;  uvs[1] = v1;
						uvs[2] = uRight; uvs[3] = v1;
						uvs[4] = uRight; uvs[5] = v0;
						uvs[6] = uLeft;  uvs[7] = v0;

						actor.lastFrame = frameName;
						actor.lastFlip = actor.flip;
					}

					const mesh = new THREE.Mesh(geometry, material);
					mesh.frustumCulled = false;
					mesh.rotation.order = 'YXZ';
					const initRotZDeg = typeof actor.rotation === 'number' && !isNaN(actor.rotation) ? actor.rotation : 0;
					const initRotZRad = (initRotZDeg * Math.PI) / 180;
					mesh.rotation.set(
						actor.rotation3d.x || 0,
						actor.rotation3d.y || 0,
						(actor.rotation3d.z || 0) - initRotZRad
					);
					scene.add(mesh);

					actor.mesh = mesh;
					actor.geometry = geometry;
					actor.material = material;

					actors.push(actor);
					actorMap.set(objectId, actor);
					raceSceneObjectRegistry.set(objectId, actor);
				}

				animationState.setActors(actorMap);
				animationState.setCameraSubject(cameraSubject);
				animationState.setWorld(world as any);

				threeRef.current = {
					renderer,
					scene,
					camera,
					world,
					cameraSubject,
					actors,
					animationState,
					atlasTexture,
					atlasMetaData,
					imgWidth,
					imgHeight,
				};

				setIsReady(true);
				safeContinueRender();
			} catch (err) {
				console.error('Failed to initialize Three.js RaceScene:', err);
				safeContinueRender();
			}
		})();

		return () => {
			isMounted = false;
			safeContinueRender();
			if (threeRef.current) {
				const { renderer, scene, actors, atlasTexture } = threeRef.current;
				renderer.dispose();
				try {
					renderer.forceContextLoss();
				} catch (e) {
					// Ignore if already lost
				}
				scene.clear();
				actors.forEach((act) => {
					act.geometry?.dispose();
					act.material?.dispose();
				});
				atlasTexture.dispose();
				threeRef.current = null;
			}
			raceSceneObjectRegistry.clear();
		};
	}, [animationData, cameraSubjectSprite, handle, height, width]);

	// Render loop - updates every frame deterministically
	useLayoutEffect(() => {
		if (!isReady || !threeRef.current) return;

		const {
			renderer,
			scene,
			camera,
			world,
			cameraSubject,
			actors,
			animationState,
			atlasMetaData,
			imgWidth,
			imgHeight,
		} = threeRef.current;

		// 1. Advance animation state deterministically for current frame
		animationState.updateActors(frame);

		// 2. Camera settings
		const scaleX_world = ROAD_WIDTH / (height * 0.5);
		const scaleY_world = (Y_SCALE * world.ORIGIN_Y) / (height * 0.5);

		const camX_3d = (cameraSubject.x || 0) * scaleX_world;
		const camY_3d = ((cameraSubject.yOffset ?? cameraSubject.y) || 0) * scaleY_world;
		const camZ_3d = -((cameraSubject.z || 0) + CAMERA_Z_OFFSET);

		camera.position.set(camX_3d, camY_3d, camZ_3d);
		camera.lookAt(camX_3d, camY_3d, camZ_3d - 1000);
		camera.fov = world.fov;
		if (Math.abs(world.ORIGIN_Y - 0.5) > 0.001) {
			camera.setViewOffset(width, height, 0, (world.ORIGIN_Y - 0.5) * height, width, height);
		} else {
			camera.clearViewOffset();
		}
		camera.updateProjectionMatrix();

		const fovRad = (camera.fov * Math.PI) / 180;
		const cameraDepth = 1 / Math.tan(fovRad / 2);

		// 3. Update all actors in 3D space
		for (const actor of actors) {
			const mesh = actor.mesh;
			const geometry = actor.geometry;
			const material = actor.material;
			if (!mesh || !geometry || !material) continue;

			const frameData = atlasMetaData[actor.frame];
			const isVisible =
				actor.alpha > 0.001 &&
				!actor.removed &&
				!actor.toRemove &&
				!!frameData;

			if (!isVisible) {
				mesh.visible = false;
				continue;
			}
			mesh.visible = true;

			const scale = (actor.scale || 1) * SPRITE_SCALE;
			const sx = actor.scaleX || 1;
			const sy = actor.scaleY || 1;

			// World 3D dimensions
			const W_3d = (frameData.width * scale * sx) / (height * 0.5);
			const H_3d = (frameData.height * scale * sy) / (height * 0.5);

			// Update UVs ONLY if frame or flip state changed
			if (actor.frame !== actor.lastFrame || actor.flip !== actor.lastFlip) {
				actor.lastFrame = actor.frame;
				actor.lastFlip = actor.flip;

				const u0 = frameData.x / imgWidth;
				const u1 = (frameData.x + frameData.width) / imgWidth;
				const v0 = frameData.y / imgHeight;
				const v1 = (frameData.y + frameData.height) / imgHeight;

				const uLeft = actor.flip ? u1 : u0;
				const uRight = actor.flip ? u0 : u1;

				const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute;
				const uvArr = uvAttr.array as Float32Array;
				uvArr[0] = uLeft;  uvArr[1] = v1;
				uvArr[2] = uRight; uvArr[3] = v1;
				uvArr[4] = uRight; uvArr[5] = v0;
				uvArr[6] = uLeft;  uvArr[7] = v0;
				uvAttr.needsUpdate = true;
			}

			// Apply sizing directly to mesh scale without touching vertex buffers
			mesh.scale.set(W_3d, H_3d, 1);

			// Position & rotation
			const actorX_3d = (actor.x || 0) * scaleX_world;
			const actorY_3d = ((actor.yOffset ?? actor.y) || 0) * scaleY_world;
			const actorZ_3d = -(actor.z || 0);

			mesh.position.set(actorX_3d, actorY_3d, actorZ_3d);

			const currentRotZDeg = typeof actor.rotation === 'number' && !isNaN(actor.rotation) ? actor.rotation : 0;
			const currentRotZRad = (currentRotZDeg * Math.PI) / 180;
			mesh.rotation.set(
				actor.rotation3d.x || 0,
				actor.rotation3d.y || 0,
				(actor.rotation3d.z || 0) - currentRotZRad
			);

			// Material properties
			material.opacity = Math.max(0, Math.min(1, actor.alpha !== undefined ? actor.alpha : 1));
			material.blending =
				actor.blendMode === 'Screen'
					? THREE.AdditiveBlending
					: THREE.NormalBlending;

			// Deterministic back-to-front rendering order
			mesh.renderOrder = -Math.round((actor.z || 0) * 10);

			// Screen coordinates projection for speech bubble / overlay registry
			const dz = (actor.z || 0) - ((cameraSubject.z || 0) + CAMERA_Z_OFFSET);
			if (dz > 0) {
				const anchorX = actor.anchor ? actor.anchor.x : 0.5;
				const anchorY = actor.anchor ? actor.anchor.y : (actor.centerY ? 0.5 : 0);

				const scalingFactor = cameraDepth / dz;
				const destW = frameData.width * scalingFactor * scale * sx;
				const destH = frameData.height * scalingFactor * scale * sy;
				const screenX = width * 0.5 + ((actor.x || 0) - (cameraSubject.x || 0)) * ROAD_WIDTH * scalingFactor;
				const screenY =
					height * world.ORIGIN_Y -
					(((actor.yOffset ?? actor.y) || 0) - ((cameraSubject.yOffset ?? cameraSubject.y) || 0)) *
						(Y_SCALE * world.ORIGIN_Y) *
						scalingFactor;

				actor.pos = {
					x: screenX - destW * anchorX,
					y: screenY - destH * anchorY,
				};
				actor.width = destW;
				actor.height = destH;
			}
		}

		// 4. Render current frame deterministically
		renderer.render(scene, camera);
		// Fast Refresh can clear the canvas without changing the current frame.
	});

	return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        background: animationData.background
          ? `center / cover no-repeat url("${staticFile(`backgrounds/${animationData.background}`)}")`
          : 'black',
      }}
    />
  );};
