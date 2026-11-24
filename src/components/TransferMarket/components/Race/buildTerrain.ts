import * as THREE from 'three';
import { staticFile } from 'remotion';

export interface TerrainConfig {
	size: { x: number; z: number };
	segments?: number;
	lowPoly?: boolean;
	repeat?: number;
	baseTexture: string;
	hillTexture?: string;
	position?: { x?: number; y?: number; z?: number };
	heightFn?: string;
	blendFn?: string;
	wireframe?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, v: number) => {
	const t = clamp((v - e0) / (e1 - e0), 0, 1);
	return t * t * (3 - 2 * t);
};

function compile(expr: string | undefined, args: string[], fallback: number) {
	if (!expr) return () => fallback;
	const fn = new Function(...args, 'smoothstep', 'clamp', 'mix', `"use strict"; return (${expr});`);
	return (...a: number[]) => {
		const v = fn(...a, smoothstep, clamp, mix);
		if (!Number.isFinite(v)) throw new Error(`Terrain fn "${expr}" returned ${v} for (${a.join(', ')})`);
		return v as number;
	};
}

let heightAt: (x: number, z: number) => number = () => 0;
/** Use this to ground sprites/models on the terrain. */
export const terrainHeightAt = (x: number, z: number) => heightAt(x, z);

export async function buildTerrain(cfg: TerrainConfig, renderer: THREE.WebGLRenderer) {
	const segments = cfg.segments ?? 64;
	const repeat = cfg.repeat ?? 1;
	const heightFn = compile(cfg.heightFn, ['x', 'z'], 0);
	const blendFn = compile(cfg.blendFn, ['x', 'y', 'z', 'slope'], 0);
	const px = cfg.position?.x ?? 0, py = cfg.position?.y ?? 0, pz = cfg.position?.z ?? 0;
	heightAt = (x, z) => py + heightFn(x - px, z - pz);

	// Geometry: displace, smooth-normal pass for slope, then per-vertex blend
	let geometry: THREE.BufferGeometry = new THREE.PlaneGeometry(cfg.size.x, cfg.size.z, segments, segments);
	geometry.rotateX(-Math.PI / 2); // lay flat, +Y up
	const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) {
		pos.setY(i, heightFn(pos.getX(i), pos.getZ(i)));
	}
	geometry.computeVertexNormals();

	const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
	const blend = new Float32Array(pos.count);
	for (let i = 0; i < pos.count; i++) {
		const slope = 1 - normals.getY(i);
		blend[i] = clamp(blendFn(pos.getX(i), pos.getY(i), pos.getZ(i), slope), 0, 1);
	}
	geometry.setAttribute('aBlend', new THREE.BufferAttribute(blend, 1));

	const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) {
		pos.setZ(i, -pos.getZ(i));
		normal.setZ(i, -normal.getZ(i));
	}
	pos.needsUpdate = true;
	normal.needsUpdate = true;
	const index = geometry.getIndex();
	if (!index) throw new Error('Terrain geometry is missing triangle indices.');
	for (let i = 0; i < index.count; i += 3) {
		const second = index.getX(i + 1);
		index.setX(i + 1, index.getX(i + 2));
		index.setX(i + 2, second);
	}
	index.needsUpdate = true;

	if (cfg.lowPoly) {
		geometry = geometry.toNonIndexed(); // each triangle gets its own vertices
		geometry.computeVertexNormals();    // -> flat facets
	}

	// Textures
	const loader = new THREE.TextureLoader();
	const aniso = renderer.capabilities.getMaxAnisotropy();
	const loadTex = async (path: string) => {
		const t = await loader.loadAsync(staticFile(path));
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.colorSpace = THREE.LinearSRGBColorSpace; // matches your renderer output setup
		t.anisotropy = aniso;
		return t;
	};
	const baseTex = await loadTex(cfg.baseTexture);
	const hillTex = cfg.hillTexture ? await loadTex(cfg.hillTexture) : baseTex;

	const material = new THREE.MeshLambertMaterial();
	material.onBeforeCompile = (shader) => {
		shader.uniforms.uBase = { value: baseTex };
		shader.uniforms.uHill = { value: hillTex };
		shader.uniforms.uRepeat = { value: repeat };

		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', `#include <common>
attribute float aBlend;
varying float vBlend;
varying vec2 vTerrainUv;
uniform float uRepeat;`)
			.replace('#include <begin_vertex>', `#include <begin_vertex>
vBlend = aBlend;
vTerrainUv = uv * uRepeat;`);

		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', `#include <common>
varying float vBlend;
varying vec2 vTerrainUv;
uniform sampler2D uBase;
uniform sampler2D uHill;`)
			.replace('#include <map_fragment>', `
diffuseColor *= mix(texture2D(uBase, vTerrainUv), texture2D(uHill, vTerrainUv), vBlend);`);
	};
	material.customProgramCacheKey = () => 'terrain-blend';

	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	mesh.renderOrder = -1e9; // belt and braces; opaque draws before your transparent sprites anyway
	if (cfg.wireframe) material.wireframe = true;

	return {
		mesh,
		position: { x: px, y: py, z: pz },
		dispose() {
			geometry.dispose();
			material.dispose();
			baseTex.dispose();
			if (hillTex !== baseTex) hillTex.dispose();
		},
	};
}