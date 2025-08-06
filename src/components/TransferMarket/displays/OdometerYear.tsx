import React, { useState, useMemo, useEffect } from 'react';
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

  if (prevDigit === null) {
    return <div style={{ height: digitHeight, width: digitWidth, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{digit}</div>;
  }

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

// --- The Main Component (Re-engineered with State) ---
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

  // Step 1: Perfectly mimic the main component's timeline calculation. This part is correct.
  const slowDownFactors = useMemo(() => data.map(d => {
    const val = parseFloat(d.slowDown as any);
    return isNaN(val) || val <= 0 ? 1 : val;
  }), [data]);

  const timeline = useMemo(() => {
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
  }, [data, slowDownFactors, baseDurationPerItemInMs, fps]);

  // Step 2: Determine what the date *should* be based on the current frame.
  const findEntryForFrame = (f: number) => timeline.find(e => f >= e.startFrame && f < e.endFrame) ?? timeline[timeline.length - 1];
  const calculatedEntry = findEntryForFrame(frame);

  // --- Step 3: THE CRITICAL FIX - Introduce State ---
  // This state holds what is *actually* being displayed, preventing flicker.
  const [animationState, setAnimationState] = useState({
    // The date currently visible or at the end of an animation.
    displayedDate: findEntryForFrame(0)?.date ?? data[0].date,
    // The date to animate FROM.
    fromDate: findEntryForFrame(0)?.date ?? data[0].date,
    // The frame number where the last animation was triggered.
    animationStartFrame: 0,
  });

  // This effect is the new "brain". It watches for when the calculated date
  // differs from the date currently being displayed.
  useEffect(() => {
    if (calculatedEntry && calculatedEntry.date !== animationState.displayedDate) {
      // A change is detected! Trigger a new animation.
      setAnimationState({
        displayedDate: calculatedEntry.date, // The new target date.
        fromDate: animationState.displayedDate, // Animate FROM the date that was just showing.
        animationStartFrame: frame, // Lock in the current frame as the animation start.
      });
    }
  }, [calculatedEntry, frame, animationState.displayedDate]);
  
  // The values used for rendering now come from our stable state.
  const currentDate = animationState.displayedDate;
  const prevDateForAnimation = animationState.fromDate;

  const currentDigits = currentDate.toString().split('');
  const prevDigits = prevDateForAnimation.toString().split('');

  return (
    <AbsoluteFill style={{ fontSize: digitHeight, fontFamily: 'monospace', fontWeight: 'bold', color: 'white' }}>
      <div style={{ position: 'absolute', top: '10%', right: '4%', display: 'flex' }}>
        {currentDigits.map((digit, index) => {
          // Animate only if the "from" date and "to" date are different.
          const shouldAnimate = prevDateForAnimation !== currentDate;
          const prevDigit = shouldAnimate && prevDigits[index] !== digit ? prevDigits[index] : null;

          return (
            <OdometerDigit
              key={`${index}-${currentDate}`}
              digit={digit}
              prevDigit={prevDigit}
              startFrame={animationState.animationStartFrame}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};