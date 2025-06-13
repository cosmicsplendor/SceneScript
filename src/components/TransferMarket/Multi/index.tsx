import React, { useMemo, useState, useCallback, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import Thumbnail from '../components/Thumbanil';
import ScoreDisplay from './ScoreDisplay';
import dataEvolutions from './dataEvolutions';
import ChartEvolution from './ChartEvolution'; // Import the new component
import { Frame } from '../helpers';

// Keep your types, constants, and data here
export type DataEvolution = {
  data: Frame[];
  metric: string;
  formatX: (x: number | string) => string;
};

export type Team = {
  name: string;
  short: string;
  logo: string;
};

const teams: Team[] = [
  { name: "Man City", short: "MCI", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
  { name: "Liverpool", short: "LIV", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" }
];

const DURATION = 1000;
const WINNER_ANIMATION_DURATION = 210;

// This calculation remains the same
const calculateTotalLifespan = (evolutions: DataEvolution[], fps: number) => {
  let totalFrames = 0;
  evolutions.forEach((evolution) => {
    const FRAMES_PER_UNIT_POINT = DURATION / 1000;
    const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
    const evolutionFrames = Math.ceil(
      SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT
    );
    totalFrames += evolutionFrames + WINNER_ANIMATION_DURATION/fps;
  });
  return totalFrames;
};
export const TRANSFER_LIFESPAN = calculateTotalLifespan(dataEvolutions, 60)
export const MultiTransferMarket: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // We use a ref for scores to avoid re-renders when the callback is called.
  // The ScoreDisplay component will read this on every frame.
  const scoresRef = useRef<{ [key: string]: number }>(
    Object.fromEntries(teams.map(team => [team.name.toLowerCase(), 0]))
  );

  // This memo pre-calculates the start frame of each evolution
  const { currentEvolutionIndex, evolutionStartFrames } = useMemo(() => {
    let totalFrames = 0;
    const startFrames: number[] = [];

    for (const evolution of dataEvolutions) {
      startFrames.push(totalFrames);
      const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
      const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
      const evolutionFrames = Math.ceil(
        SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT
      );
      totalFrames += evolutionFrames + WINNER_ANIMATION_DURATION;
    }

    // Find which evolution we are in
    let currentIndex = startFrames.findIndex(
      (start, i) =>
        frame >= start &&
        (i + 1 === startFrames.length || frame < startFrames[i + 1])
    );
    
    // Clamp index to a valid range
    if (currentIndex === -1) {
        currentIndex = dataEvolutions.length - 1;
    }


    return {
      currentEvolutionIndex: currentIndex,
      evolutionStartFrames: startFrames,
    };
  }, [frame, fps]);

  // Callback to update scores.
  // Use `useCallback` to ensure the function identity is stable.
  const handleWinnerDeclared = useCallback((winner: Team) => {
      // The winner animation `onComplete` can be called on multiple frames.
      // We check if the score has already been updated for this evolution to prevent duplicates.
      if (scoresRef.current[winner.name.toLowerCase()] < currentEvolutionIndex + 1) {
          scoresRef.current[winner.name.toLowerCase()] += 1;
          console.log(`Score updated for ${winner.name}. New scores:`, scoresRef.current);
      }
  }, [currentEvolutionIndex]);


  const currentEvolution = dataEvolutions[currentEvolutionIndex];
  const startFrameForCurrentEvolution = evolutionStartFrames[currentEvolutionIndex];

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {/* Persistent UI Elements */}
      <ScoreDisplay teams={teams} scoresRef={scoresRef} />
      <Thumbnail />

      {/* The Magic: Render the active evolution with a unique key */}
      {/* When `currentEvolutionIndex` changes, the old component unmounts */}
      {/* and a new one mounts, giving us a completely fresh start. */}
      <ChartEvolution
        key={currentEvolutionIndex}
        evolution={currentEvolution}
        startFrame={startFrameForCurrentEvolution}
        teams={teams}
        onWinnerDeclared={handleWinnerDeclared}
      />
    </AbsoluteFill>
  );
};