import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig } from "remotion";
import { getGlobalBBox } from "../../../../../lib/d3/utils/math"; 
import { NumberEffect, sanitizeName } from "../../helpers"; // Assuming NumberEffect type and sanitizeName are defined in helpers

interface NumberEffectProps {
    effect: NumberEffect;
    getSvgEl: (id: string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: NumberEffect) => void;
}

// --- Number Display Parameters ---
const FONT_SIZE = 32;
const FONT_FAMILY = "Arial, sans-serif";
const FONT_WEIGHT = "bold";
const NUMBER_OFFSET_X = 36;      // Gap between target and number text
const NUMBER_OFFSET_Y = 0;      // Vertical offset from target center

// --- Fade Parameters ---
const FADE_IN_DURATION_SEC: number = 0.2;
const FADE_OUT_DURATION_SEC: number = 0.3;

const NumberEffectComponent: React.FC<NumberEffectProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const { fps } = useVideoConfig();
    
    const groupRef = useRef<SVGGElement | null>(null);
    const groupId = useMemo(() => `number-effect-${sanitizeName(effect.target)}`, [effect.target]);
    
    const targetElement = useMemo(() => {
        const targetElId = `points-${sanitizeName(effect.target)}`;
        return getSvgEl(targetElId);
    }, [getSvgEl, effect.target]);

    // Effect setup: Set initial frame and cleanup
    useEffect(() => {
        setFrame0(frame);
        effect.format = x => `🏆x${x.toFixed(0)} `; // Default format function if not provided
        return () => {
            if (groupRef.current && svgRef.current) {
                svgRef.current.removeChild(groupRef.current);
            }
            groupRef.current = null;
        };
    }, []); // Runs once on mount and cleans up on unmount

    // SVG element creation
    useEffect(() => {
        if (!svgRef.current) return;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-size", FONT_SIZE.toString());
        text.setAttribute("font-family", FONT_FAMILY);
        text.setAttribute("font-weight", FONT_WEIGHT);
        text.setAttribute("fill", effect.color);
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.textContent = "0"; // Initial text content
        
        group.appendChild(text);
        svgRef.current.appendChild(group);
        
        groupRef.current = group;

    }, [svgRef, effect.color, groupId]); // Dependencies for creating/updating SVG number

    // Animation loop
    useEffect(() => {
        if (frame0 === null || !groupRef.current || !svgRef.current) {
            return;
        }

        if (!targetElement) {
            // Optionally hide or handle if target disappears mid-effect
            groupRef.current.setAttribute("opacity", "0");
            return;
        }

        const currentTime = (frame - frame0) / fps;

        if (currentTime > effect.duration && effect.duration >= 0) {
            removeEffect(effect);
            return;
        }
        
        const targetBox = getGlobalBBox(targetElement as SVGGraphicsElement);

        // --- Positioning ---
        const translateX = targetBox.x + targetBox.width + NUMBER_OFFSET_X;
        const translateY = targetBox.y + targetBox.height / 2 + NUMBER_OFFSET_Y;

        // --- Number Animation ---
        // Calculate the change duration (fraction of total duration)
        const changeDuration = effect.duration * effect.changeFrac;
        let currentValue = 0;
        
        if (currentTime <= changeDuration) {
            // Interpolate from 0 to effect.value during changeFrac portion
            const progress = currentTime / changeDuration;
            // Use easeOutCubic for smooth deceleration
            // const easedProgress = 1 - Math.pow(1 - progress, 3);
            currentValue = effect.value * progress;
        } else {
            // Hold at final value for remaining duration
            currentValue = effect.value;
        }

        // Format the current value using the provided format function
        const formattedText = effect.format(currentValue);

        // --- Opacity (Fade In/Out) ---
        let opacity = 1.0;
        let fadeInProgress = 1.0;
        if (FADE_IN_DURATION_SEC > 0 && currentTime < FADE_IN_DURATION_SEC) {
            fadeInProgress = currentTime / FADE_IN_DURATION_SEC;
        } else if (FADE_IN_DURATION_SEC === 0 && currentTime < 0) { 
             fadeInProgress = 0;
        }

        let fadeOutProgress = 1.0;
        if (effect.duration >= 0 && FADE_OUT_DURATION_SEC > 0 && currentTime > effect.duration - FADE_OUT_DURATION_SEC) {
            fadeOutProgress = Math.max(0, (effect.duration - currentTime) / FADE_OUT_DURATION_SEC);
        } else if (effect.duration >= 0 && FADE_OUT_DURATION_SEC === 0 && currentTime >= effect.duration) {
            fadeOutProgress = 0;
        }
        
        opacity = Math.max(0, Math.min(fadeInProgress, fadeOutProgress));

        // Update text content and apply transformations
        const textElement = groupRef.current.querySelector('text');
        if (textElement) {
            textElement.textContent = formattedText;
        }
        
        groupRef.current.setAttribute("transform", `translate(${translateX}, ${translateY})`);
        groupRef.current.setAttribute("opacity", opacity.toString());

    }, [
        frame, 
        frame0, 
        fps, 
        targetElement, 
        removeEffect, 
        effect.value,
        effect.changeFrac,
        effect.format,
        effect.duration,
    ]);

    return <></>;
};

export default NumberEffectComponent;