import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import lottie, { AnimationItem } from 'lottie-web';

// Import a default animation for fallback
import defaultAnimationData from '../EffectsManager/effects/Lottie/anims/wc_juggle.json';

// --- Prop Types ---
interface StandaloneLottieProps {
  /** The time in seconds for one full playback cycle. */
  durationInSeconds: number;
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
}

/**
 * A robust Remotion component that displays a Lottie animation.
 * It waits for the animation to be ready, can be looped, and fades out when not looping.
 */
export const StandaloneLottie: React.FC<StandaloneLottieProps> = ({
  durationInSeconds=3,
  loop = true,
  fadeOutSeconds = 0.3,
  animationData = defaultAnimationData,
  width = 500,
  top = 700,
  left = 200,
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

    // --- Animation Frame Calculation ---
    const rawProgress = frame / totalFramesInTimeline;
    const finalProgress = loop ? rawProgress % 1 : Math.max(0, Math.min(1, rawProgress));
    const lottieFrame = finalProgress * lottieInstance.totalFrames;
    lottieInstance.goToAndStop(lottieFrame, true);

    // --- Opacity (Fade-Out) Calculation ---
    if (!loop) {
      const fadeOutStartFrame = totalFramesInTimeline - (fadeOutSeconds * fps);
      if (frame > fadeOutStartFrame) {
        const fadeProgress = (totalFramesInTimeline - frame) / (fadeOutSeconds * fps);
        setOpacity(Math.max(0, Math.min(1, fadeProgress)));
      } else {
        setOpacity(1); // Ensure it's fully visible before the fade starts
      }
    }

  }, [isReady, frame, fps, durationInSeconds, loop, fadeOutSeconds]);

  return (
    <AbsoluteFill>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          opacity: opacity, // Apply the calculated opacity
        }}
      />
    </AbsoluteFill>
  );
}