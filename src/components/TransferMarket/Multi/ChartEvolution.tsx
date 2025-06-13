
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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

const PLOT_ID = 'PLOTX';
const CONT_ID = 'CONTAINERX';
const DURATION = 1000;

type ChartEvolutionProps = {
  evolution: DataEvolution;
  startFrame: number;
  teams: Team[];
  onWinnerDeclared: (winner: Team) => void;
};

const ChartEvolution: React.FC<ChartEvolutionProps> = ({
  evolution,
  startFrame,
  teams,
  onWinnerDeclared,
}) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame; // Frame relative to the start of this evolution

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  // Memoize calculations specific to this evolution
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

  // This useEffect now runs for EACH new evolution, creating a fresh chart.
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const w = width * 0.92,
      h = height * 0.9;
    const margins = { mt: 180, mr: 120, mb: 100, ml: 200 };
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
        .xAxis({
          size: 0,
          offset: -20,
          format: evolution.formatX,
          reverseFormat: reverseFormatX,
          fixedMax 
        })
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
    console.log(`Chart initialized for evolution: ${evolution.metric}`);

    // This effect has no cleanup, which is fine since we are unmounting the whole component.
  }, [evolution, width, height]); // Dependency on `evolution` is key!

  // Updates the chart on every frame
  useLayoutEffect(() => {
    if (!chartRef.current || !currentData) return;
    const chart = chartRef.current;
    const { data } = currentData;
    const easingFn = easingFns[currentData.easing || 'linear'] || easingFns.linear;
    chart(prevData, data, easingFn(progress));
  }, [localFrame, currentData, prevData, progress]);

  return (
    <AbsoluteFill id={CONT_ID} ref={containerRef}>
      <MetricTitle
        metric={evolution.metric}
        opacity={showWinnerAnimation ? 0.3 : 1}
      />
      <svg
        width={width}
        height={height}
        id={PLOT_ID}
        ref={svgRef}
        style={{
          backgroundColor: 'transparent',
          zIndex: 2,
          opacity: showWinnerAnimation ? 0.3 : 1,
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
      {showWinnerAnimation && winner && (
        <WinnerAnimation
          winner={winner}
          teams={teams}
          finalTallies={finalTallies}
          onComplete={() => onWinnerDeclared(winner)}
          frame={localFrame} // Use local frame for animation timing
          startFrame={winnerAnimationStartFrame}
        />
      )}
    </AbsoluteFill>
  );
};

export default ChartEvolution;