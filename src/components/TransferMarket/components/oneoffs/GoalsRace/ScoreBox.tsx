import React, { useMemo } from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';

interface ScoreBoxProps {
  scores: number[];
  color: string;
  frame: number;
  framesPerMatchDay: number;
  scoreBoxWidth: number;
  scoreBoxHeight: number;
}

export const ScoreBox: React.FC<ScoreBoxProps> = ({
  scores, color, frame, framesPerMatchDay, scoreBoxWidth, scoreBoxHeight,
}) => {
  const { fps } = useVideoConfig();

  const firstGoalMatchDayIndex = useMemo(() => scores.findIndex((score) => score > 0), [scores]);

  const emergenceAnimationStartFrame = (firstGoalMatchDayIndex - 0.7) * framesPerMatchDay;
  const emergenceSpring = spring({
    frame, fps,
    config: { stiffness: 100, damping: 15 },
    from: 0, to: 1,
    delay: emergenceAnimationStartFrame,
  });

  if (firstGoalMatchDayIndex === -1 || frame < emergenceAnimationStartFrame) {
    return null;
  }

  const currentMatchDayIndex = Math.min(Math.floor(frame / framesPerMatchDay), scores.length - 1);
  const currentScore = scores[currentMatchDayIndex];
  const previousScore = currentMatchDayIndex > 0 ? scores[currentMatchDayIndex - 1] : 0;
  const didScoreChangeThisFrame = currentScore !== previousScore;
  const transitionStartFrame = currentMatchDayIndex * framesPerMatchDay;
  const oldNumberOpacity = interpolate(frame - transitionStartFrame, [0, fps * 0.2], [1, 0], { extrapolateRight: 'clamp' });
  const newNumberSpring = spring({
    frame: frame - transitionStartFrame, fps,
    config: { stiffness: 400, damping: 12, mass: 0.8 },
    from: 0.5, to: 1,
  });

  const boxStyle: React.CSSProperties = {
    width: scoreBoxWidth,
    height: scoreBoxHeight,
    backgroundColor: color,
    borderRadius: 8, // Slightly less rounded
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 55,
    fontWeight: 'bold',
    fontFamily: "'Oswald', sans-serif", // Use the new font
    color: 'white',
    // The "3D" shadow effect from your image
    boxShadow: '0 5px 0px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    opacity: emergenceSpring,
    transform: `scale(${emergenceSpring})`,
  };

  const numberStyle: React.CSSProperties = {
    position: 'absolute',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)', // Add subtle text shadow for depth
  };

  return (
    <div style={boxStyle}>
      {didScoreChangeThisFrame ? (
        <>
          <div style={{ ...numberStyle, opacity: oldNumberOpacity }}>{previousScore}</div>
          <div style={{ ...numberStyle, transform: `scale(${newNumberSpring})` }}>{currentScore}</div>
        </>
      ) : (
        <div style={numberStyle}>{currentScore}</div>
      )}
    </div>
  );
};