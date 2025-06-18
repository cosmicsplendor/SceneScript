import { useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {RaceScene} from "./components/Race"
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
  Sequence,
} from 'remotion';
import { Chart, Datum, SafeChart, Frame, SeasonOdometer, quarters, sanitizeName } from "./helpers"
import { formatX, reverseFormatX } from "./helpers"
import { BarChartGenerator } from '../../../lib/d3/generators/BarChart';
import nameMap from "./assets/nameMap.json"
import logosMap from "./assets/logosMap.json"
import data from "./assets/data.json"
import React from 'react'; // Import React for Fragment
import RotatingGear from './Gear';
import OdometerDisplay from './OdometerDisplay';
import Clock from './Clock';
import { easingFns } from '../../../lib/d3/utils/math';
import EffectsManager from './EffectsManager';
import { periodsToExclude, music, offsetts } from './audioSettings';
import colorsMap from "./assets/colorsMap.json"
import DisplayVariant1 from './displays/Variant1';
import Thumbnail from './components/Thumbanil';
import Pin from './components/Pin';

const PLOT_ID = "PLOTX"
const CONT_ID = "CONTAINERX"
const DURATION = 1100; // Equivalent to 1 second at 60fps
const SF = data.map(d => (d.slowDown as number) ?? 1)
export const TRANSFER_LIFESPAN = Math.ceil(SF.reduce((s, x) => x + s) * DURATION / 1000); // Restored original export
const quarters = ["Q1", "Q2", "Q3", "Q4"]
export const TransferMarket: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const FRAMES_PER_UNIT_POINT = useMemo(() => {
    if (!fps || fps <= 0) return 0;
    return (fps * DURATION) / 1000;
  }, [fps]);
  const frame = useCurrentFrame() + FRAMES_PER_UNIT_POINT; // just to give a headstart

  const flattenedData = useMemo(() => {
    const result = [];
    const originalDataTyped = data as Frame[];
    for (const index in originalDataTyped) {
      const { data, ...rest } = originalDataTyped[index];
      result.push({ ...rest, data: data.slice(0, 15) });
    }
    return result;
  }, [data]);
  const { currentDataIndex, progress } = useMemo(() => {
    if (flattenedData.length === 0) return { currentDataIndex: 0, progress: 0 };
    let frameStart = 0, currentDataIndex = 0, currentSF = 1;

    // Find which period we're in by accumulating frames
    for (let index = 0; index < SF.length; index++) {
      const sf = SF[index];
      const nextFrameStart = frameStart + sf * FRAMES_PER_UNIT_POINT;

      // Stay in current period until frame exceeds its duration
      if (frame <= nextFrameStart) {
        currentDataIndex = index;
        currentSF = sf;
        break;
      }
      frameStart = nextFrameStart;
    }

    const progress = (frame - frameStart) / (currentSF * FRAMES_PER_UNIT_POINT);
    return { currentDataIndex, progress };
  }, [frame, FRAMES_PER_UNIT_POINT, flattenedData.length]);
  const periodAudioMetaData = useMemo(() => {
    const metadata = [];
    const originalDataTyped = data as Frame[];
    let lastPeriod: string = "";

    // Calculate frame positions using the same logic as visual timing
    let cumulativeFrames = 0;

    for (let index = 1; index < originalDataTyped.length; index++) {
      const periodEntry = originalDataTyped[index];
      // const year = String(new Date(periodEntry.date).getFullYear());
      // const period = `${year}`;
      const period = periodEntry.date.toLowerCase()

      // Only add metadata when we encounter a new period
      if (lastPeriod !== period) {
        metadata.push({
          period,
          startFrame: cumulativeFrames // Use the cumulative frames at this point
        });
        console.log({
          period,
          startFrame: cumulativeFrames // Use the cumulative frames at this point
        })
        lastPeriod = period;
      }

      // Add frames for this data point using the same SF array as visual timing
      const slowDownFactor = SF[index] || 1;
      cumulativeFrames += slowDownFactor * FRAMES_PER_UNIT_POINT;
    }

    return metadata;
  }, [data, FRAMES_PER_UNIT_POINT, SF]);
  const currentData = flattenedData[currentDataIndex];
  const currentYear = currentData ? Number(currentData.date.split(" ")[1]) : "2000";
  const matchDays = useMemo(() => {
    return data.map(frame => frame.date.replace("MD", ""))
  }, [])
  useEffect(() => {
    if (containerRef.current === null || svgRef.current === null) {
      return;
    }
    const w = width * 0.88, h = height * 0.92;
    const margins = { mt: 60, mr: 200, mb: 50, ml: 250 };
    const dims = Object.freeze({ w, h, ...margins });
    const modifier = (chart: Chart) => {
      const safeChart = chart as SafeChart;
      safeChart
        .bar({ gap: 24, minLength: 100 })
        .barCount({ dir: 1, active: 10, max: 10 })
        .label({ fill: "#fff", rightOffset: 150, size: 28 })
        .position({ fill: "#fff", size: 20, xOffset: -180 })
        .points({ size: 28, xOffset: 120, fill: "#fff" })
        .logoXOffset(20)
        .xAxis({
          size: 20, offset: -20,
          format: formatX,
          reverseFormat: reverseFormatX, 
          // fixedMax: 6750
        })
        .dom({ svg: `#${PLOT_ID}`, container: `#${CONT_ID}` }); // PLOT_ID and CONT_ID used here

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
        // color: d => (colorsMap as any)[sanitizeName(d.name)] ?? "#000",
        // color: d => colorsMap[sanitizeName(d.name)],
        color: d => "goldenrod",
        name: d => (nameMap as any)[d.name] || defaultName(d.name),
        logoSrc: d => {
          return logosMap[d.name] ?? ""
          const sanitizedName = (nameMap as any)[d.name] || defaultName(d.name);
          // return staticFile(`race-images/${sanitizedName.toLowerCase()}.png`);
        }
      });

    const barChart = modifier(barChartRaw);
    chartRef.current = barChart;
  }, [svgRef, containerRef, flattenedData, width, height]);
  const prevData = flattenedData[Math.max(0, currentDataIndex - 1)].data
  useEffect(() => {
    console.log(currentData.date)
  }, [currentData.date]);
  useLayoutEffect(() => {
    if (!chartRef.current || !currentData) {
      return;
    }
    const chart = chartRef.current;
    const { data } = currentData;
    const easingFn = easingFns[currentData.easing || "linear"] || easingFns.linear;
    chart(prevData, data, easingFn(progress));
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: "white"
      }}
      id={CONT_ID} // CONT_ID used here
      ref={containerRef}
    >
      <Clock x={450} y={-248} framesPerCycle={600} frame={frame} />
      {/* <Thumbnail /> */}
      {/* <Pin duration={3.5}/> */}
      <RaceScene progress={progress} prevData={prevData} currentData={currentData}/>
      <svg
        width={width}
        height={height}
        id={PLOT_ID} // PLOT_ID used here
        ref={svgRef}
        style={{ backgroundColor:  'transparent', zIndex: 2 }}
      ></svg>
      {currentData && (currentYear !== null) && ( // Only show if data and a valid season number exist
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          padding: '20px'
        }}>
          <span style={{
            fontSize: '24px',
            marginRight: '10px',
            fontWeight: 'bold',
            color: '#333'
          }}>
          </span>
          {/* <RotatingGear top="10px" right="30px" /> */}
          <SeasonOdometer value={currentYear ?? 0} amplitude={0} top="-20px" right="0px" />
        </div>
      )}
      <EffectsManager svgRef={svgRef} frame={frame} progress={progress} data={currentData} prevData={prevData} allData={flattenedData} currentDataIndex={currentDataIndex} />
      {/* Audio Sequences for Playback (All seasons with valid audio metadata) */}
      {/* {periodAudioMetaData.map(({ period, startFrame }) => {
        const offset = offsetts[period] ?? 0
        const audioSrcPath = `/transferAudio/${period}.wav`;
        if (periodsToExclude.includes(period)) return null
        return (
          <Sequence key={`audio-${period}-playback`} from={startFrame + offset * fps}>
            <Audio src={staticFile(audioSrcPath)} playbackRate={1.5} />
          </Sequence>
        );
      })} */}
      {/* {music.map(({ start, file }, index) => {
        const audioSrcPath = `/transferAudio/${file}`;
        return (
          <Sequence key={`audio-${index}-playback`} from={start}>
            <Audio src={staticFile(audioSrcPath)} volume={0.2} />
          </Sequence>
        );
      })} */}
      {/* <DisplayVariant1>{matchDays[currentDataIndex]}</DisplayVariant1> */}
      {/* <OdometerDisplay currentIndex={currentDataIndex} values={matchDays} width="50px" top="1%" right="1%" /> */}
    </AbsoluteFill>
  );
};