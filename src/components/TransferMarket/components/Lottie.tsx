import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';
import lottie, { AnimationItem } from 'lottie-web';

// --- Default Configuration ---
// Import the default Lottie JSON data file
import defaultWorldCupAnimationData from '../EffectsManager/effects/Lottie/anims';

// Hardcoded values now serve as defaults
const DEFAULT_LOTTIE_START_FRAME = 75;
const DEFAULT_POSITION_TOP = 240;
const DEFAULT_POSITION_LEFT = 760;
const DEFAULT_SIZE = 400;

// --- Prop Types ---
interface WorldCupLottieProps {
  // The frame number in the Lottie timeline to start from.
  startFrame?: number;
  // The absolute Y position on screen (in pixels).
  top?: number;
  // The absolute X position on screen (in pixels).
  left?: number;
  // The size (width and height) of the Lottie container.
  size?: number;
  // The Lottie JSON animation data object.
  animationData?: any; // 'any' is suitable here as Lottie's data structure is complex
}

/**
 * A Remotion component that displays a Lottie animation. It can be configured
 * via props or will fall back to default hardcoded values.
 */
export const WorldCupLottie: React.FC<WorldCupLottieProps> = ({
  startFrame = DEFAULT_LOTTIE_START_FRAME,
  top = DEFAULT_POSITION_TOP,
  left = DEFAULT_POSITION_LEFT,
  size = DEFAULT_SIZE,
  animationData = defaultWorldCupAnimationData,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationInstanceRef = useRef<AnimationItem | null>(null);

    const frame = useCurrentFrame();

    // 1. Initialize Lottie animation. This effect now depends on `animationData`
    // so it will re-initialize if a different animation is passed.
    useEffect(() => {
        if (containerRef.current) {
            // Destroy any existing animation before creating a new one
            animationInstanceRef.current?.destroy();

            const anim = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                animationData: animationData, // Use the prop
            });
            animationInstanceRef.current = anim;
        }

        return () => {
            animationInstanceRef.current?.destroy();
            animationInstanceRef.current = null;
        };
    }, [animationData]); // Re-run if animationData prop changes

    // 2. Control the Lottie animation on every frame render
    useEffect(() => {
        // Calculate the target frame using the `startFrame` prop
        const lottieFrameToPlay = startFrame + frame;
        
        animationInstanceRef.current?.goToAndStop(lottieFrameToPlay, true);
        
    }, [frame, startFrame]); // Re-run if frame or startFrame changes

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: `${top}px`,    // Use the prop
                left: `${left}px`,  // Use the prop
                width: `${size}px`, // Use the prop
                height: `${size}px`,// Use the prop
            }}
        />
    );
};