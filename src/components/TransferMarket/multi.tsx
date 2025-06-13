import { useEffect, useRef, useMemo, useLayoutEffect, useState } from 'react';
import { RaceScene } from "./components/Race"
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
  Sequence,
  interpolate,
  spring,
  Easing
} from 'remotion';
import { Chart, Datum, SafeChart, Frame, sanitizeName } from "./helpers"
import { formatX, reverseFormatX } from "./helpers"
import { BarChartGenerator } from '../../../lib/d3/generators/BarChart';
import nameMap from "./assets/nameMap.json"
import React from 'react';
import Clock from './Clock';
import { easingFns } from '../../../lib/d3/utils/math';
import EffectsManager from './EffectsManager';
import { periodsToExclude, music, offsetts } from './audioSettings';
import colorsMap from "./assets/colorsMap.json"
import DisplayVariant1 from './displays/Variant1';
import Thumbnail from './components/Thumbanil';
import Pin from './components/Pin';

import creativity from "./assets/multi/liv_city_creativity.json"
import defense from "./assets/multi/liv_city_defense.json"
import goalContrib from "./assets/multi/liv_city_goal_contrib.json"
import progression from "./assets/multi/liv_city_progression.json"

// Extended types
type DataEvolution = {
  data: Frame[];
  metric: string;
  formatX: (x: number | string) => string
};

type Team = {
  name: string;
  short: string;
  logo: string;
};

// Your teams data - replace with actual data
const teams: Team[] = [
  { name: "manchester city", short: "MCI", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
  { name: "liverpool", short: "LIV", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" }
];

// Mock data evolutions - replace with your actual data
const dataEvolutions: DataEvolution[] = [
  {
    metric: "23/25 Goal Contributions",
    data: goalContrib,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n}⚽`
    }
  },
  {
    metric: "23/25 Creativity",
    data: creativity,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n} pts.`
    }
  },
  {
    metric: "23/25 Defense",
    data: defense,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n} pts.`
    }
  },
  {
    metric: "23/25 Progression",
    data: progression,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n}`
    }
  }
];

const PLOT_ID = "PLOTX"
const CONT_ID = "CONTAINERX"
const DURATION = 1000;
const WINNER_ANIMATION_DURATION = 210; // 3.5 seconds at 60fps

// Calculate total lifespan including all evolutions
const calculateTotalLifespan = (evolutions: DataEvolution[]) => {
  let totalFrames = 0;
  evolutions.forEach(evolution => {
    const SF = evolution.data.map(d => (d.slowDown as number) ?? 1);
    totalFrames += Math.ceil(SF.reduce((s, x) => x + s) * DURATION / 1000);
    totalFrames += Math.ceil(WINNER_ANIMATION_DURATION / 1000); // Add winner animation time
  });
  return totalFrames;
};

export const TRANSFER_LIFESPAN = calculateTotalLifespan(dataEvolutions);
console.log({ TRANSFER_LIFESPAN })
// Score Display Component
const ScoreDisplay: React.FC<{
  teams: Team[];
  scores: { [teamName: string]: number };
}> = ({ teams, scores }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 20px',
        borderRadius: 8,
        zIndex: 1000
      }}
    >
      {/* Team 1: Renders as [Logo] [Text] */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={teams[0].logo}
          style={{ width: 32, height: 32, marginTop: -2 }}
          alt={teams[0].short}
        />
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          {teams[0].short}
        </span>
      </div>

      {/* Score */}
      <div style={{
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        {scores[teams[0].name] || 0} - {scores[teams[1].name] || 0}
      </div>

      {/* Team 2: Renders as [Text] [Logo] due to row-reverse */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
        {/* The source order is now the same as Team 1: logo, then text */}
        <img
          src={teams[1].logo}
          style={{ width: 32, height: 32, marginTop: -5 }}
          alt={teams[1].short}
        />
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          {teams[1].short}
        </span>
      </div>
    </div>
  );
};

export const MetricTitle: React.FC<{
  metric: string;
  opacity?: number;
  // New prop: The number of frames each character takes to appear.
  framesPerCharacter?: number;
}> = ({
  metric,
  opacity = 1,
  // A lower number means faster typing. Default is 2 frames per character.
  framesPerCharacter = 6,
}) => {
    const frame = useCurrentFrame();
    const startFrameRef = useRef<number | null>(null);

    if (startFrameRef.current === null) {
      startFrameRef.current = frame;
    }

    const elapsedFrames = frame - (startFrameRef.current || 0);

    // --- KEY CHANGE ---
    // The total duration is now calculated dynamically based on the text length
    // and the desired speed per character.
    const totalDuration = metric.length * framesPerCharacter;

    // Interpolate now uses the dynamic totalDuration.
    // This ensures the animation speed remains constant per character.
    const charsToShow = interpolate(
      elapsedFrames,
      [0, totalDuration], // The animation timeline now scales with text length
      [0, metric.length], // The output is still the number of characters
      {
        extrapolateRight: 'clamp',
      }
    );

    const textToShow = metric.slice(0, Math.floor(charsToShow));

    const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    return (
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 36,
          fontFamily: FONT_FAMILY,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          opacity,
          textShadow: '0px 2px 6px rgba(0, 0, 0, 0.7)',
          zIndex: 100,
        }}
      >
        {textToShow}
      </div>
    );
  };
// Winner Animation Component
const WinnerAnimation: React.FC<{
  winner: Team;
  teams: Team[];
  finalTallies: { [teamName: string]: number };
  onComplete: () => void;
  frame: number;
  startFrame: number;
}> = ({ winner, teams, finalTallies, onComplete, frame, startFrame }) => {
  const animationFrame = frame - startFrame;
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: animationFrame,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 }
  });

  const tallyProgress = interpolate(
    animationFrame,
    [0, fps * 2],
    [0, 1],
    { easing: Easing.out(Easing.quad) }
  );

  const scoreFloatProgress = interpolate(
    animationFrame,
    [fps * 2, fps * 3],
    [0, 1],
    { easing: Easing.out(Easing.cubic) }
  );

  useEffect(() => {
    if (animationFrame > fps * 3.5) {
      onComplete();
    }
  }, [animationFrame, fps, onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
    >
      <div style={{
        display: 'flex',
        gap: 100,
        alignItems: 'center',
        marginBottom: 50
      }}>
        {teams.map(team => {
          const isWinner = team.name === winner.name;
          const currentTally = Math.floor(finalTallies[team.name] * tallyProgress);

          return (
            <div
              key={team.name}
              style={{
                textAlign: 'center',
                transform: isWinner ? `scale(${logoScale})` : 'scale(1)',
                opacity: isWinner ? 1 : 0.6
              }}
            >
              <img
                src={team.logo}
                style={{
                  width: 80,
                  height: 80,
                  marginBottom: 20,
                  filter: isWinner ? 'drop-shadow(0 0 20px gold)' : 'none'
                }}
                alt={team.short}
              />

              <div style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 10
              }}>
                {team.short}
              </div>

              <div style={{
                fontSize: 36,
                color: isWinner ? 'gold' : 'white',
                fontWeight: 'bold'
              }}>
                {currentTally}
              </div>
            </div>
          );
        })}
      </div>

      {tallyProgress > 0.8 && (
        <div style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: 'gold',
          textAlign: 'center',
          opacity: tallyProgress
        }}>
          🏆 {winner.short} WINS! 🏆
        </div>
      )}

      {scoreFloatProgress > 0 && (
        <div
          style={{
            position: 'absolute',
            fontSize: 64,
            fontWeight: 'bold',
            color: 'gold',
            transform: `translate(-50%, ${-scoreFloatProgress * 200}px)`,
            opacity: 1 - scoreFloatProgress,
            left: '50%',
            top: '50%'
          }}
        >
          +1
        </div>
      )}
    </div>
  );
};

export const MultiTransferMarket: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const frame = useCurrentFrame();

  const [scores, setScores] = useState<{ [teamName: string]: number }>({
    "manchester city": 0,
    "liverpool": 0
  });

  // Calculate which evolution and frame we're in
  const {
    currentEvolutionIndex,
    currentDataIndex,
    progress,
    currentEvolution,
    showWinnerAnimation,
    winnerAnimationStartFrame,
    FRAMES_PER_UNIT_POINT
  } = useMemo(() => {
    let totalFramesUsed = 0;
    let currentEvolutionIndex = 0;
    let currentEvolution = dataEvolutions[0];

    // Find which evolution we're in
    for (let i = 0; i < dataEvolutions.length; i++) {
      const evolution = dataEvolutions[i];
      const SF = evolution.data.map(d => (d.slowDown as number) ?? 1);
      const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
      const evolutionFrames = Math.ceil(SF.reduce((s, x) => x + s) * FRAMES_PER_UNIT_POINT);
      const totalEvolutionFrames = evolutionFrames + WINNER_ANIMATION_DURATION;

      if (frame < totalFramesUsed + totalEvolutionFrames) {
        currentEvolutionIndex = i;
        currentEvolution = evolution;
        break;
      }
      totalFramesUsed += totalEvolutionFrames;
    }

    const frameInEvolution = frame - totalFramesUsed;
    const SF = currentEvolution.data.map(d => (d.slowDown as number) ?? 1);
    const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
    const evolutionFrames = Math.ceil(SF.reduce((s, x) => x + s) * FRAMES_PER_UNIT_POINT);

    // Check if we're in winner animation phase
    if (frameInEvolution >= evolutionFrames) {
      return {
        currentEvolutionIndex,
        currentDataIndex: currentEvolution.data.length - 1,
        progress: 1,
        currentEvolution,
        showWinnerAnimation: true,
        winnerAnimationStartFrame: totalFramesUsed + evolutionFrames,
        FRAMES_PER_UNIT_POINT
      };
    }

    // Calculate current data index and progress within evolution
    let frameStart = 0;
    let currentDataIndex = 0;
    let currentSF = 1;

    for (let index = 0; index < SF.length; index++) {
      const sf = SF[index];
      const nextFrameStart = frameStart + sf * FRAMES_PER_UNIT_POINT;

      if (frameInEvolution <= nextFrameStart) {
        currentDataIndex = index;
        currentSF = sf;
        break;
      }
      frameStart = nextFrameStart;
    }

    const progress = (frameInEvolution - frameStart) / (currentSF * FRAMES_PER_UNIT_POINT);

    return {
      currentEvolutionIndex,
      currentDataIndex,
      progress,
      currentEvolution,
      showWinnerAnimation: false,
      winnerAnimationStartFrame: 0,
      FRAMES_PER_UNIT_POINT
    };
  }, [frame, fps]);

  const flattenedData = useMemo(() => {
    const result = [];
    for (const index in currentEvolution.data) {
      const { data, ...rest } = currentEvolution.data[index];
      result.push({ ...rest, data: data.slice(0, 15) });
    }
    return result;
  }, [currentEvolution]);

  const currentData = flattenedData[currentDataIndex];
  const prevData = flattenedData[Math.max(0, currentDataIndex - 1)].data;
  const matchDays = useMemo(() => {
    return currentEvolution.data.map(frame => frame.date.replace("MD", ""))
  }, [currentEvolution]);

  // Calculate winner and tallies
  const { winner, finalTallies } = useMemo(() => {
    if (!showWinnerAnimation) return { winner: null, finalTallies: {} };

    const finalFrame = currentEvolution.data[currentEvolution.data.length - 1];
    const tallies: { [teamName: string]: number } = {};

    teams.forEach(team => {
      tallies[team.name] = finalFrame.data
        .filter(d => d.team === team.name)
        .reduce((sum, d) => sum + d.value, 0);
    });

    const winner = teams.reduce((prev, current) =>
      tallies[current.name] > tallies[prev.name] ? current : prev
    );
    return { winner, finalTallies: tallies };
  }, [showWinnerAnimation, currentEvolution]);

  // Original chart setup
  useEffect(() => {
    if (containerRef.current === null || svgRef.current === null) {
      return;
    }
    const w = width * 0.92, h = height * 0.9;
    const margins = { mt: 180, mr: 270, mb: 100, ml: 90 };
    const dims = Object.freeze({ w, h, ...margins });
    const modifier = (chart: Chart) => {
      const safeChart = chart as SafeChart;
      safeChart
        .bar({ gap: 24, minLength: 100 })
        .barCount({ dir: 1, active: 6, max: 6 })
        .label({ fill: "#fff", rightOffset: 300, size: 26 })
        .position({ fill: "#fff", size: 64, xOffset: -65 })
        .points({ size: 48, xOffset: 100, fill: "#fff" })
        .logoXOffset(-100)
        .xAxis({
          size: 0, offset: -20,
          format: formatX,
          reverseFormat: reverseFormatX,
        })
        .dom({ svg: `#${PLOT_ID}`, container: `#${CONT_ID}` });

      return safeChart as Chart;
    };
    const defaultName = (name: string) => {
      const arr = name.split(" ")
      return arr[arr.length - 1]
    }
    const barChartRaw = BarChartGenerator<Datum>(dims)
      .accessors({
        x: d => d.value,
        y: d => (nameMap as any)[d.name] || defaultName(d.name),
        id: d => sanitizeName(d.name),
        color: d => "goldenrod",
        name: d => (nameMap as any)[d.name] || defaultName(d.name),
        logoSrc: d => {
          const sanitizedName = (nameMap as any)[d.name] || defaultName(d.name);
          return staticFile(`race-images/${sanitizedName.toLowerCase()}.png`);
        }
      });

    const barChart = modifier(barChartRaw);
    chartRef.current = barChart;
  }, [svgRef, containerRef, flattenedData, width, height]);

  useLayoutEffect(() => {
    if (!chartRef.current || !currentData) {
      return;
    }
    const chart = chartRef.current;
    const { data } = currentData;
    const easingFn = easingFns[currentData.easing || "linear"] || easingFns.linear;
    chart(prevData, data, easingFn(progress));
  }, [frame]);

  const handleWinnerAnimationComplete = () => {
    if (winner) {
      setScores(prev => ({
        ...prev,
        [winner.name]: prev[winner.name] + 1
      }));
    }
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: "black"
      }}
      id={CONT_ID}
      ref={containerRef}
    >
      {/* Persistent Score Display */}
      <ScoreDisplay teams={teams} scores={scores} />

      {/* Metric Title */}
      <MetricTitle
        metric={currentEvolution.metric}
        opacity={showWinnerAnimation ? 0.3 : 1}
      />

      <Clock x={1200} y={-248} framesPerCycle={600} frame={frame} />
      <Thumbnail />

      <RaceScene
        passive={true}
      // style={{ opacity: showWinnerAnimation ? 0.3 : 1 }}
      />

      <svg
        width={width}
        height={height}
        id={PLOT_ID}
        ref={svgRef}
        style={{
          backgroundColor: 'transparent',
          zIndex: 2,
          opacity: showWinnerAnimation ? 0.3 : 1
        }}
      ></svg>

      <EffectsManager
        svgRef={svgRef}
        frame={frame}
        progress={progress}
        data={currentData}
        prevData={prevData}
        allData={flattenedData}
        currentDataIndex={currentDataIndex}
      />

      <DisplayVariant1 style={{ opacity: showWinnerAnimation ? 0.3 : 1 }}>
        {matchDays[currentDataIndex]}
      </DisplayVariant1>

      {/* Winner Animation */}
      {showWinnerAnimation && winner && (
        <WinnerAnimation
          winner={winner}
          teams={teams}
          finalTallies={finalTallies}
          onComplete={handleWinnerAnimationComplete}
          frame={frame}
          startFrame={winnerAnimationStartFrame}
        />
      )}
    </AbsoluteFill>
  );
};