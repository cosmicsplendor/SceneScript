import { useEffect, useRef } from "react"
import { RemotionBarChart } from "../../../lib/d3/generators/BarChart"
import { Hash } from "../../../lib/d3/utils/types"
import TMOdometerModule from 'tm-odometer'
// import "./odometer-themes/slot-machine.css";
import "./odometer-themes/slot-machine.css";

export type StrHash = Hash<string>
export type Datum = {
  name: string
  value: number
  team?: string
}
export type ConfettiEffect = {
  type: "confetti"
  target: string,
  bursts: number,
  duration: number
  dist?: "space-between" | "space-around" | "ease-sine" | "ease-quad" | "ease-cubic"
}
export type SurgeEffect = {
  type: "surge"
  target: string,
  duration: number,
  bursts: number,
  dist?: "space-between" | "space-around" | "ease-sine" | "ease-quad" | "ease-cubic"
}
export type LottieEffect = {
  type: "lottie";
  targetEl?: "bar" | "points" | "logo";
  target: string;
  anim: string;
  duration: number;
  offsetX?: number;
  offsetY?: number;
  height?: number; // New: configurable height, width auto-calculated
}
export type ArrowEffect = {
  type: 'arrow'; // Differentiates from other effects like ConfettiEffect
  target: string; // Key to find the target element (e.g., 'player1')
  color: string;  // Hex string for arrow color (e.g., '#FF0000')
  duration: number; // Total duration of the effect in seconds
}
export type ImageEffect = {
  type: 'image'; // Differentiates from other effects like ConfettiEffect
  src: string;
  height: number;
  target: string; // Key to find the target element (e.g., 'player1')
  duration: number; // Total duration of the effect in seconds
  pulseAmp?: number;
  pulseFreq?: number;
  offsetX?: number;
  offsetY?: number;
  targetEl?: string;
}
export type ChangeEffect = {
  type: "change";
  target: string;
  duration: number;
  color?: string; // Optional base color, will be overridden by green/red
  initialDataOffset?: number; // Optional initial offset for the data
}
export type FocusEffect = {
  type: "focus";
  target: string;
  duration: number;
}
export interface LoadingEffect {
    type: "loading";
    target: string;
    duration: number;
    reverse?: boolean; 
}
export interface FloatEffect {
    type: "float";
    target: string;
    duration: number; // The *total* duration of the effect.
    bursts: number; // The number of text instances to float.
    text?: string | string[];
    dist?: "random" | "serial",
    drift?: number;
    fillColor?: string;
    strokeColor?: string;
    font?: string;
    dir?: "up" | "down" | "right";
    range?: number;
    fontSize?: number;
    offsetX?: number;
    offsetY?: number;
}
export type QuickCutEffect = {
  "type": "quickcut",
  "target": string,
  "duration": number,
  "images": string[],
  "dir": "vertical" | "horizontal",
  xOffset?: number,
  yOffset?: number,
  width: number;
  height: number;
}
export interface TweetEffect {
  type: "tweet";
  target: string;
  duration: number;
  image: string; // Single image path instead of array
  scale?: number; // Optional scale property, defaults to 1
  dir?: "vertical" | "horizontal";
  xOffset?: number;
  yOffset?: number;
}
export type ShowerEffect = {
  "type": "shower",
  "target": string,
  "duration": number,
  colors: string[]
}
export type Effect = (ConfettiEffect | SurgeEffect | ArrowEffect | ChangeEffect | FocusEffect | LottieEffect | LoadingEffect | QuickCutEffect | TweetEffect | ImageEffect | ShowerEffect | FloatEffect) & { delay?: number }
export type Frame = {
  subject?: string,
  date: string,
  easing?: string,
  slowDown?: number,
  data: Datum[],
  effects?: Effect[],
  audio?: {volume?: number, src: string, delay?: number}[]
}
export type Chart = RemotionBarChart<Datum>
export type SafeChart = {
  [K in keyof Required<Chart>]: Exclude<Required<Chart>[K], undefined> extends (...args: any[]) => any
  ? (...args: Parameters<Required<Chart>[K]>) => SafeChart
  : never
}
export const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase()

export const formatX = (num: number | string) => {
  const n = Math.round(Number(num))
  return `${n}`
}


export const reverseFormatX = (str: string) => {
  return Number(str.replace(/⚽/g, "").trim()) // ⚽
}

export const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]
export const quarters = ["Q1", "Q2", "Q3", "Q4"]
// Create a custom Season Odometer Component
export const SeasonOdometer = ({ value, amplitude, top, right }: { value: number | string, amplitude: number, top: string, right: string }) => {
  const odometerRef = useRef<HTMLDivElement>(null);
  const odometerInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Need to dynamically import TM-Odometer since it's a browser library
    const loadTMOdometer = async () => {
      if (typeof window !== 'undefined' && odometerRef.current) {
        try {
          // Dynamic import of TM-Odometer
          const TMOdometer = TMOdometerModule;

          // If we haven't created the odometer yet, create it
          if (!odometerInstanceRef.current && odometerRef.current) {
            odometerInstanceRef.current = new TMOdometer({
              el: odometerRef.current,
              value: value,
              animation: "slide",
              theme: 'slot-machine',
              digits: 0,
              format: '(ddd)',
              duration: 300
            });
          } else if (odometerInstanceRef.current) {
            // Update the value if odometer already exists
            odometerInstanceRef.current.update(value);
          }
        } catch (error) {
          console.error('Failed to load TM-Odometer:', error);
        }
      }
    };

    loadTMOdometer();

    // Cleanup function
    return () => {
      if (odometerInstanceRef.current && odometerInstanceRef.current.destroy) {
        odometerInstanceRef.current.destroy();
        odometerInstanceRef.current = null;
      }
    };
  }, [value]);

  return (
    <div
      ref={odometerRef}
      style={{
        fontSize: '48px',
        fontWeight: 500,
        top, right,
        filter: "grayscale(1)",
        opacity: 1, color: "#222222",
        boxShadow: `0 14px 20px 5px rgba(50, 150, 250, ${amplitude.toFixed(3)})`
      }}
    ></div>
  );
};