import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig, staticFile } from "remotion";
import { getGlobalBBox } from "../../../../../lib/d3/utils/math"; 
import { ImageEffect, sanitizeName } from "../../helpers"; // Assuming ImageEffect type and sanitizeName are defined in helpers

interface ImageEffectProps {
    effect: ImageEffect;
    getSvgEl: (id: string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: ImageEffect) => void;
}

// --- Default Parameters ---
const DEFAULT_IMAGE_OFFSET_X = 48;    // Default gap between target and image
const DEFAULT_IMAGE_OFFSET_Y = 0;     // Default vertical offset
const DEFAULT_PULSE_FREQUENCY = 1.5;  // Default pulsations per second (Hz)
const DEFAULT_PULSE_TRANSLATE_X_AMPLITUDE = 8; // Default max pixels the image will shift leftward during pulse

// --- Fade Parameters ---
const FADE_IN_DURATION_SEC: number = 0.2;
const FADE_OUT_DURATION_SEC: number = 0.3;

const ImageEffectComponent: React.FC<ImageEffectProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const { fps } = useVideoConfig();
    
    const groupRef = useRef<SVGGElement | null>(null);
    const groupId = useMemo(() => `image-effect-${sanitizeName(effect.target)}`, [effect.target]);
    
    // Extract configurable parameters with defaults
    const offsetX = effect.offsetX ?? DEFAULT_IMAGE_OFFSET_X;
    const offsetY = effect.offsetY ?? DEFAULT_IMAGE_OFFSET_Y;
    const pulseFreq = effect.pulseFreq ?? DEFAULT_PULSE_FREQUENCY;
    const pulseAmp = effect.pulseAmp ?? DEFAULT_PULSE_TRANSLATE_X_AMPLITUDE;
    
    // Handle URL: use staticFile for local files, or as-is for http/httpss URLs
    const imageSrc = useMemo(() => {
        const isExternalUrl = effect.src.startsWith('http://') || effect.src.startsWith('https://');
        return isExternalUrl ? effect.src : staticFile("images/" +effect.src);
    }, [effect.src]);
    
    const targetElement = useMemo(() => {
        const targetElId = `${effect.targetEl ?? "points"}-${sanitizeName(effect.target)}`;
        return getSvgEl(targetElId);
    }, [getSvgEl, effect]);

    // Effect setup: Set initial frame and cleanup
    useEffect(() => {
        setFrame0(frame);

        return () => {
            if (groupRef.current && svgRef.current) {
                // Check if the child is still there before trying to remove it
                if (svgRef.current.contains(groupRef.current)) {
                    svgRef.current.removeChild(groupRef.current);
                }
            }
            groupRef.current = null;
        };
    }, []); // Runs once on mount and cleans up on unmount

    // SVG element creation
    useEffect(() => {
        if (!svgRef.current) return;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);
        // --- FIX: START ---
        // Set initial opacity to 0 to prevent flicker at (0,0).
        // The animation loop will handle the fade-in.
        group.setAttribute("opacity", "0");
        // --- FIX: END ---
        
        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("href", imageSrc);
        image.setAttribute("height", effect.height.toString());
        image.setAttribute("preserveAspectRatio", "xMidYMid meet");
        // Position image so its center-right edge aligns with the group's origin (0,0)
        image.setAttribute("x", (-effect.height).toString()); // Use height as initial estimate, will be updated on load
        image.setAttribute("y", (-effect.height / 2).toString());
        
        // Update x position once image loads to account for actual width
        image.onload = () => {
            // Ensure the image element still exists before modifying it
            if (image.width && image.height && image.parentElement) {
                const aspectRatio = Number(image.width) / Number(image.height);
                const actualWidth = effect.height * aspectRatio;
                image.setAttribute("x", (-actualWidth).toString());
            }
        };
        
        group.appendChild(image);
        svgRef.current.appendChild(group);
        
        groupRef.current = group;

    }, [svgRef, effect.height, effect.src, groupId]); // Refined dependencies to be more specific

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

        if (effect.duration >= 0 && currentTime > effect.duration) {
            removeEffect(effect);
            return;
        }
        
        const targetBox = getGlobalBBox(targetElement as SVGGraphicsElement);

        // --- Positioning ---
        // anchorX is where the image's right edge should be horizontally at rest.
        const anchorX = targetBox.x + targetBox.width + offsetX;
        // The image is positioned with its right edge at x=0 in local coordinates.
        // So, the group's origin (0,0) needs to be translated to:
        const baseTranslateX = anchorX;
        const translateY = targetBox.y + targetBox.height / 2 + offsetY;

        // --- Pulsation (Horizontal Translation) ---
        // sin wave from -1 to 1. Phase shift (-Math.PI / 2) makes it start at -1 (min value).
        const pulseCycle = Math.sin(pulseFreq * 2 * Math.PI * currentTime - Math.PI / 2);
        // pulseShift goes from 0 (no shift) to pulseAmp (max leftward shift)
        const pulseShift = pulseAmp * (0.5 + 0.5 * pulseCycle);
        
        const finalTranslateX = baseTranslateX - pulseShift; // Subtract to move the image leftward

        // --- Opacity (Fade In/Out) ---
        let opacity = 1.0;
        let fadeInProgress = 1.0;
        if (FADE_IN_DURATION_SEC > 0 && currentTime < FADE_IN_DURATION_SEC) {
            fadeInProgress = currentTime / FADE_IN_DURATION_SEC;
        } else if (FADE_IN_DURATION_SEC === 0 && currentTime <= 0) { // check for <= 0
             fadeInProgress = 0;
        }

        let fadeOutProgress = 1.0;
        if (effect.duration >= 0 && FADE_OUT_DURATION_SEC > 0 && currentTime > effect.duration - FADE_OUT_DURATION_SEC) {
            fadeOutProgress = Math.max(0, (effect.duration - currentTime) / FADE_OUT_DURATION_SEC);
        } else if (effect.duration >= 0 && FADE_OUT_DURATION_SEC === 0 && currentTime >= effect.duration) {
            fadeOutProgress = 0;
        }
        
        opacity = Math.max(0, Math.min(fadeInProgress, fadeOutProgress));

        // Apply transformations and style
        // No scaling pulsation, so scale is constant 1.0
        groupRef.current.setAttribute("transform", `translate(${finalTranslateX}, ${translateY}) scale(1)`);
        groupRef.current.setAttribute("opacity", opacity.toString());

    }, [
        frame, 
        frame0, 
        fps, 
        targetElement, 
        removeEffect,
        effect.duration,
        offsetX,
        offsetY,
        pulseFreq,
        pulseAmp,
        // effect.src removed as it's handled by imageSrc and the creation effect
    ]);

    return <></>;
};

export default ImageEffectComponent;