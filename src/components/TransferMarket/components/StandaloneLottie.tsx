import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import lottie, { AnimationItem } from 'lottie-web';

// Import a default animation for fallback
import defaultAnimationData from '../assets/lottie/football.json';
import { startSequenceFrame } from './Race';

// --- Prop Types ---
interface StandaloneLottieProps {
  /** The time in seconds for one full playback cycle. */
  durationInSeconds: number;
  /** The frame number when the animation should start playing. @default 0 */
  startFrame?: number;
  /** If true, the animation repeats. If false, it plays once and then fades out. @default false */
  loop?: boolean;
  /** The time in seconds for the fade-out at the end of a non-looping animation. @default 0.3 */
  fadeOutSeconds?: number;
  /** The Lottie JSON animation data object. */
  animationData?: any;
  /** The desired width in pixels. Height is calculated automatically. @default 500 */
  width?: number;
  /** The absolute Y position on screen (in pixels). @default 0 */
  top?: number;
  /** The absolute X position on screen (in pixels). @default 0 */
  left?: number;
  persist?: boolean
}

/**
 * A robust Remotion component that displays a Lottie animation.
 * It waits for the animation to be ready, can be looped, and fades out when not looping.
 * Now supports defining a start frame for delayed animation start.
 */
export const StandaloneLottie: React.FC<StandaloneLottieProps> = ({
  durationInSeconds = 5,
  startFrame = 0,
  loop = true,
  fadeOutSeconds = 0.3,
  animationData = defaultAnimationData,
  width = 200,
  top = 164,
  left = 50,
  persist = false
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieInstanceRef = useRef<AnimationItem | null>(null);

  // State to ensure Lottie is fully loaded before we try to control it.
  const [isReady, setIsReady] = useState(false);
  // State to control the fade-out opacity.
  const [opacity, setOpacity] = useState(1);

  const dimensions = useMemo(() => {
    if (!animationData || !animationData.w || !animationData.h) {
      return { width, height: width };
    }
    const aspectRatio = animationData.w / animationData.h;
    const height = width / aspectRatio;
    return { width, height };
  }, [animationData, width]);

  // 1. Initialize Lottie and wait for it to be ready.
  useEffect(() => {
    if (containerRef.current) {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: animationData,
      });
      lottieInstanceRef.current = anim;

      const onDOMLoaded = () => setIsReady(true);
      anim.addEventListener('DOMLoaded', onDOMLoaded);

      // Cleanup function
      return () => {
        anim.removeEventListener('DOMLoaded', onDOMLoaded);
        anim.destroy();
        lottieInstanceRef.current = null;
        setIsReady(false);
      };
    }
  }, [animationData]);

  // 2. Main animation loop: Control Lottie frame and opacity.
  useEffect(() => {
    // ---- The crucial guard clause ----
    // Only run if the Lottie instance is fully loaded and ready.
    if (!isReady || !lottieInstanceRef.current) {
      return;
    }

    const lottieInstance = lottieInstanceRef.current;
    const totalFramesInTimeline = durationInSeconds * fps;

    if (totalFramesInTimeline <= 0) {
      lottieInstance.goToAndStop(0, true);
      return;
    }

    // Calculate the relative frame (accounting for start frame)
    const relativeFrame = frame - startFrame + startSequenceFrame;

    // If we haven't reached the start frame yet, hide the animation
    if (relativeFrame < 0) {
      setOpacity(0);
      lottieInstance.goToAndStop(0, true);
      return;
    }

    // Calculate fade-out timing
    const fadeOutStartFrame = totalFramesInTimeline - (fadeOutSeconds * fps);

    // --- Animation Frame Calculation ---
    const rawProgress = relativeFrame / totalFramesInTimeline;
    const finalProgress = loop ? rawProgress % 1 : Math.max(0, Math.min(1, rawProgress));
    const lottieFrame = finalProgress * lottieInstance.totalFrames;
    lottieInstance.goToAndStop(lottieFrame, true);

    // --- Opacity Calculation ---
    if (loop) {
      // Looping animation is always visible
      setOpacity(1);
    } else if (persist) {
      // Non-looping, persistent animation stays at full opacity
      setOpacity(1);
    } else {
      // Non-looping, non-persistent animation with fade-out
      if (relativeFrame <= fadeOutStartFrame) {
        // Before fade-out starts
        setOpacity(1);
      } else if (relativeFrame < totalFramesInTimeline) {
        // During fade-out period
        const fadeProgress = (totalFramesInTimeline - relativeFrame) / (fadeOutSeconds * fps);
        setOpacity(Math.max(0, Math.min(1, fadeProgress)));
      } else {
        // After animation ends
        setOpacity(0);
      }
    }

  }, [isReady, frame, fps, durationInSeconds, startFrame, loop, fadeOutSeconds, persist]);

  return (
    <AbsoluteFill>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          zIndex: 10e10,
          top: `${top}px`,
          left: `${left}px`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          opacity: opacity, // Apply the calculated opacity
        }}
      />
    </AbsoluteFill>
  );
};