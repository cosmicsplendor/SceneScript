import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig } from "remotion";
import { getGlobalBBox } from "../../../../../lib/d3/utils/math";
import { sanitizeName, ShowerEffect } from "../../helpers";

// Data model for a single particle's state.
interface ParticleData {
    svgElement: SVGPolygonElement;
    hasSpawned: boolean;
    startX?: number;
    startY?: number;
    swayOffset: number;
    fallSpeed: number;
    rotationSpeed: number;
    initialRotation: number;
    size: number;
    spawnTime: number; 
    color: string;
}

interface PaperShowerEffectProps {
    effect: ShowerEffect;
    getSvgEl: (id:string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: ShowerEffect) => void;
}

// --- Animation Parameters ---
const SPAWN_RATE_DEFAULT = 25;
const SPREAD_MULTIPLIER = 2;
const SPAWN_Y_OFFSET = -100

const PAPER_SIZE_RANGE = [20, 30];
const FALL_SPEED_RANGE = [100, 180];
const ROTATION_SPEED_RANGE = [-90, 90];
const SWAY_AMPLITUDE = 12;
const SWAY_FREQUENCY = 0.5;

// These now define the lifespan of a single particle
const FADE_IN_DURATION = 0.4;
const FADE_OUT_DURATION = 1.0;
// CRITICAL: The total time a particle is visible, from start of fade-in to end of fade-out.
const PARTICLE_LIFESPAN = FADE_IN_DURATION + FADE_OUT_DURATION + 0.6; // Added 0.6s of fully visible time

const PaperShowerEffectComponent: React.FC<PaperShowerEffectProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const { fps } = useVideoConfig();
    const particleDataRef = useRef<ParticleData[]>([]);
    const groupRef = useRef<SVGGElement | null>(null);

    const groupId = useMemo(() => `paper-shower-${sanitizeName(effect.target)}`, [effect.target]);
    const targetElement = useMemo(() => getSvgEl(`points-${sanitizeName(effect.target)}`), [getSvgEl, effect.target]);

    const cleanup = () => {
        if (groupRef.current && svgRef.current?.contains(groupRef.current)) {
            svgRef.current.removeChild(groupRef.current);
        }
        groupRef.current = null;
        particleDataRef.current = [];
    };

    useEffect(() => {
        console.log("SHOWER " + frame)

        setFrame0(frame);
        return cleanup;
    }, []);

    // Particle PREPARATION effect.
    useEffect(() => {
        if (!svgRef.current || frame0 === null) return;
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);
        svgRef.current.appendChild(group);
        groupRef.current = group;
        
        const spawnRate = SPAWN_RATE_DEFAULT;
        // **THE CORE FIX**: The window for spawning new particles ends early,
        // to give the last particle time to complete its full lifecycle.
        const spawnWindow = Math.max(0, effect.duration - PARTICLE_LIFESPAN);
        
        const totalParticles = Math.ceil(spawnWindow * spawnRate);
        const colors = effect.colors.length > 0 ? effect.colors : ['#CCCCCC'];
        
        const newParticleData: ParticleData[] = [];
        for (let i = 0; i < totalParticles; i++) {
            const size = PAPER_SIZE_RANGE[0] + Math.random() * (PAPER_SIZE_RANGE[1] - PAPER_SIZE_RANGE[0]);
            
            const w = size / 2;
            const h = (size * 0.7) / 2;
            const topW = w * 0.8;
            const points = `${-topW},-${h} ${topW},-${h} ${w},${h} ${-w},${h}`;
            
            const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            svgElement.setAttribute("points", points);
            svgElement.setAttribute("fill", colors[Math.floor(Math.random() * colors.length)]);
            svgElement.setAttribute("visibility", "hidden");
            
            group.appendChild(svgElement);

            newParticleData.push({
                svgElement,
                hasSpawned: false,
                swayOffset: Math.random() * Math.PI * 2,
                fallSpeed: (FALL_SPEED_RANGE[0] + Math.random() * (FALL_SPEED_RANGE[1] - FALL_SPEED_RANGE[0])) / fps,
                rotationSpeed: (ROTATION_SPEED_RANGE[0] + Math.random() * (ROTATION_SPEED_RANGE[1] - ROTATION_SPEED_RANGE[0])) / fps,
                initialRotation: Math.random() * 360,
                size,
                spawnTime: i / spawnRate,
                color: svgElement.getAttribute("fill")!
            });
        }
        particleDataRef.current = newParticleData;

    }, [svgRef, effect.duration, effect.colors, groupId, frame0]);

    // ANIMATION and SPAWNING loop.
    useEffect(() => {
        if (frame0 === null || !targetElement) return;

        const t = (frame - frame0) / fps;
        
        // This check is now robust. The component is removed exactly on time.
        if (t > effect.duration) {
            removeEffect(effect);
            return;
        }
        
        const currentTargetBox = getGlobalBBox(targetElement as SVGGraphicsElement);
        const spawnWidth = Math.max(currentTargetBox.width * SPREAD_MULTIPLIER, 150);
        const spawnStartX = currentTargetBox.x + currentTargetBox.width / 2 - spawnWidth / 2;
        const spawnY = currentTargetBox.y + SPAWN_Y_OFFSET;
        particleDataRef.current.forEach((p) => {
            const age = t - p.spawnTime;
            // A particle is only active during its own lifespan.
            if (age < 0 || age > PARTICLE_LIFESPAN) {
                if (p.svgElement.getAttribute("visibility") === "visible") {
                    p.svgElement.setAttribute("visibility", "hidden");
                }
                return;
            }

            if (!p.hasSpawned) {
                p.hasSpawned = true;
                p.startX = spawnStartX + Math.random() * spawnWidth;
                p.startY = spawnY - Math.random() * 80;
                p.svgElement.setAttribute("visibility", "visible");
            }

            const swayX = Math.sin(age * SWAY_FREQUENCY * 2 * Math.PI + p.swayOffset) * SWAY_AMPLITUDE;
            const posX = p.startX! + swayX;
            const posY = p.startY! + age * p.fallSpeed * fps;
            const rotation = p.initialRotation + age * p.rotationSpeed * fps;

            // **THE SECOND CORE FIX**: Opacity is based on the particle's own age
            // relative to its individual lifecycle, not the global effect time.
            let opacity = 1.0;
            const fadeOutStartTime = PARTICLE_LIFESPAN - FADE_OUT_DURATION;

            if (age < FADE_IN_DURATION) {
                opacity = age / FADE_IN_DURATION;
            } else if (age > fadeOutStartTime) {
                const fadeOutProgress = (age - fadeOutStartTime) / FADE_OUT_DURATION;
                opacity = 1 - fadeOutProgress;
            }
            
            const shimmer = 0.7 + 0.3 * Math.abs(Math.sin(rotation * Math.PI / 90));

            p.svgElement.setAttribute("transform", `translate(${posX}, ${posY}) rotate(${rotation})`);
            p.svgElement.setAttribute("opacity", Math.max(0, opacity).toString());
            p.svgElement.setAttribute("fill-opacity", shimmer.toString());
        });

    }, [frame, frame0, fps, targetElement, effect, removeEffect]);

    return <></>;
};

export default PaperShowerEffectComponent;