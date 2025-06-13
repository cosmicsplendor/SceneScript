import React, { useMemo } from 'react'; // Removed unused imports
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import Thumbnail from '../components/Thumbanil';
import ScoreDisplay from './ScoreDisplay';
import dataEvolutions from './dataEvolutions';
import ChartEvolution from './ChartEvolution';
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

// This calculation can be simplified or removed if not used elsewhere
const calculateTotalLifespan = (evolutions: DataEvolution[], fps: number) => {
  let totalFrames = 0;
  evolutions.forEach((evolution) => {
    const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
    const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
    const evolutionFrames = Math.ceil(
      SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT
    );
    totalFrames += evolutionFrames + WINNER_ANIMATION_DURATION;
  });
  return totalFrames;
};

export const TRANSFER_LIFESPAN = calculateTotalLifespan(dataEvolutions, 60);

export const MultiTransferMarket: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Removed the unused `scoresRef` and `handleWinnerDeclared`

  // This memo correctly calculates the evolution timing and the scores
  const { currentEvolutionIndex, evolutionStartFrames, currentScores } = useMemo(() => {
    let totalFrames = 0;
    const startFrames: number[] = [];

    // Part 1: Calculate the start frame for each evolution
    for (const evolution of dataEvolutions) {
      startFrames.push(totalFrames);
      const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
      const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
      const evolutionFrames = Math.ceil(
        SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT
      );
      totalFrames += evolutionFrames + WINNER_ANIMATION_DURATION;
    }

    // Part 2: Find which evolution is currently active
    let currentIndex = startFrames.findIndex(
      (start, i) =>
        frame >= start &&
        (i + 1 === startFrames.length || frame < startFrames[i + 1])
    );
    if (currentIndex === -1) {
      currentIndex = dataEvolutions.length - 1;
    }

    // Part 3: Calculate the score based on COMPLETED evolutions
    const scoresForDisplay: { [key: string]: number } = Object.fromEntries(
        teams.map(team => [team.name.toLowerCase(), 0])
    );

    for (let i = 0; i < currentIndex; i++) {
        const evolution = dataEvolutions[i];
        const finalDataPoint = evolution.data[evolution.data.length - 1];
        const team1Final = finalDataPoint.value1;
        const team2Final = finalDataPoint.value2;

        // --- THIS IS THE FIX ---
        // If the scores were swapped, it means value1 belongs to the second team.
        // We simply reverse the team that gets the point.
        const winnerName = team1Final > team2Final ? teams[1].name : teams[0].name;
        
        scoresForDisplay[winnerName.toLowerCase()] += 1;
    }

    return {
      currentEvolutionIndex: currentIndex,
      evolutionStartFrames: startFrames,
      currentScores: scoresForDisplay,
    };
  }, [frame, fps]);

  const currentEvolution = dataEvolutions[currentEvolutionIndex];
  const startFrameForCurrentEvolution = evolutionStartFrames[currentEvolutionIndex];

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {/* ScoreDisplay now gets the correctly calculated scores */}
      <ScoreDisplay teams={teams} scores={currentScores}/>
      <Thumbnail />

      {/* 
        ChartEvolution does not need the callback anymore because the parent 
        is handling the scoring deterministically. 
        You should also remove `onWinnerDeclared` from the ChartEvolution component itself.
      */}
      <ChartEvolution
        key={currentEvolutionIndex}
        evolution={currentEvolution}
        startFrame={startFrameForCurrentEvolution}
        teams={teams}
        // onWinnerDeclared={handleWinnerDeclared} // This is no longer needed
      />
    </AbsoluteFill>
  );
};