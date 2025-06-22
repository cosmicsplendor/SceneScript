import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig } from "remotion";
import { getGlobalBBox, distributeEventStartTimes } from "../../../../../lib/d3/utils/math";
import { sanitizeName, FloatEffect } from "../../helpers";


// --- Type Definitions ---

// Internal data for each floating text particle
interface FloatParticleData {
    svgElement: SVGTextElement;
    spawnTime: number; // In seconds, from the start of the effect
    initialOffsetX: number; // Randomness to avoid perfect overlap
    initialOffsetY: number;
    // CHANGED: This property now stores the total, one-way drift distance.
    driftDistance: number;
}

interface FloatEffectProps {
    effect: FloatEffect;
    getSvgEl: (id: string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: FloatEffect) => void;
}

// --- Animation Parameters ---
const LIFESPAN = 1.2;
const TRAVEL_DISTANCE_DEFAULT = 80;
const FONT_SIZE_DEFAULT = 40;
const SPAWN_OFFSET_RANGE = 20;
// ADDED: The maximum distance a particle can drift on its orthogonal axis.
const ORTHOGONAL_DRIFT_RANGE_MAX = 100;

const FloatEffectComponent: React.FC<FloatEffectProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const { fps } = useVideoConfig();
    const particlesRef = useRef<FloatParticleData[]>([]);
    const groupRef = useRef<SVGGElement | null>(null);

    const groupId = useMemo(() => `float-effect-${frame0}-${sanitizeName(effect.target)}`, [effect.target, frame0]);
    const targetElement = useMemo(() => getSvgEl(`${effect.targetEl ? effect.targetEl: "points"}-${sanitizeName(effect.target)}`), [getSvgEl, effect.target]);

    const cleanup = () => {
        if (groupRef.current && svgRef.current?.contains(groupRef.current)) {
            svgRef.current.removeChild(groupRef.current);
        }
        groupRef.current = null;
        particlesRef.current = [];
    };

    useEffect(() => {
        setFrame0(frame);
        return cleanup;
    }, []);

    // Particle preparation effect
    useEffect(() => {
        if (!svgRef.current || !targetElement || frame0 === null) return;
        
        cleanup();

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);
        svgRef.current.appendChild(group);
        groupRef.current = group;

        const burstStartTimes = distributeEventStartTimes(effect.duration, LIFESPAN, effect.bursts, "space-between");

        const STROKE_WIDTH = Math.round((effect.fontSize || FONT_SIZE_DEFAULT) * 0.05);
        
        // ADDED: Support for multiple texts
        const texts = Array.isArray(effect.text) ? effect.text : [effect.text || "+1"];
        
        // ADDED: Create distribution indices for drift
        const driftIndices = Array.from({ length: effect.bursts }, (_, i) => i);
        
        // ADDED: Apply distribution pattern based on effect.dist
        if (effect.dist === "random") {
            // Fisher-Yates shuffle for random distribution
            for (let i = driftIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [driftIndices[i], driftIndices[j]] = [driftIndices[j], driftIndices[i]];
            }
        }
        // Default is serial (no shuffling needed)
        
        for (let i = 0; i < effect.bursts; i++) {
            const spawnTime = burstStartTimes[i % burstStartTimes.length];
            if (spawnTime === undefined) continue;

            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            
            // ADDED: Randomly select text from array
            const randomText = texts[Math.floor(Math.random() * texts.length)];
            textEl.textContent = randomText;
            
            textEl.setAttribute("fill", effect.fillColor || "white");
            textEl.setAttribute("stroke", effect.strokeColor || "black");
            textEl.setAttribute("stroke-width", STROKE_WIDTH.toString());
            textEl.setAttribute("font-family", effect.font || "Segoe UI, Impact, sans-serif");
            textEl.setAttribute("font-size", (effect.fontSize || FONT_SIZE_DEFAULT).toString());
            textEl.setAttribute("font-weight", "bold");
            
            textEl.setAttribute("text-anchor", "middle");
            textEl.setAttribute("dominant-baseline", "middle");
            
            textEl.setAttribute("visibility", "hidden");
            group.appendChild(textEl);
            
            // CHANGED: Calculate distributed drift distance with configurable amplitude
            const driftIndex = driftIndices[i];
            const normalizedIndex = effect.bursts > 1 ? driftIndex / (effect.bursts - 1) : 0.5;
            const driftAmplitude = (effect.drift !== undefined ? effect.drift : 1.0) * ORTHOGONAL_DRIFT_RANGE_MAX;
            const distributedDrift = (normalizedIndex - 0.5) * 2 * driftAmplitude;
            
            particlesRef.current.push({
                svgElement: textEl,
                spawnTime,
                initialOffsetX: (Math.random() - 0.5) * SPAWN_OFFSET_RANGE,
                initialOffsetY: (Math.random() - 0.5) * SPAWN_OFFSET_RANGE,
                // CHANGED: Use calculated distribution with configurable amplitude
                driftDistance: distributedDrift,
            });
        }

    }, [svgRef, targetElement, effect, frame0]);


    // Animation loop
    useEffect(() => {
        if (frame0 === null || !targetElement) return;

        const t = (frame - frame0) / fps;

        if (t > effect.duration) {
            removeEffect(effect);
            return;
        }

        const targetBox = getGlobalBBox(targetElement as SVGGraphicsElement);
        
        // ADDED: Configurable anchor offset with defaults
        const anchorOffsetX = effect.offsetX || 0;
        const anchorOffsetY = effect.offsetY || 0;
        
        const originX = targetBox.x + targetBox.width / 2 + anchorOffsetX;
        const originY = targetBox.y + targetBox.height / 2 + anchorOffsetY;

        particlesRef.current.forEach(p => {
            const age = t - p.spawnTime;

            if (age < 0 || age > LIFESPAN) {
                p.svgElement.setAttribute("visibility", "hidden");
                return;
            }
            
            if (p.svgElement.getAttribute("visibility") === "hidden") {
                p.svgElement.setAttribute("visibility", "visible");
            }
            
            const progress = age / LIFESPAN;
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const opacity = 1.0 - progress;

            const travelDistance = effect.range || TRAVEL_DISTANCE_DEFAULT;
            const distance = easedProgress * travelDistance;
            
            // CHANGED: Calculate drift by applying the same easing to the total drift distance.
            // This is no longer a cyclical sine wave.
            const drift = p.driftDistance * easedProgress;

            let dx = 0, dy = 0;
            const dir = effect.dir || "up";

            switch (dir) {
                case "right":
                    dx = distance;
                    dy = drift;
                    break;
                case "down":
                    dy = distance;
                    dx = drift;
                    break;
                case "up":
                default:
                    dy = -distance;
                    dx = drift;
                    break;
            }

            const finalX = originX + p.initialOffsetX + dx;
            const finalY = originY + p.initialOffsetY + dy;
            
            p.svgElement.setAttribute("transform", `translate(${finalX}, ${finalY})`);
            p.svgElement.setAttribute("opacity", opacity.toString());
        });

    }, [frame, frame0, fps, targetElement, effect, removeEffect]);

    return <></>;
};

export default FloatEffectComponent;