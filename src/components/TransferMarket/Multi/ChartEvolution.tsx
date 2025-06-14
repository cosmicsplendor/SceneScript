import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';
import { BarChartGenerator } from '../../../../lib/d3/generators/BarChart';
import { Chart, Datum, SafeChart, sanitizeName } from '../helpers';
import { reverseFormatX } from '../helpers';
import nameMap from '../assets/nameMap.json';
import { easingFns } from '../../../../lib/d3/utils/math';
import EffectsManager from '../EffectsManager';
import DisplayVariant1 from '../displays/Variant1';
import { MetricTitle } from './MetricTitle';
import WinnerAnimation from './WinnerAnimation';
import { DataEvolution, Team } from '.'; // Assuming you export types
import { EvolutionAudioOrchestrator } from './EvoAudioOrchestrator';
import dataEvolutions from './dataEvolutions';

const PLOT_ID = 'PLOTX';
const CONT_ID = 'CONTAINERX';
const DURATION = 1000;
const FADE_DURATION = 20; // Duration for fade in/out in frames
const WINNER_ANIMATION_DURATION = 210; // Total duration for winner animation

type ChartEvolutionProps = {
  evolution: DataEvolution;
  startFrame: number;
  teams: Team[];
  onWinnerDeclared: (winner: Team) => void;
  onReadyToUnmount?: () => void;
};

const ChartEvolution: React.FC<ChartEvolutionProps> = ({
  evolution,
  startFrame,
  teams,
  onWinnerDeclared,
  onReadyToUnmount,
}) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [winnerAnimationComplete, setWinnerAnimationComplete] = useState(false);

  const {
    currentDataIndex,
    progress,
    showWinnerAnimation,
    winnerAnimationStartFrame,
  } = useMemo(() => {
    const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
    const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
    const evolutionFrames = Math.ceil(
      SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT
    );

    if (localFrame >= evolutionFrames) {
      return {
        currentDataIndex: evolution.data.length - 1,
        progress: 1,
        showWinnerAnimation: true,
        winnerAnimationStartFrame: evolutionFrames,
      };
    }

    let frameStart = 0;
    let currentDataIndex = 0;
    let currentSF = 1;

    for (let index = 0; index < SF.length; index++) {
      const sf = SF[index];
      const nextFrameStart = frameStart + sf * FRAMES_PER_UNIT_POINT;
      if (localFrame <= nextFrameStart) {
        currentDataIndex = index;
        currentSF = sf;
        break;
      }
      frameStart = nextFrameStart;
    }

    const progress =
      (localFrame - frameStart) / (currentSF * FRAMES_PER_UNIT_POINT);

    return {
      currentDataIndex,
      progress,
      showWinnerAnimation: false,
      winnerAnimationStartFrame: 0,
    };
  }, [localFrame, fps, evolution]);

  // This is the original opacity for the FINAL fade-out of the whole component.
  // We leave this logic exactly as it was.
  const opacity = useMemo(() => {
    if (isFadingOut) {
      const fadeStartFrame = winnerAnimationStartFrame + WINNER_ANIMATION_DURATION;
      const framesSinceFadeStart = localFrame - fadeStartFrame;
      return Math.max(0, 1 - (framesSinceFadeStart / FADE_DURATION));
    }
    // The initial fade-in is now handled by chartElementsOpacity
    return 1;
  }, [localFrame, isFadingOut, winnerAnimationStartFrame]);

  // NEW: Opacity specifically for the chart SVG and related UI elements.
  // This will fade out when the winner animation begins.
  const chartElementsOpacity = useMemo(() => {
    // Fade in at the very beginning
    if (localFrame < FADE_DURATION) {
      return localFrame / FADE_DURATION;
    }
    // If the winner animation is showing, fade out the chart elements
    if (showWinnerAnimation) {
      const framesIntoAnimation = localFrame - winnerAnimationStartFrame;
      return Math.max(0, 1 - (framesIntoAnimation / FADE_DURATION));
    }
    // Otherwise, the chart is fully visible
    return 1;
  }, [localFrame, showWinnerAnimation, winnerAnimationStartFrame]);

  useEffect(() => {
    if (winnerAnimationComplete && !isFadingOut) {
      setIsFadingOut(true);
    }
  }, [winnerAnimationComplete, isFadingOut]);

  useEffect(() => {
    if (isFadingOut && opacity <= 0 && onReadyToUnmount) {
      onReadyToUnmount();
    }
  }, [isFadingOut, opacity, onReadyToUnmount]);

  const flattenedData = useMemo(() => {
    return evolution.data.map(({ data, ...rest }) => ({
      ...rest,
      data: data.slice(0, 15),
    }));
  }, [evolution]);

  const currentData = flattenedData[currentDataIndex];
  const prevData = flattenedData[Math.max(0, currentDataIndex - 1)].data;
  const matchDays = useMemo(
    () => evolution.data.map((frame) => frame.date.replace('MD', '')),
    [evolution]
  );

  const { winner, finalTallies } = useMemo(() => {
    if (!showWinnerAnimation) return { winner: null, finalTallies: {} };
    const finalFrame = evolution.data[evolution.data.length - 1];
    const tallies: { [teamName: string]: number } = {};
    teams.forEach((team) => {
      tallies[team.name] = finalFrame.data
        .filter((d: any) => d.team === team.name)
        .reduce((sum: any, d: any) => sum + d.value, 0);
    });
    const winnerTeam = teams.reduce((prev, current) =>
      tallies[current.name] > tallies[prev.name] ? current : prev
    );
    return { winner: winnerTeam, finalTallies: tallies };
  }, [showWinnerAnimation, evolution, teams]);

  const handleWinnerAnimationComplete = () => {
    if (winner) {
      onWinnerDeclared(winner);
    }
    setWinnerAnimationComplete(true);
  };

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    const w = width * 0.92, h = height * 0.9;
    const margins = { mt: 160, mr: 120, mb: 100, ml: 200 };
    const dims = Object.freeze({ w, h, ...margins });
    const finalEvData = evolution.data[evolution.data.length - 1]
    const fixedMax = finalEvData.data[0].value
    const modifier = (chart: Chart): Chart => {
      const safeChart = chart as SafeChart;
      safeChart
        .bar({ gap: 24, minLength: 100 })
        .barCount({ dir: 1, active: 6, max: 6 })
        .label({ fill: '#eee', rightOffset: 130, size: 26 })
        .position({ fill: '#fff', size: 24, xOffset: -180 })
        .points({ size: 26, xOffset: 60, fill: '#fff' })
        .logoXOffset(-50)
        .xAxis({ size: 0, offset: -20, format: evolution.formatX, reverseFormat: reverseFormatX, fixedMax: evolution.fixed === false ? undefined : fixedMax })
        .dom({ svg: `#${PLOT_ID}`, container: `#${CONT_ID}` });
      return safeChart as Chart;
    };
    const defaultName = (name: string) => name.split(' ').pop() || name;
    const barChartRaw = BarChartGenerator<Datum>(dims).accessors({
      x: (d) => d.value,
      y: (d) => (nameMap as any)[d.name] || defaultName(d.name),
      id: (d) => sanitizeName(d.name),
      color: () => 'goldenrod',
      name: (d) => (nameMap as any)[d.name] || defaultName(d.name),
      logoSrc: (d) => {
        const sanitizedName = (nameMap as any)[d.name] || defaultName(d.name);
        return staticFile(`race-images/${sanitizedName.toLowerCase()}.png`);
      },
    });
    chartRef.current = modifier(barChartRaw);
  }, [evolution, width, height]);

  useLayoutEffect(() => {
    if (!chartRef.current || !currentData) return;
    const chart = chartRef.current;
    const { data } = currentData;
    const easingFn = easingFns[currentData.easing || 'linear'] || easingFns.linear;
    chart(prevData, data, easingFn(progress));
  }, [localFrame, currentData, prevData, progress]);

  return (
    <AbsoluteFill
      id={CONT_ID}
      ref={containerRef}
      style={{ opacity }} // This opacity handles the FINAL fade-out
    >
      {/* This new wrapper controls the opacity of chart elements only */}
      <AbsoluteFill style={{ opacity: chartElementsOpacity }}>
        <MetricTitle metric={evolution.metric} />
        <svg
          width={width}
          height={height}
          id={PLOT_ID}
          ref={svgRef}
          style={{
            backgroundColor: 'transparent',
            zIndex: 2,
          }}
        />
        <EffectsManager
          svgRef={svgRef}
          frame={frame}
          progress={progress}
          data={currentData}
          prevData={prevData}
          allData={flattenedData}
          currentDataIndex={currentDataIndex}
        />
        <DisplayVariant1>
          {matchDays[currentDataIndex]}
        </DisplayVariant1>
      </AbsoluteFill>
      <EvolutionAudioOrchestrator evolutions={dataEvolutions} />
      {/* The WinnerAnimation is outside the wrapper, so it's not affected by chartElementsOpacity */}
      {showWinnerAnimation && winner && (
        <WinnerAnimation
          winner={winner}
          teams={teams}
          finalTallies={finalTallies}
          onComplete={handleWinnerAnimationComplete}
          frame={localFrame}
          startFrame={winnerAnimationStartFrame}
        />
      )}
    </AbsoluteFill>
  );
};

export default ChartEvolution;