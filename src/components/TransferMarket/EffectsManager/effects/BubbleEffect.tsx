import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig } from "remotion";
import { getGlobalBBox } from "../../../../../lib/d3/utils/math"; 
import { sanitizeName, SpeechBubbleEffect } from "../../helpers";



interface SpeechBubbleEffectProps {
    effect: SpeechBubbleEffect;
    getSvgEl: (id: string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: SpeechBubbleEffect) => void;
}

// --- Bubble Parameters ---
const BUBBLE_OFFSET_X = 24;       // Gap between target and bubble
const ARROW_WIDTH = 28;           // Width of the arrow tail
const ARROW_HEIGHT = 16;          // Height of the arrow tail
const BORDER_RADIUS = 20;         // Corner radius
const PADDING_X = 32;             // Horizontal padding inside bubble
const PADDING_Y = 24;             // Vertical padding inside bubble

// --- Animation Parameters ---
const FADE_IN_DURATION_SEC = 0.2;
const FADE_OUT_DURATION_SEC = 0.3;
const SCALE_EASING_FACTOR = 1.5;  // Back easing factor for scale animation

// --- Pulsation Parameters ---
const PULSE_FREQUENCY = 0.8;      // Gentle pulsation
const PULSE_SCALE_AMPLITUDE = 0.05; // Max scale change during pulse

const BubbleEffect: React.FC<SpeechBubbleEffectProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const [textDimensions, setTextDimensions] = useState<{ width: number; height: number } | null>(null);
    const { fps } = useVideoConfig();
    
    const groupRef = useRef<SVGGElement | null>(null);
    const measureRef = useRef<HTMLDivElement | null>(null);
    
    const groupId = useMemo(() => `speech-bubble-${sanitizeName(effect.target)}-${effect.id}`, [effect.target, effect.id]);
    
    const targetElement = useMemo(() => {
        const targetElId = `points-${sanitizeName(effect.target)}`;
        return getSvgEl(targetElId);
    }, [getSvgEl, effect.target]);

    // Process mentions and create display text
    const displayText = useMemo(() => {
        if (!effect.mentions) return effect.text;
        
        const mentions = Array.isArray(effect.mentions) ? effect.mentions : [effect.mentions];
        const mentionText = mentions.map(mention => `@${mention}`).join(' ');
        
        return `${mentionText} ${effect.text}`;
    }, [effect.text, effect.mentions]);

    // Style configuration
    const styleConfig = useMemo(() => {
        const {
            style = 'minimal',
            color = '#ffffff',
            textColor = '#1f2937',
            fontSize = 16,
            fontFamily = 'Arial, sans-serif',
            maxWidth = 280
        } = effect;

        switch (style) {
            case 'colorful':
                return {
                    background: color,
                    textColor: textColor === '#1f2937' ? '#ffffff' : textColor,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize,
                    fontFamily,
                    maxWidth,
                    borderWidth: 1
                };
            case 'comic':
                return {
                    background: color,
                    textColor,
                    borderColor: '#000000',
                    fontSize,
                    fontFamily: 'Arial Black, sans-serif',
                    maxWidth,
                    borderWidth: 2
                };
            default:
                return {
                    background: color,
                    textColor,
                    borderColor: 'rgba(0, 0, 0, 0.15)',
                    fontSize,
                    fontFamily,
                    maxWidth,
                    borderWidth: 1
                };
        }
    }, [effect]);

    // Measure text dimensions
    useEffect(() => {
        if (!measureRef.current) return;
        
        // Create a temporary element to measure text
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            visibility: hidden;
            font-size: ${styleConfig.fontSize}px;
            font-family: ${styleConfig.fontFamily};
            font-weight: 600;
            line-height: 1.4;
            max-width: ${styleConfig.maxWidth}px;
            word-wrap: break-word;
            white-space: pre-wrap;
        `;
        tempDiv.textContent = displayText;
        
        document.body.appendChild(tempDiv);
        
        setTextDimensions({
            width: tempDiv.offsetWidth,
            height: tempDiv.offsetHeight
        });
        
        document.body.removeChild(tempDiv);
    }, [displayText, styleConfig]);

    // Effect setup: Set initial frame and cleanup
    useEffect(() => {
        setFrame0(frame);

        return () => {
            if (groupRef.current && svgRef.current) {
                svgRef.current.removeChild(groupRef.current);
            }
            groupRef.current = null;
        };
    }, []);

    // SVG element creation
    useEffect(() => {
        if (!svgRef.current || !textDimensions) return;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);
        
        // Calculate bubble dimensions
        const bubbleWidth = textDimensions.width + PADDING_X * 2;
        const bubbleHeight = textDimensions.height + PADDING_Y * 2;
        
        // Create bubble path (always arrow pointing left)
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const halfBorder = styleConfig.borderWidth / 2;
        
        // Create path for bubble with left-pointing arrow
        const pathD = `
            M ${halfBorder} ${BORDER_RADIUS}
            A ${BORDER_RADIUS} ${BORDER_RADIUS} 0 0 1 ${BORDER_RADIUS} ${halfBorder}
            L ${bubbleWidth - BORDER_RADIUS} ${halfBorder}
            A ${BORDER_RADIUS} ${BORDER_RADIUS} 0 0 1 ${bubbleWidth - halfBorder} ${BORDER_RADIUS}
            L ${bubbleWidth - halfBorder} ${bubbleHeight / 2 - ARROW_WIDTH / 2}
            L ${bubbleWidth + ARROW_HEIGHT - halfBorder} ${bubbleHeight / 2}
            L ${bubbleWidth - halfBorder} ${bubbleHeight / 2 + ARROW_WIDTH / 2}
            L ${bubbleWidth - halfBorder} ${bubbleHeight - BORDER_RADIUS}
            A ${BORDER_RADIUS} ${BORDER_RADIUS} 0 0 1 ${bubbleWidth - BORDER_RADIUS} ${bubbleHeight - halfBorder}
            L ${BORDER_RADIUS} ${bubbleHeight - halfBorder}
            A ${BORDER_RADIUS} ${BORDER_RADIUS} 0 0 1 ${halfBorder} ${bubbleHeight - BORDER_RADIUS}
            Z
        `;
        
        path.setAttribute("d", pathD);
        path.setAttribute("fill", styleConfig.background);
        path.setAttribute("stroke", styleConfig.borderColor);
        path.setAttribute("stroke-width", styleConfig.borderWidth.toString());
        
        // Create text element
        const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("x", (bubbleWidth / 2).toString());
        textElement.setAttribute("y", (bubbleHeight / 2 + styleConfig.fontSize / 3).toString());
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("dominant-baseline", "middle");
        textElement.setAttribute("font-size", styleConfig.fontSize.toString());
        textElement.setAttribute("font-family", styleConfig.fontFamily);
        textElement.setAttribute("font-weight", "600");
        textElement.setAttribute("fill", styleConfig.textColor);
        
        // Handle multiline text
        const lines = displayText.split('\n');
        if (lines.length > 1) {
            lines.forEach((line, index) => {
                const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                tspan.setAttribute("x", (bubbleWidth / 2).toString());
                tspan.setAttribute("dy", index === 0 ? "0" : "1.4em");
                tspan.textContent = line;
                textElement.appendChild(tspan);
            });
        } else {
            textElement.textContent = displayText;
        }
        
        group.appendChild(path);
        group.appendChild(textElement);
        svgRef.current.appendChild(group);
        
        groupRef.current = group;

    }, [svgRef, styleConfig, textDimensions, displayText, groupId]);

    // Animation loop
    useEffect(() => {
        if (frame0 === null || !groupRef.current || !svgRef.current) {
            return;
        }

        if (!targetElement) {
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
        // Position bubble to the left of target
        const bubbleX = targetBox.x - BUBBLE_OFFSET_X - (textDimensions?.width || 0) - PADDING_X * 2 - ARROW_HEIGHT;
        const bubbleY = targetBox.y + targetBox.height / 2 - (textDimensions?.height || 0) / 2 - PADDING_Y;

        // --- Scale Animation (Back Easing) ---
        let scale = 1.0;
        if (currentTime < FADE_IN_DURATION_SEC) {
            const progress = currentTime / FADE_IN_DURATION_SEC;
            // Back easing out
            const c1 = 1.70158;
            const c3 = c1 + 1;
            const easeProgress = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
            scale = 0.2 + 0.8 * easeProgress;
        }

        // --- Pulsation (Scale) ---
        const pulseCycle = Math.sin(PULSE_FREQUENCY * 2 * Math.PI * currentTime);
        const pulseScale = 1 + PULSE_SCALE_AMPLITUDE * pulseCycle;
        scale *= pulseScale;

        // --- Opacity (Fade In/Out) ---
        let opacity = 1.0;
        
        if (FADE_IN_DURATION_SEC > 0 && currentTime < FADE_IN_DURATION_SEC) {
            opacity = Math.min(1, currentTime / FADE_IN_DURATION_SEC);
        }

        if (effect.duration >= 0 && FADE_OUT_DURATION_SEC > 0 && currentTime > effect.duration - FADE_OUT_DURATION_SEC) {
            opacity = Math.max(0, (effect.duration - currentTime) / FADE_OUT_DURATION_SEC);
        }

        // Apply transformations
        groupRef.current.setAttribute("transform", `translate(${bubbleX}, ${bubbleY}) scale(${scale})`);
        groupRef.current.setAttribute("opacity", opacity.toString());

    }, [
        frame, 
        frame0, 
        fps, 
        targetElement, 
        removeEffect, 
        effect.duration,
        textDimensions
    ]);

    return <div ref={measureRef} style={{ display: 'none' }} />;
};

export default BubbleEffect;