import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import Thumbnail from '../components/Thumbanil';
import ScoreDisplay from './ScoreDisplay';
import dataEvolutions from './dataEvolutions';
import ChartEvolution from './ChartEvolution'; // Import the new component
import { Frame } from '../helpers';
import {RaceScene} from '../components/Race';

// Keep your types, constants, and data here
export type DataEvolution = {
  data: Frame[];
  metric: string;
  formatX: (x: number | string) => string;
  fixed?: boolean;
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
const FADE_DURATION = 20; // Duration for fade in/out in frames

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
  
  // State for managing ChartEvolution visibility
  const [chartVisible, setChartVisible] = useState(true);

  // We use a ref for scores to avoid re-renders when the callback is called.
  // The ScoreDisplay component will read this on every frame.
  const scoresRef = useRef<{ [key: string]: number }>(
    Object.fromEntries(teams.map(team => [team.name.toLowerCase(), 0]))
  );

  // This memo pre-calculates the start frame of each evolution
  const { currentEvolutionIndex, evolutionStartFrames, currentScores } = useMemo(() => {
    let totalFrames = 0;
    const startFrames: number[] = [];
    const calculatedScores: { [key: string]: number } = Object.fromEntries(
        teams.map(team => [team.name.toLowerCase(), 0])
    );

    // This loop now serves two purposes:
    // 1. Find the start frame for each evolution
    // 2. Tally the scores from all *previous* evolutions
    for (const evolution of dataEvolutions) {
      startFrames.push(totalFrames);

      // Determine the winner of this evolution to tally the score
      const team1Final = evolution.data[evolution.data.length - 1].value1;
      const team2Final = evolution.data[evolution.data.length - 1].value2;
      const winnerName = team1Final > team2Final ? teams[0].name : teams[1].name;
      calculatedScores[winnerName.toLowerCase()] += 1;

      const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
      const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
      const evolutionFrames = Math.ceil(
        SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT
      );
      totalFrames += evolutionFrames + WINNER_ANIMATION_DURATION;
    }

    // Find which evolution we are currently in based on the frame number
    let currentIndex = startFrames.findIndex(
      (start, i) =>
        frame >= start &&
        (i + 1 === startFrames.length || frame < startFrames[i + 1])
    );

    // If the video is over, clamp to the last index
    if (currentIndex === -1) {
      currentIndex = dataEvolutions.length - 1;
    }

    // Now, we create the final scores object FOR THE CURRENT FRAME
    // by only including scores from evolutions *before* the current one.
    const scoresForDisplay: { [key: string]: number } = Object.fromEntries(
        teams.map(team => [team.name.toLowerCase(), 0])
    );
    for (let i = 0; i < currentIndex; i++) {
        const evolution = dataEvolutions[i];
        const team1Final = evolution.data[evolution.data.length - 1].value1;
        const team2Final = evolution.data[evolution.data.length - 1].value2;
        const winnerName = team1Final > team2Final ? teams[0].name : teams[1].name;
        scoresForDisplay[winnerName.toLowerCase()] += 1;
    }

    return {
      currentEvolutionIndex: currentIndex,
      evolutionStartFrames: startFrames,
      currentScores: scoresForDisplay,
    };
  }, [frame, fps]);

  // Reset visibility when evolution changes
  useEffect(() => {
    setChartVisible(true);
  }, [currentEvolutionIndex]);

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

  // Callback for when ChartEvolution is ready to unmount
  const handleReadyToUnmount = useCallback(() => {
    setChartVisible(false);
  }, []);

  const currentEvolution = dataEvolutions[currentEvolutionIndex];
  const startFrameForCurrentEvolution = evolutionStartFrames[currentEvolutionIndex];

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {/* Persistent UI Elements */}
      <ScoreDisplay teams={teams} scores={currentScores}/>
      <Thumbnail />

      {/* The Magic: Render the active evolution with a unique key */}
      {/* When `currentEvolutionIndex` changes, the old component unmounts */}
      {/* and a new one mounts, giving us a completely fresh start. */}
      <RaceScene passive={true} />
      
      {/* ChartEvolution with self-managed fade functionality */}
      {chartVisible && (
        <ChartEvolution
          key={currentEvolutionIndex}
          evolution={currentEvolution}
          startFrame={startFrameForCurrentEvolution}
          teams={teams}
          onWinnerDeclared={handleWinnerDeclared}
          onReadyToUnmount={handleReadyToUnmount}
        />
      )}
    </AbsoluteFill>
  );
};