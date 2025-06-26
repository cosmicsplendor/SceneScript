import { useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { scalePow, max, ScalePower } from 'd3'; 
import {RaceScene} from "./components/Race"
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';
import { Chart, Datum, Frame, sanitizeName, formatX, reverseFormatX } from "./helpers"
import { BarChartGenerator, RemotionBarChart } from '../../../lib/d3/generators/BarChart';
import nameMap from "./assets/nameMap.json"
import logosMap from "./assets/logosMap.json"
import data from "./assets/data.json"
import React from 'react';
import { easingFns } from '../../../lib/d3/utils/math';
import EffectsManager from './EffectsManager';
import colorsMap from "./assets/colorsMap.json"
import DisplayVariant2 from './displays/Variant2';

const PLOT_ID = "PLOTX";
const CONT_ID = "CONTAINERX";
const DURATION = 400;
const SCALE_EXP = 2; 

// Robust calculation for video duration at the top level
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

  const { currentDataIndex, progress } = useMemo(() => {
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

  const flattenedData = useMemo(() => (data as Frame[]).map(d => ({ ...d, data: d.data.slice(0, 15) })), []);
  const currentData = flattenedData[currentDataIndex];
  const prevData = flattenedData[Math.max(0, currentDataIndex - 1)];
  const matchDays = useMemo(() => data.map(d => d.date.replace("MD", "")), []);
  
  // ========================================================================
  // <<< FINAL, MINIMAL CHANGE LOGIC
  // ========================================================================
  const { prevScale, newScale } = useMemo(() => {
    const w = width * 0.6;
    const margins = { mt: 350, mr: 300, mb: 100, ml: 40 };
    const range: [number, number] = [margins.ml, w - margins.mr];
    
    const lockThreshold = 10e6;
    const minDomainMax = 20;

    // This function combines the working post-lock logic with the new pre-lock logic.
    const getDomainMax = (dataSlice: Datum[]): number => {
      const rawMax = max(dataSlice, d => d.value) || 0;
      
      // Check if we are ALREADY locked OR if the current rawMax should trigger the lock.
      const potentialMax = Math.max(rawMax, lockedMaxRef.current || 0);
      
      if (potentialMax >= lockThreshold) {
        // --- PHASE 2 (POST-LOCK): This is your original, working logic ---
        // The domain max is simply the highest value seen so far. No flicker.
        return potentialMax;
      }

      // --- PHASE 1 (PRE-LOCK): If we are here, the axis is not locked. ---
      // This is the new interpolation logic for the "zoom out" effect.
      const approachProgress = rawMax / lockThreshold;
      const transitionalMax = rawMax * (1 - approachProgress) + lockThreshold * approachProgress;
      return Math.max(transitionalMax, minDomainMax);
    };

    const createScale = (domainMax: number): ScalePower<number, number> => {
      return scalePow<number, number>()
        .exponent(SCALE_EXP)
        .domain([0, domainMax])
        .range(range);
    };

    const prevDomainMax = getDomainMax(prevData.data);
    const newDomainMax = getDomainMax(currentData.data);

    // --- Update the lock state. This is your original, working logic ---
    if (newDomainMax >= lockThreshold) {
      lockedMaxRef.current = newDomainMax;
    }

    return {
      prevScale: createScale(prevDomainMax),
      newScale: createScale(newDomainMax)
    };
  }, [prevData, currentData, width]);
  // ========================================================================
  // <<< END OF LOGIC
  // ========================================================================

  // useEffect to create the generator instance (runs once)
  useEffect(() => {
    if (chartRef.current || !containerRef.current || !svgRef.current) return;

    const w = width * 0.8, h = height * 0.8;
    const margins = { mt: 450, mr: 300, mb: 0, ml: 40 };
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
      .label({ fill: "#fff", rightOffset: 150, size: 0 })
      .position({ fill: "#fff", size: 20, xOffset: -190 })
      .points({ size: 26, xOffset: 100, fill: "#fff" })
      .logoXOffset(20)
      .xAxis({ size: 20, offset: -20, format: formatX, lockThreshold: 10e6, reverseFormat: reverseFormatX })
      .dom({ svg: `#${PLOT_ID}`, container: `#${CONT_ID}` });

  }, [width, height]);

  // useLayoutEffect to call the drawing function on every frame
  useLayoutEffect(() => {
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

  // Your original JSX remains unchanged
  return (
    <AbsoluteFill id={CONT_ID} ref={containerRef} style={{ background: "white", display: 'flex' }}>
      <svg width={width} height={height} id={PLOT_ID} ref={svgRef} style={{ backgroundColor: 'transparent', zIndex: 2 }}></svg>
      <RaceScene passive={true}/>
      <EffectsManager svgRef={svgRef} frame={frame} progress={progress} data={currentData} prevData={prevData.data} allData={flattenedData} currentDataIndex={currentDataIndex} />
      <DisplayVariant2>{matchDays[currentDataIndex]}</DisplayVariant2>
    </AbsoluteFill>
  );
};