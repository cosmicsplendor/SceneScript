import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import lottie, { AnimationItem } from 'lottie-web';

// Import a default animation for fallback
import defaultAnimationData from '../assets/lottie/football.json';
import { startSequenceFrame, raceSceneObjectRegistry } from './Race';

// --- Prop Types ---
interface StandaloneLottieProps {
  /** The time in seconds the animation stays visible on screen. */
  durationInSeconds: number;
  /** The time in seconds for one full animation cycle/playback. If not provided, uses durationInSeconds. */
  cycleDuration?: number;
  /** The frame number when the animation should start playing. @default 0 */
  startFrame?: number;
  /** If true, the animation repeats. If false, it plays once and then fades out. @default false */
  loop?: boolean;
  /** The time in seconds for the fade-in at the beginning. @default 0.3 */
  fadeInSeconds?: number;
  /** The time in seconds for the fade-out at the end. @default 0.3 */
  fadeOutSeconds?: number;
  /** The Lottie JSON animation data object. */
  animationData?: any;
  /** The desired width in pixels. Height is calculated automatically. @default 500 */
  width?: number;
  /** The absolute Y position on screen (in pixels). @default 0 */
  top?: number;
  /** The absolute X position on screen (in pixels). @default 0 */
  left?: number;
  persist?: boolean;
  /** Optional target element ID to follow (from raceSceneObjectRegistry) */
  target?: string;
  /** X offset from target. If |value| <= 2: normalized (0.5 = half width), if > 2: absolute pixels. @default 0 */
  offsetX?: number;
  /** Y offset from target. If |value| <= 2: normalized (0.5 = half height), if > 2: absolute pixels. @default 0 */
  offsetY?: number;
  flip?: boolean;
  filter?: string;
  /** Normalized start offset (0-1). Animation begins this percentage already completed. Only applies to non-looping animations. @default 0 */
  startOffset?: number;
  /** Rotation angle in degrees. @default 0 */
  rotation?: number;
}

/**
 * A cubic ease-in-out function for smooth animations.
 * @param t Progress of the animation, from 0 to 1.
 * @returns The eased progress value.
 */
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * A robust Remotion component that displays a Lottie animation.
 * It waits for the animation to be ready, can be looped, and fades out when not looping.
 * Now supports independent cycle duration and display duration.
 * Can follow a target element from the raceSceneObjectRegistry.
 */
export const StandaloneLottie: React.FC<StandaloneLottieProps> = ({
  durationInSeconds = 5,
  cycleDuration,
  startFrame = 0,
  loop = true,
  fadeInSeconds = 0.2,
  fadeOutSeconds = 0.3,
  animationData = defaultAnimationData,
  width = 200,
  top = 164,
  left = 50,
  persist = false,
  target,
  offsetX = 0,
  offsetY = 0,
  flip = false,
  filter = "",
  startOffset = 0,
  rotation = 0
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieInstanceRef = useRef<AnimationItem | null>(null);

  // State to ensure Lottie is fully loaded before we try to control it.
  const [isReady, setIsReady] = useState(false);
  // State to control the fade-out opacity.
  const [opacity, setOpacity] = useState(0); // Start with 0 opacity for fade-in

  const dimensions = useMemo(() => {
    if (!animationData || !animationData.w || !animationData.h) {
      return { width, height: width };
    }
    const aspectRatio = animationData.w / animationData.h;
    const height = width / aspectRatio;
    return { width, height };
  }, [animationData, width]);

  // Use cycleDuration if provided, otherwise fall back to durationInSeconds
  const effectiveCycleDuration = cycleDuration ?? durationInSeconds;

  // Clamp startOffset to 0-1 range
  const clampedStartOffset = Math.max(0, Math.min(1, startOffset));

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
    if (!isReady || !lottieInstanceRef.current) {
      return;
    }

    const lottieInstance = lottieInstanceRef.current;
    const totalDisplayFrames = durationInSeconds * fps;
    const cycleFrames = effectiveCycleDuration * fps;

    if (totalDisplayFrames <= 0 || cycleFrames <= 0) {
      lottieInstance.goToAndStop(0, true);
      return;
    }

    const relativeFrame = frame - startFrame + startSequenceFrame;

    if (relativeFrame < 0 || relativeFrame >= totalDisplayFrames) {
      setOpacity(0);
      return;
    }

    // --- Animation Frame Calculation ---
    let lottieFrame: number;
    
    if (loop) {
      // In loop mode, ignore startOffset as it gets complicated
      const rawProgress = relativeFrame / cycleFrames;
      const finalProgress = rawProgress % 1;
      lottieFrame = finalProgress * lottieInstance.totalFrames;
    } else {
      // Non-looping: apply startOffset
      if (relativeFrame < cycleFrames) {
        const progress = relativeFrame / cycleFrames;
        // Apply startOffset: start from clampedStartOffset and progress to 1.0
        const adjustedProgress = clampedStartOffset + (progress * (1 - clampedStartOffset));
        lottieFrame = adjustedProgress * lottieInstance.totalFrames;
      } else {
        lottieFrame = lottieInstance.totalFrames;
      }
    }
    
    lottieInstance.goToAndStop(lottieFrame, true);

    // --- Opacity Calculation with Cubic Easing ---
    if (persist) {
      setOpacity(1);
    } else {
      const fadeInDurationFrames = fadeInSeconds * fps;
      const fadeOutStartFrame = totalDisplayFrames - (fadeOutSeconds * fps);
      let newOpacity = 1;

      // Calculate Fade-in
      if (relativeFrame < fadeInDurationFrames) {
        const fadeInProgress = relativeFrame / fadeInDurationFrames;
        newOpacity = easeInOutCubic(fadeInProgress);
      }
      // Calculate Fade-out
      else if (relativeFrame >= fadeOutStartFrame) {
        const fadeOutProgress = (totalDisplayFrames - relativeFrame) / (fadeOutSeconds * fps);
        newOpacity = easeInOutCubic(fadeOutProgress);
      }

      setOpacity(Math.max(0, Math.min(1, newOpacity)));
    }

  }, [isReady, frame, fps, durationInSeconds, effectiveCycleDuration, startFrame, loop, fadeOutSeconds, fadeInSeconds, persist, clampedStartOffset]);

  // Calculate final position
  const getPosition = (): { x: number; y: number } => {
    if (target && raceSceneObjectRegistry.has(target)) {
      const transform = raceSceneObjectRegistry.get(target)!;
      
      const normalizedOffsetX = Math.abs(offsetX) <= 2 
        ? offsetX * transform.width 
        : offsetX;
      const normalizedOffsetY = Math.abs(offsetY) <= 2 
        ? offsetY * transform.height 
        : offsetY;
      
      const x = transform.pos.x + transform.width / 2 + normalizedOffsetX - dimensions.width / 2;
      const y = transform.pos.y + transform.height / 2 + normalizedOffsetY - dimensions.height / 2;
      
      return { x, y };
    }
    
    return { x: left, y: top };
  };

  const { x, y } = getPosition();

  return (
    <AbsoluteFill>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          zIndex: 10e10,
          transform: `${flip ? "scaleX(-1)" : ""} rotate(${rotation}deg)`.trim(),
          top: `${y}px`,
          left: `${x}px`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          opacity: opacity,
          filter: filter
        }}
      />
    </AbsoluteFill>
  );
};