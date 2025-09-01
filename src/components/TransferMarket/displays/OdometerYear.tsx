import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from 'remotion';

// --- STYLE VALUES ---
const digitHeight = 80;
const digitWidth = 50;
const ANIMATION_DURATION_IN_FRAMES = 30;

/**
 * OdometerDigit: Renders a single, stateless digit.
 * This sub-component is correct and does not need changes.
 */
const OdometerDigit: React.FC<{
  digit: string;
  prevDigit: string | null;
  startFrame: number;
}> = ({ digit, prevDigit, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If there's no previous digit, this digit is not animating. Render it statically.
  if (prevDigit === null) {
    return <div style={{ height: digitHeight, width: digitWidth, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{digit}</div>;
  }

  // The spring animation is driven by the time elapsed since the animation's startFrame.
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 200, stiffness: 100 },
    durationInFrames: ANIMATION_DURATION_IN_FRAMES,
  });

  const oldDigitTranslateY = interpolate(progress, [0, 1], [0, -digitHeight]);
  const newDigitTranslateY = interpolate(progress, [0, 1], [digitHeight, 0]);

  return (
    <div style={{ height: digitHeight, width: digitWidth, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `translateY(${oldDigitTranslateY}px)` }}>{prevDigit}</div>
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `translateY(${newDigitTranslateY}px)` }}>{digit}</div>
    </div>
  );
};

// --- The Main Component (Final Stateless Architecture) ---
interface OdometerData {
  date: string | number;
  slowDown?: number;
  [key: string]: any;
}

interface OdometerTimelineProps {
  data: OdometerData[];
  baseDurationPerItemInMs: number;
}

export const OdometerTimeline: React.FC<OdometerTimelineProps> = ({
  data,
  baseDurationPerItemInMs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!data || data.length === 0) {
    return null;
  }

  // Step 1: Mimic the main component's timeline calculation to create a lookup table.
  // This is deterministic and memoized for performance.
  const timeline = useMemo(() => {
    const slowDownFactors = data.map(d => {
      const val = parseFloat(d.slowDown as any);
      return isNaN(val) || val <= 0 ? 1 : val;
    });
    
    const FRAMES_PER_UNIT_POINT = (fps * baseDurationPerItemInMs) / 1000;
    let frameStart = 0;
    return data.map((item, index) => {
      const slowDownFactor = slowDownFactors[index];
      const segmentDurationInFrames = slowDownFactor * FRAMES_PER_UNIT_POINT;
      const entry = {
        date: item.date,
        startFrame: Math.floor(frameStart),
        endFrame: Math.floor(frameStart + segmentDurationInFrames),
      };
      frameStart += segmentDurationInFrames;
      return entry;
    });
  }, [data, baseDurationPerItemInMs, fps]);

  // Step 2: Find the entry for the current frame. This is also deterministic.
  const findEntryForFrame = (f: number) => timeline.find(e => f >= e.startFrame && f < e.endFrame) ?? timeline[timeline.length - 1];
  const currentEntry = findEntryForFrame(frame);

  if (!currentEntry) {
    return null;
  }
  
  // Step 3: THE CRITICAL LOGIC - Deterministically find the previous state.
  // We calculate this fresh on every frame. `useMemo` makes it efficient.
  const { prevDateForAnimation, animationStartFrame } = useMemo(() => {
    // Find the index of the first item in the current continuous block of identical dates.
    let firstIndexOfBlock = 0;
    for (let i = timeline.length - 1; i >= 0; i--) {
        if(timeline[i].startFrame <= currentEntry.startFrame && timeline[i].date === currentEntry.date) {
            firstIndexOfBlock = i;
        } else if (timeline[i].startFrame < currentEntry.startFrame) {
            break;
        }
    }
    
    // The animation starts at the calculated start frame of this block.
    const startFrameOfCurrentBlock = timeline[firstIndexOfBlock].startFrame;

    // The previous date is the date of the item immediately preceding this block.
    const prevDate = firstIndexOfBlock > 0 ? timeline[firstIndexOfBlock - 1].date : currentEntry.date;
    
    return {
      prevDateForAnimation: prevDate,
      animationStartFrame: startFrameOfCurrentBlock,
    };
  }, [currentEntry.date, currentEntry.startFrame, timeline]);


  const currentDate = currentEntry.date;
  const currentDigits = currentDate.toString().split('');
  const prevDigits = prevDateForAnimation.toString().split('');

  return (
    <AbsoluteFill style={{ fontSize: digitHeight, fontWeight: 'bold', color: 'white' }}>
      <div style={{ position: 'absolute', top: '14%', right: '2%', display: 'flex', fontFamily: "Bebas Nue" }}>
        {currentDigits.map((digit, index) => {
          // A digit should animate if the overall date has changed.
          const shouldAnimate = prevDateForAnimation !== currentDate;
          const prevDigit = shouldAnimate && prevDigits[index] !== digit ? prevDigits[index] : null;

          return (
            <OdometerDigit
              key={`${index}-${currentDate}`}
              digit={digit}
              prevDigit={prevDigit}
              startFrame={animationStartFrame}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};