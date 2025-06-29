import { useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { scalePow, max, ScalePower } from 'd3'; 
// --- Change 1: Import the new deterministic RaceScene ---
import { RaceScene } from "./components/Race/persistent";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';
import { Chart, Datum, Frame, sanitizeName, formatX, reverseFormatX } from "./helpers";
import { BarChartGenerator, RemotionBarChart } from '../../../lib/d3/generators/BarChart';
import nameMap from "./assets/nameMap.json";
import logosMap from "./assets/logosMap.json";
import data from "./assets/data.json";
import React from 'react';
import { easingFns } from '../../../lib/d3/utils/math';
import EffectsManager from './EffectsManager';
import colorsMap from "./assets/colorsMap.json";
import DisplayVariant2 from './displays/Variant2';
import Title from './displays/Title';
import InfoTitle1 from './displays/InfoTitle1';
const PLOT_ID = "PLOTX";
const CONT_ID = "CONTAINERX";
// const DURATION = 400;
const DURATION = 400;
const SCALE_EXP = 2; 

const CHART_CONFIG = {
  widthRatio: 0.6,
  heightRatio: 0.8,
  margins: { mt: 320, mr: 300, mb: 0, ml: 150 }
};

const SF = data.map(d => {
  const val = parseFloat((d as any).slowDown);
  return isNaN(val) || val <= 0 ? 1 : val;
});
export const TRANSFER_LIFESPAN = Math.ceil(SF.reduce((s, x) => s + x, 0) * DURATION / 1000);

export const TransferMarket: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<RemotionBarChart<Datum> | null>(null);
  
  const lockedMaxRef = useRef<number | null>(null);
  
  const frame = useCurrentFrame();

  const chartDimensions = useMemo(() => {
    // ... (this logic is unchanged)
    const w = width * CHART_CONFIG.widthRatio;
    const h = height * CHART_CONFIG.heightRatio;
    const { margins } = CHART_CONFIG;
    return { w, h, margins, plotWidth: w - margins.ml - margins.mr, plotHeight: h - margins.mt - margins.mb, xRange: [margins.ml, w - margins.mr] as [number, number] };
  }, [width, height]);
  
  const flattenedData = useMemo(() => (data as Frame[]).map(d => ({ ...d, data: d.data.slice(0, 15) })), []);
  
  // --- Change 2: Pre-calculate all keyframes with their starting frame numbers ---
  // This is the new `allKeyframes` array that the deterministic RaceScene requires.
  const allKeyframes = useMemo(() => {
    const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
    let frameStart = 0;

    const keyframes = flattenedData.map((d, index) => {
      // Create a new object that includes the original data plus the calculated frame number
      const keyframe = { ...d, frame: Math.floor(frameStart) };
      // Calculate the duration of this segment to find the start of the next one
      const segmentDuration = SF[index] * FRAMES_PER_UNIT_POINT;
      frameStart += segmentDuration;
      return keyframe;
    });
    
    return keyframes;
  }, [flattenedData, fps]);


  const { currentDataIndex, progress } = useMemo(() => {
    // ... (this logic is unchanged, it correctly finds the current segment index)
    if (!data.length || !fps) return { currentDataIndex: 0, progress: 0 };
    const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
    const calculationFrame = frame + FRAMES_PER_UNIT_POINT;
    let frameStart = 0;
    for (let index = 0; index < SF.length; index++) {
      const segmentDurationInFrames = SF[index] * FRAMES_PER_UNIT_POINT;
      const nextFrameStart = frameStart + segmentDurationInFrames;
      if (calculationFrame <= nextFrameStart) {
        const framesIntoSegment = calculationFrame - frameStart;
        const calculatedProgress = segmentDurationInFrames > 0 ? framesIntoSegment / segmentDurationInFrames : 1;
        return { currentDataIndex: index, progress: Math.max(0, Math.min(1, calculatedProgress)) };
      }
      frameStart = nextFrameStart;
    }
    return { currentDataIndex: data.length - 1, progress: 1 };
  }, [frame, fps]);

  // --- Change 3: Use the new `allKeyframes` array to get current and previous data ---
  // This ensures they are the augmented objects containing the `.frame` property.
  const currentData = allKeyframes[currentDataIndex];
  const prevData = allKeyframes[Math.max(0, currentDataIndex - 1)];
  
  const matchDays = useMemo(() => data.map(d => d.date.replace("MD", "")), []);
  
  const { prevScale, newScale } = useMemo(() => {
    // ... (this logic is unchanged)
    const { xRange } = chartDimensions;
    const lockThreshold = 10e6;
    const minDomainMax = 20;

    const getDomainMax = (dataSlice: Datum[]): number => {
      const rawMax = max(dataSlice, d => d.value) || 0;
      const potentialMax = Math.max(rawMax, lockedMaxRef.current || 0);
      if (potentialMax >= lockThreshold) {
        return potentialMax;
      }
      const approachProgress = rawMax / lockThreshold;
      const transitionalMax = rawMax * (1 - approachProgress) + lockThreshold * approachProgress;
      return Math.max(transitionalMax, minDomainMax);
    };

    const createScale = (domainMax: number): ScalePower<number, number> => {
      return scalePow<number, number>().exponent(SCALE_EXP).domain([0, domainMax]).range(xRange);
    };

    const prevDomainMax = getDomainMax(prevData.data);
    const newDomainMax = getDomainMax(currentData.data);
    if (newDomainMax >= lockThreshold) {
      lockedMaxRef.current = newDomainMax;
    }
    return { prevScale: createScale(prevDomainMax), newScale: createScale(newDomainMax) };
  }, [prevData, currentData, chartDimensions]);

  // useEffect to create the generator instance (runs once)
  useEffect(() => {
    // ... (this logic is unchanged)
    if (chartRef.current || !containerRef.current || !svgRef.current) return;
    const { w, h, margins } = chartDimensions;
    const dims = Object.freeze({ w, h, ...margins });
    const defaultName = (name: string) => name.split(" ").pop() || name;
    
    chartRef.current = BarChartGenerator<Datum>(dims)
      .accessors({
        x: d => d.value,
        y: d => (nameMap as any)[d.name] || defaultName(d.name),
        id: d => sanitizeName(d.name),
        color: d => colorsMap[d.name] ?? "goldenrod",
        name: d => (nameMap as any)[d.name] || defaultName(d.name),
        logoSrc: d => {
          const src = logosMap[d.name] ?? "";
          return src && !src.startsWith("http") ? staticFile(src) : src;
        }
      })
      .bar({ gap: 24, minLength: 100 })
      .barCount({ dir: 1, active: 6, max: 10 })
      .label({ fill: "#fff", rightOffset: 130, size: 24 })
      .position({ fill: "#fff", size: 20, xOffset: -190 })
      .points({ size: 26, xOffset: 100, fill: "#fff" })
      .logoXOffset(20)
      .xAxis({ size: 20, offset: -20, format: formatX, lockThreshold: 10e6, reverseFormat: reverseFormatX })
      .dom({ svg: `#${PLOT_ID}`, container: `#${CONT_ID}` });
  }, [chartDimensions]);
  
  // useLayoutEffect to draw the chart
  useLayoutEffect(() => {
    // ... (this logic is unchanged)
    if (!chartRef.current || !currentData || !prevData || !prevScale || !newScale) return;
    const chart = chartRef.current;
    const easingFn = easingFns[currentData.easing || "linear"] || easingFns.linear;
    
    chart({
      prevData: prevData.data,
      newData: currentData.data,
      prevScale: prevScale,
      newScale: newScale,
      progress: easingFn(progress),
    });
  }, [frame, currentData, prevData, prevScale, newScale, progress]);
  console.log((currentDataIndex % 24) + 1);
  return (
    <AbsoluteFill id={CONT_ID} ref={containerRef} style={{ background: "white", display: 'flex' }}>
      <svg width={width} height={height} id={PLOT_ID} ref={svgRef} style={{ backgroundColor: 'transparent', zIndex: 2 }}></svg>
      {/* --- Change 4: Update props passed to RaceScene for determinism --- */}
      <Title />
      <InfoTitle1 startFrame={17500} duration={210}/>
      <RaceScene 
        allKeyframes={allKeyframes}
        currentData={currentData} 
        prevData={prevData} 
        progress={progress}
      />
      <EffectsManager svgRef={svgRef} frame={frame} progress={progress} data={currentData} prevData={prevData.data} allData={flattenedData} currentDataIndex={currentDataIndex} />
      <DisplayVariant2>{matchDays[currentDataIndex]}</DisplayVariant2>
    </AbsoluteFill>
  );
};