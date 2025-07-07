import { getGlobalBBox } from '../../../../lib/d3/utils/math';
import React, { useState, useRef, useLayoutEffect } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    Easing,
    Sequence,
    Audio,
    staticFile,
} from 'remotion';

// --- Interfaces ---
interface SpeechBubbleData {
    text: string;
    start: number;
    duration: number;
    target: string; // The ID of the DOM element to attach to (e.g., "my-animated-div")
    offsetX?: number;
    offsetY?: number;
    arrowDir?: 'up' | 'down' | 'left' | 'right';
    fontSize?: number;
    fontFamily?: string;
    audio?: string;
    volume?: number;
    maxWidth?: number;
    mentions?: string[];
}

interface DomSpeechBubbleProps {
    bubble: SpeechBubbleData;
}
const getSvgPathAndDimensions = (
    bubbleWidth: number,
    bubbleHeight: number,
    arrowDir: 'up' | 'down' | 'left' | 'right'
) => {
    const radius = 20;
    const arrowHeight = 16;
    const arrowWidth = 28;
    const borderSize = 1;
    const halfBorder = borderSize / 2;
    let path = '';
    let viewBoxWidth = bubbleWidth;
    let viewBoxHeight = bubbleHeight;
    let foreignObjectX = 0;
    let foreignObjectY = 0;

    switch (arrowDir) {
        case 'up':
            viewBoxHeight = bubbleHeight + arrowHeight;
            foreignObjectY = arrowHeight;
            path = `M${halfBorder},${arrowHeight + radius} A${radius},${radius} 0 0 1 ${radius},${arrowHeight + halfBorder} L${bubbleWidth / 2 - arrowWidth / 2},${arrowHeight + halfBorder} L${bubbleWidth / 2},${halfBorder} L${bubbleWidth / 2 + arrowWidth / 2},${arrowHeight + halfBorder} L${bubbleWidth - radius},${arrowHeight + halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${arrowHeight + radius} L${bubbleWidth - halfBorder},${bubbleHeight + arrowHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight + arrowHeight - halfBorder} L${radius},${bubbleHeight + arrowHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight + arrowHeight - radius} Z`;
            break;
        case 'left':
            viewBoxWidth = bubbleWidth + arrowHeight;
            foreignObjectX = arrowHeight;
            path = `M${arrowHeight + halfBorder},${radius} A${radius},${radius} 0 0 1 ${arrowHeight + radius},${halfBorder} L${arrowHeight + bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${arrowHeight + bubbleWidth - halfBorder},${radius} L${arrowHeight + bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${arrowHeight + bubbleWidth - radius},${bubbleHeight - halfBorder} L${arrowHeight + radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${arrowHeight + halfBorder},${bubbleHeight - radius} L${arrowHeight + halfBorder},${bubbleHeight / 2 + arrowWidth / 2} L${halfBorder},${bubbleHeight / 2} L${arrowHeight + halfBorder},${bubbleHeight / 2 - arrowWidth / 2} Z`;
            break;
        case 'right':
            viewBoxWidth = bubbleWidth + arrowHeight;
            path = `M${halfBorder},${radius} A${radius},${radius} 0 0 1 ${radius},${halfBorder} L${bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${radius} L${bubbleWidth - halfBorder},${bubbleHeight / 2 - arrowWidth / 2} L${bubbleWidth + arrowHeight - halfBorder},${bubbleHeight / 2} L${bubbleWidth - halfBorder},${bubbleHeight / 2 + arrowWidth / 2} L${bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight - halfBorder} L${radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight - radius} Z`;
            break;
        default: // 'down'
            viewBoxHeight = bubbleHeight + arrowHeight;
            path = `M${halfBorder},${radius} A${radius},${radius} 0 0 1 ${radius},${halfBorder} L${bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${radius} L${bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight - halfBorder} L${bubbleWidth / 2 + arrowWidth / 2},${bubbleHeight - halfBorder} L${bubbleWidth / 2},${bubbleHeight + arrowHeight - halfBorder} L${bubbleWidth / 2 - arrowWidth / 2},${bubbleHeight - halfBorder} L${radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight - radius} Z`;
            break;
    }
    return { path, viewBoxWidth, viewBoxHeight, foreignObjectX, foreignObjectY, bubbleWidth, bubbleHeight };
};


const DomTargetSpeechBubble: React.FC<DomSpeechBubbleProps> = ({ bubble }) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const textRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: -9999, y: -9999 });
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    const {
        start,
        duration,
        text,
        target,
        mentions = [],
        offsetX = 0,
        offsetY = 0,
        arrowDir = 'left',
        fontSize = 32,
        fontFamily = 'Segoe UI, sans-serif',
        maxWidth = 280,
    } = bubble;

    const mentionString = mentions.map((m) => `@${m}`).join(' ');
    const renderTextWithMentions = () => {
        if (mentions.length === 0) {
            return text;
        }
        const mentionParts = mentionString.split(' ');
        return (
            <>
                {mentionParts.map((part, i) => (
                    <span key={i} style={{ color: '#1DA1F2', fontWeight: 600 }}>
                        {part}{' '}
                    </span>
                ))}
                {text}
            </>
        );
    };

    // --- THIS IS THE FIX ---
    // 1. Measure the text dimensions using an invisible div
    useLayoutEffect(() => {
        if (textRef.current) {
            const newWidth = textRef.current.offsetWidth;
            const newHeight = textRef.current.offsetHeight;

            // ONLY update state if the dimensions have actually changed.
            // This breaks the infinite loop.
            if (
                !dimensions ||
                newWidth !== dimensions.width ||
                newHeight !== dimensions.height
            ) {
                setDimensions({
                    width: newWidth,
                    height: newHeight,
                });
            }
        }
        // Because we now READ `dimensions` inside the effect, we must add it to the dependency array.
    }, [text, mentions, fontSize, fontFamily, maxWidth, dimensions]);

    // 2. Sync position with the DOM target on every frame
    useLayoutEffect(() => {
        const targetElement = document.getElementById(target);
        if (!targetElement) {
            setPosition({ x: -9999, y: -9999 });
            return;
        }

        const rect = getGlobalBBox(document.querySelector("#" +target) as any);
        let newX = 0;
        let newY = 0;

        switch (arrowDir) {
            case 'up':
                newX = rect.x + rect.width / 2;
                newY = rect.y + rect.height;
                break;
            case 'down':
                newX = rect.x + rect.width / 2;
                newY = rect.y;
                break;
            case 'right':
                newX = rect.x;
                newY = rect.y + rect.height / 2;
                break;
            case 'left':
            default:
                newX = rect.x + rect.width;
                newY = rect.y + rect.height / 2;
                break;
        }
        setPosition({ x: newX + offsetX, y: newY + offsetY });
    }, [frame, target, arrowDir, offsetX, offsetY]);

    // --- Animations & Styling ---
    const startFrame = start * fps;
    const endFrame = startFrame + duration * fps;
    const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const fadeInDuration = 0.15;
    const fadeOutStart = 0.85;
    const scale = interpolate(progress, [0, fadeInDuration], [0.2, 1], {
        easing: Easing.out(Easing.back(1.5)),
        extrapolateRight: 'clamp',
    });
    const opacity = interpolate(
        progress,
        [0, fadeInDuration, fadeOutStart, 1],
        [0, 1, 1, 0]
    );

    const styleConfig = {
        background: '#ffffff',
        textColor: '#1f2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        shadow: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))',
        font: fontFamily,
    };

    let transformOrigin = '50% 50%';
    let translateX = '-50%';
    let translateY = '-50%';

    switch (arrowDir) {
        case 'up':
            transformOrigin = '50% 0%';
            translateY = '0%';
            break;
        case 'down':
            transformOrigin = '50% 100%';
            translateY = '-100%';
            break;
        case 'right':
            transformOrigin = '100% 50%';
            translateX = '-100%';
            break;
        case 'left':
        default:
            transformOrigin = '0% 50%';
            translateX = '0%';
            break;
    }

    const renderBubble = () => {
        if (!dimensions) return null;

        const paddingX = 40;
        const paddingY = 32;
        const finalWidth = dimensions.width + paddingX;
        const finalHeight = dimensions.height + paddingY;

        const { path, viewBoxWidth, viewBoxHeight, foreignObjectX, foreignObjectY, bubbleWidth, bubbleHeight, } = getSvgPathAndDimensions(finalWidth, finalHeight, arrowDir);

        return (
            <svg
                width={viewBoxWidth}
                height={viewBoxHeight}
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                style={{ filter: styleConfig.shadow }}
            >
                <path
                    d={path}
                    fill={styleConfig.background}
                    stroke={styleConfig.borderColor}
                    strokeWidth={1}
                />
                <foreignObject
                    x={foreignObjectX}
                    y={foreignObjectY}
                    width={bubbleWidth}
                    height={bubbleHeight}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div
                            style={{
                                color: styleConfig.textColor,
                                fontSize: `${fontSize}px`,
                                fontWeight: 400,
                                fontFamily: styleConfig.font,
                                lineHeight: '1.4',
                                textAlign: 'center',
                                maxWidth: `${maxWidth}px`,
                            }}
                        >
                            {renderTextWithMentions()}
                        </div>
                    </div>
                </foreignObject>
            </svg>
        );
    };

    return (
        <>
            {/* Measurement component */}
            <div
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    top: -10000,
                    left: -10000,
                }}
            >
                <div
                    ref={textRef}
                    style={{
                        display: 'inline-block',
                        fontSize: `${fontSize}px`,
                        fontWeight: 400,
                        fontFamily: styleConfig.font,
                        lineHeight: '1.4',
                        textAlign: 'center',
                        maxWidth: `${maxWidth}px`,
                    }}
                >
                    {renderTextWithMentions()}
                </div>
            </div>

            {/* Visible component */}
            <div
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    transform: `translate(${translateX}, ${translateY}) scale(${scale})`,
                    transformOrigin: transformOrigin,
                    opacity,
                    zIndex: 2000,
                    display:
                        frame >= startFrame && frame <= endFrame ? 'block' : 'none',
                }}
            >
                {renderBubble()}
            </div>
        </>
    );
};


// --- Overlay Component (no changes needed) ---
interface DomSpeechBubbleOverlayProps {
    bubbles: SpeechBubbleData[];
}
export const DomSpeechBubble: React.FC<
    DomSpeechBubbleOverlayProps
> = ({ bubbles }) => {
    const { fps } = useVideoConfig();
    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {bubbles.map((bubble, index) => (
                <React.Fragment key={`${bubble.target}-${index}`}>
                    <DomTargetSpeechBubble bubble={bubble} />
                    {bubble.audio && (
                        <Sequence
                            from={Math.floor((bubble.start + 0.05) * fps)}
                            durationInFrames={Infinity}
                        >
                            <Audio
                                src={staticFile(bubble.audio)}
                                volume={bubble.volume === undefined ? 0.7 : bubble.volume}
                                playFrom={0}
                            />
                        </Sequence>
                    )}
                </React.Fragment>
            ))}
        </AbsoluteFill>
    );
};