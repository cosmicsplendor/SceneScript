import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { z } from 'zod';

// Zod schema for props validation
export const leicesterTitleSchema = z.object({});

// NEW: A custom SVG component for the precise swallowtail banner shape.
const SwallowtailBanner = ({ style }) => (
  <svg
    viewBox="0 0 520 140" // Larger viewBox for more text space
    fill="currentColor"
    className="w-[520px] h-[140px] text-leicester-blue"
    style={{
      ...style,
      // UPDATED: Added a second drop-shadow to create a vibrant glow effect.
      filter:
        'drop-shadow(0 4px 10px rgba(0, 83, 160, 0.2)) drop-shadow(0 0 20px rgba(0, 83, 160, 0.7))',
    }}
  >
    <path d="M0 0 L30 70 L0 140 L520 140 L490 70 L520 0 Z" />
  </svg>
);

export const SwallowTail = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // --- EPHEMERAL ANIMATION HOOKS ---

  // 1. Overall Intro: A soft spring for scale and opacity creates a "blossom" effect.
  const introProgress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    delay: 10,
    config: { stiffness: 100, damping: 15 },
  });

  // 2. Text Fade-in: The text appears slightly after the banner starts forming.
  const textOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 3. Outro Fade: The entire component gracefully fades away at the end.
  const outroOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames - 5],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    // Main container is centered and uses the outro animation.
    <div
      className="absolute top-0 left-0 w-full h-[300px] flex items-center justify-center"
      style={{
        opacity: outroOpacity,
        zIndex: 10e4,
      }}
    >
      {/* This inner container handles the intro spring animation */}
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `scale(${introProgress})`,
          opacity: introProgress,
        }}
      >
        <SwallowtailBanner />
        
        {/* Absolute positioning to place the text block perfectly over the banner */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-white"
          style={{ opacity: textOpacity }}
        >
          <p className="font-lato text-2xl font-light tracking-wider">
            THE YEAR
          </p>
          <p className="font-oswald text-5xl font-bold tracking-widest my-1 text-leicester-gold">
            LEICESTER
          </p>
          <p className="font-lato text-2xl font-light tracking-wider">
            WON THE PREMIER LEAGUE
          </p>
        </div>
      </div>
    </div>
  );
};