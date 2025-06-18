import { easingFns } from '../../../../lib/d3/utils/math';
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

const Pin: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate fade duration in frames (0.5 seconds fade out)
  const fadeDurationInFrames = fps * 0.5;
  const totalDurationInFrames = fps * duration;

  // Start fading out 0.5 seconds before the component disappears
  const fadeStartFrame = totalDurationInFrames - fadeDurationInFrames;

  // Calculate opacity
  const opacity = interpolate(
    frame,
    [0, fadeStartFrame, totalDurationInFrames],
    [1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 10000,
        top: 10,
        left: 20,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 36,
        color: "#ffffff",
        padding: "16px 20px",
        background: "linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(71, 85, 105, 0.9) 100%)",
        backdropFilter: "blur(12px)",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
        opacity: easingFns.sineInOut(opacity),
        fontWeight: 500,
        letterSpacing: "-0.02em",
        lineHeight: 1.4,
      }}
    >
      📌 Club Wealth
    </div>
  );
};

export default Pin;