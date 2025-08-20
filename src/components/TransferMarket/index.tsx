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
import dat from "./assets/data.json";
import speechBubbleData from "./assets/speechBubbleData.json"
import React from 'react';
import { easingFns } from '../../../lib/d3/utils/math';
import EffectsManager from './EffectsManager';
import colorsMap from "./assets/colorsMap.json";
import DisplayVariant2 from './displays/Variant2';
import Title from './displays/Title';
import InfoTitle1 from './displays/InfoTitle1';
import { SpeechBubbleOverlay } from './components/SpeechBubble';
import Cover from './components/Cover';
import { DomSpeechBubble } from './components/DomSpeechBubble';
import { RaysBackground } from './components/oneoffs/GoalsRace/Backgrounds/RaysBg';
import subscribeLottie from "./EffectsManager/effects/Lottie/anims/subscribe.json"
import dribblingLottie from "./EffectsManager/effects/Lottie/anims/dribbling.json"
import { GoldenBootRace } from './components/oneoffs/GoalsRace/GoldenBoot';
import { StandaloneLottie } from './components/StandaloneLottie';
import { OdometerTimeline } from './displays/OdometerYear';
import { GoalsRace } from './components/oneoffs/GoalsRace';
import { MultiGoals } from './components/oneoffs/GoalsRace/MultiGoals';
import MultiSoccerSize from './displays/MultiSoccerSize';
const PLOT_ID = "PLOTX";
const CONT_ID = "CONTAINERX";
// const DURATION = 400;
const DURATION = 3200;
const SCALE_EXP = 2;
const CHART_CONFIG = {
  widthRatio: 1.2,
  heightRatio: 1,
  margins: { mt: 400, mr: 0, mb: 200, ml: 350 }
};
// const data = dat.filter(x => {
//   // return x.date.endsWith("06")
//   const isEven = Number(x.date.split("-").pop()) % 3 === 0
//   return isEven
// })
dat.forEach(x => {
  x.data.forEach(x => x.value = Math.round(x.value))
})
const data = dat.filter( x => x.date < 1978 || x.date > 1994)
const SF = data.map(d => {
  const val = parseFloat((d as any).slowDown);
  return isNaN(val) || val <= 0 ? 1 : val;
});
export const TRANSFER_LIFESPAN = Math.ceil(SF.reduce((s, x) => s + x, 0) * DURATION / 1000);
// export const TransferMarket = () => <MultiSoccerSize data={data} players={[
//   {
//     name: 'Messi',
//     position: { x: 220, z: 140 },
//     baseScale: 55,
//     trophyStartX: -100, // Starts from the right side
//     spriteFrames: Array(39).fill(30).map((_, i) => staticFile(`images/messi_miami.png`)),
//     breathingPhaseShift: Math.PI / 4
//   },
//   {
//     name: 'Ronaldo',
//     position: { x: 900, z: 140 },
//     baseScale: 55,
//     trophyStartX: 1200, // Starts from the right side
//     spriteFrames: Array(39).fill(30).map((_, i) => staticFile(`images/ronaldo_al_nasar.png`))
//   }
// ]} />;
// export const TransferMarket = () => <AbsoluteFill>
//   <GoldenBootRace data={data}/>
//   <StandaloneLottie />
//   <StandaloneLottie left={360} width={800} top={720} loop={false} durationInSeconds={3} animationData={subscribeLottie} startFrame={1967}/>
// </AbsoluteFill>
export const TransferMarket = () => <AbsoluteFill>
  <GoalsRace data={data}/>
  <StandaloneLottie animationData={subscribeLottie} startFrame={2854} loop={false} durationInSeconds={1.1} top={530} left={250} width={700}/>
</AbsoluteFill>
// export const TransferMarket: React.FC = () => {
//   const { fps, width, height } = useVideoConfig();
//   const svgRef = useRef<SVGSVGElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const chartRef = useRef<RemotionBarChart<Datum> | null>(null);

//   const lockedMaxRef = useRef<number | null>(null);

//   const frame = useCurrentFrame();

//   const chartDimensions = useMemo(() => {
//     // ... (this logic is unchanged)
//     const w = width * CHART_CONFIG.widthRatio;
//     const h = height * CHART_CONFIG.heightRatio;
//     const { margins } = CHART_CONFIG;
//     return { w, h, margins, plotWidth: w - margins.ml - margins.mr, plotHeight: h - margins.mt - margins.mb, xRange: [margins.ml, w - margins.mr] as [number, number] };
//   }, [width, height]);

//   const flattenedData = useMemo(() => (data as Frame[]).map(d => ({ ...d, data: d.data.slice(0, 15) })), []);

//   // --- Change 2: Pre-calculate all keyframes with their starting frame numbers ---
//   // This is the new `allKeyframes` array that the deterministic RaceScene requires.
//   const allKeyframes = useMemo(() => {
//     const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
//     let frameStart = 0;

//     const keyframes = flattenedData.map((d, index) => {
//       // Create a new object that includes the original data plus the calculated frame number
//       const keyframe = { ...d, frame: Math.floor(frameStart) };
//       // Calculate the duration of this segment to find the start of the next one
//       const segmentDuration = SF[index] * FRAMES_PER_UNIT_POINT;
//       frameStart += segmentDuration;
//       return keyframe;
//     });

//     return keyframes;
//   }, [flattenedData, fps]);



//   const { currentDataIndex, progress } = useMemo(() => {
//     // ... (this logic is unchanged, it correctly finds the current segment index)
//     if (!data.length || !fps) return { currentDataIndex: 0, progress: 0 };
//     const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
//     const calculationFrame = frame + FRAMES_PER_UNIT_POINT;
//     let frameStart = 0;
//     for (let index = 0; index < SF.length; index++) {
//       const segmentDurationInFrames = SF[index] * FRAMES_PER_UNIT_POINT;
//       const nextFrameStart = frameStart + segmentDurationInFrames;
//       if (calculationFrame <= nextFrameStart) {
//         const framesIntoSegment = calculationFrame - frameStart;
//         const calculatedProgress = segmentDurationInFrames > 0 ? framesIntoSegment / segmentDurationInFrames : 1;
//         return { currentDataIndex: index, progress: Math.max(0, Math.min(1, calculatedProgress)) };
//       }
//       frameStart = nextFrameStart;
//     }
//     return { currentDataIndex: data.length - 1, progress: 1 };
//   }, [frame, fps]);

//   // --- Change 3: Use the new `allKeyframes` array to get current and previous data ---
//   // This ensures they are the augmented objects containing the `.frame` property.
//   const currentData = allKeyframes[currentDataIndex];
//   const prevData = allKeyframes[Math.max(0, currentDataIndex - 1)];

//   const matchDays = useMemo(() => data.map(d => d.date), []);

//   const { prevScale, newScale } = useMemo(() => {
//     // ... (this logic is unchanged)
//     const { xRange } = chartDimensions;
//     const lockThreshold = 10e6;
//     const minDomainMax = 20;

//     const getDomainMax = (dataSlice: Datum[]): number => {
//       const rawMax = max(dataSlice, d => d.value) || 0;
//       const potentialMax = Math.max(rawMax, lockedMaxRef.current || 0);
//       if (potentialMax >= lockThreshold) {
//         return potentialMax;
//       }
//       const approachProgress = rawMax / lockThreshold;
//       const transitionalMax = rawMax * (1 - approachProgress) + lockThreshold * approachProgress;
//       return Math.max(transitionalMax, minDomainMax);
//     };

//     const createScale = (domainMax: number): ScalePower<number, number> => {
//       return scalePow<number, number>().exponent(SCALE_EXP).domain([0, domainMax]).range(xRange);
//     };

//     const prevDomainMax = getDomainMax(prevData.data);
//     const newDomainMax = getDomainMax(currentData.data);
//     if (newDomainMax >= lockThreshold) {
//       lockedMaxRef.current = newDomainMax;
//     }
//     return { prevScale: createScale(prevDomainMax), newScale: createScale(newDomainMax) };
//   }, [prevData, currentData, chartDimensions]);

//   // useEffect to create the generator instance (runs once)
//   useEffect(() => {
//     // ... (this logic is unchanged)
//     if (chartRef.current || !containerRef.current || !svgRef.current) return;
//     const { w, h, margins } = chartDimensions;
//     const dims = Object.freeze({ w, h, ...margins });
//     const defaultName = (name: string) => name.split(" ").pop() || name;

//     chartRef.current = BarChartGenerator<Datum>(dims)
//       .accessors({
//         x: d => d.value,
//         y: d => (nameMap as any)[d.name] || d.name,
//         id: d => sanitizeName(d.name),
//         color: d => colorsMap[d.name] ?? "gold",
//         name: d => (nameMap as any)[d.name] || d.name,
//         logoSrc: d => {
//           // const slug = (nameMap[d.name] || d.name).split(" ").reverse()[0]
//           // return staticFile(`race-images/${slug}.png`)
//           const src = logosMap[d.name] ?? "";
//           return src && (!src.startsWith("http") && !src.startsWith("data:")) ? staticFile(src) : src;
//         },
//         secLogoSrc: d => {
//           return logosMap[d.club] || ""
//         }
//       })
//       .showSecLogo(true)
//       .bar({ gap: 14, minLength: 100 })
//       .barCount({ dir: 1, active: 12, max: 12 })
//       .label({ fill: "#ffffff", rightOffset: 290, size: 48 })
//       .position({ fill: "#ffffff", size: 0, xOffset: -200 })
//       .points({ size: 48, xOffset: 170, fill: "#ffffff" })
//       .logoXOffset(20)
//       .secLogoXOffset(160)
//       .xAxis({ size: 0, offset: -20, format: formatX, lockThreshold: 100_000_000, reverseFormat: reverseFormatX })
//       .dom({ svg: `#${PLOT_ID}`, container: `#${CONT_ID}` });
//   }, [chartDimensions]);

//   // useLayoutEffect to draw the chart
//   useLayoutEffect(() => {
//     // ... (this logic is unchanged)
//     if (!chartRef.current || !currentData || !prevData || !prevScale || !newScale) return;
//     const chart = chartRef.current;
//     const easingFn = easingFns[currentData.easing] || easingFns.linear;

//     chart({
//       prevData: prevData.data,
//       newData: currentData.data,
//       prevScale: prevScale,
//       newScale: newScale,
//       progress: easingFn(progress),
//     });
//   }, [frame, currentData, prevData, prevScale, newScale, progress]);
//   console.log((currentDataIndex % 52) + 1);
//   return (
//     <AbsoluteFill
//       id={CONT_ID}
//       ref={containerRef}
//       // style={{
//       //   backgroundImage: `radial-gradient(ellipse at center, rgba(76, 35, 122, 0.6), transparent 70%),
//       //     radial-gradient(circle at center, rgba(90, 45, 150, 0.5), transparent 50%),
//       //     linear-gradient(to right, #2a0b4d, #1e1b3a)`
//       // }}
//         style={{
//           background: `
//     radial-gradient(circle at 95% 40%, rgba(44, 83, 100, 1) 0%, rgba(15, 32, 39, 1) 50%, rgba(10, 20, 30, 1) 100%),
//     linear-gradient(to bottom left, #0f2027 0%, #203a43 50%, #2c5364 100%)
//     `, // <-- The semicolon was removed from the end of the line above
//           display: 'flex'
//         }}
//     >
//       <svg width={width} height={height} id={PLOT_ID} ref={svgRef} style={{ backgroundColor: 'transparent', zIndex: 2 }}></svg>
//       {/* --- Change 4: Update props passed to RaceScene for determinism --- */}
//       {/* <SpeechBubbleOverlay bubbles={speechBubbleData}/> */}
//       <DomSpeechBubble bubbles={speechBubbleData} />
//       {/* <Title /> */}
//       {/* <RaceScene
//       allKeyframes={allKeyframes}
//       currentData={currentData}
//       prevData={prevData}
//       progress={progress}
//       /> */}
//       {/* <Cover /> */}
//       <EffectsManager svgRef={svgRef} frame={frame} progress={progress} data={currentData} prevData={prevData.data} allData={flattenedData} currentDataIndex={currentDataIndex} />
//       {/* <div style={{
//         bottom: "15%",
//         "right": "3%",
//         "background": "skyblue",
//         "border": "8px solid #222",
//         fontWeight: "bold",
//         color: "#222",
//         padding: "24px 36px",
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         paddingBottom: 0,
//         position: "absolute",
//         display: "flex",
//         flexDirection: "column",

//       }}>
//         <span style={{
//           fontSize: 32
//         }}>
//           WEEK
//         </span>
//         <span style={{
//          fontSize: 80,
//         }}>
//           {String(matchDays[currentDataIndex]).padStart(2, '0')}
//         </span>
//       </div> */}
//       {/* <DisplayVariant2>
//         {String(matchDays[currentDataIndex]).padStart(2, '0')}
//       </DisplayVariant2> */}
//       <OdometerTimeline data={data} baseDurationPerItemInMs={DURATION}/>
//       <div style={{
//         fontSize: 72,
//         fontFamily: "Bebas Nue",
//         color: "#fff",
//         position: "absolute",
//         top: "13%",
//         left: "4%",
//         zIndex: 100
//       }}>
//         TOTAL <span style={{ color: "gold", marginLeft: 8 }}>GOALS</span> SINCE 2018
//       </div>
//       {/* <RaysBackground rayBlur={0} loopDurationInFrames={5000} rayColor='rgba(15, 114, 206, 0.58)' rayCount={4} rayWidth={29}/> */}
//       {/* <StandaloneLottie persist={true} loop={false} left={580} durationInSeconds={3} /> */}
//     </AbsoluteFill >
//   );
// };