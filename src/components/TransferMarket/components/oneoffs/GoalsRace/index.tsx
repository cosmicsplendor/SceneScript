import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from 'remotion';
import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { easingFns } from '../../../../../../lib/d3/utils/math';
import { RaysBackground } from './Backgrounds/RaysBg';
import lottie, { AnimationItem } from 'lottie-web';
import lottieAnims from '../../../../../components/TransferMarket/EffectsManager/effects/Lottie/anims/index';

// -- Data and Configuration -- //

const playerNames = [
  "Lionel Messi",
  "Cristiano Ronaldo",
];

const imageMap: Record<string, string> = {
  "Lionel Messi": "messy_styled1.png",
  "Cristiano Ronaldo": "ronaldo_styled1.png",
};

const colorMap: Record<string, string> = {
  "Kylian Mbappé": "#D4A017",
  "Mohamed Salah": "crimson",
  "Robert Lewandowski": "dodgerblue",
  "Harry Kane": "#0D98BA",
  "Lionel Messi": "purple",
  "Cristiano Ronaldo": "gold",
};

const goalImage = staticFile('images/ball.png');

// Zod schema for validating props
export const mySchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      data: z.array(
        z.object({
          name: z.string(),
          value: z.number(),
          // If a player scores 0 goals, we can show an emoji instead
          emoji: z.string().optional(),
          lottie: z.any().optional(),
        })
      ),
    })
  ),
});

// -- Animation Constants -- //
const SCORE_RIGHT_OFFSET = 24
const PADDING_TOP = 400; // Reduced vertical padding
const PADDING_LEFT = 80;
const SIDEBAR_WIDTH = 240;
const WEEK_WIDTH = 300;
const FRAMES_PER_WEEK = 60;
const BOTTOM_AREA_HEIGHT = 240; // Reduced space at the bottom
const BALL_SIZE = 64;
const SCORE_BOX_WIDTH = 200;
const SCORE_BOX_HEIGHT = BALL_SIZE * 2.8; // Added 24 pixels height
const LANE_COLOR = "rgba(256, 256, 256, 0.4)"
const GRAPH_TOP_PADDING = 50
const GRAPH_BOTTOM_PADDING = 50
const IMG_RIGHT_OFFSET = 75; // Offset for player images
// Easing function for pop effect
const elasticOut = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

interface LottieConfig {
  anim: any;
  start?: number;
  duration?: number;
}

interface GoalBallsProps {
  count: number;
  emoji?: string;
  lottie?: LottieConfig;
}

const GoalBalls: React.FC<GoalBallsProps> = ({
  count,
  emoji,
  lottie: lottieObj,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  console.log(lottieObj)
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieInstanceRef = useRef<AnimationItem | null>(null);
  const [isLottieReady, setIsLottieReady] = useState(false);

  const springIn = spring({
    fps,
    frame,
    config: { stiffness: 100, damping: 10 },
    durationInFrames: 30,
  });

  // Initialize Lottie animation
  useEffect(() => {
    if (lottieObj && containerRef.current && count === 0) {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: lottieObj.anim,
      });
      
      lottieInstanceRef.current = anim;

      const onDOMLoaded = () => setIsLottieReady(true);
      anim.addEventListener('DOMLoaded', onDOMLoaded);

      return () => {
        anim.removeEventListener('DOMLoaded', onDOMLoaded);
        anim.destroy();
        lottieInstanceRef.current = null;
        setIsLottieReady(false);
      };
    }
  }, [lottie, count]);

  // Control Lottie animation playback
  useEffect(() => {
    if (!isLottieReady || !lottieInstanceRef.current || !lottie || count !== 0 || !lottieObj) {
      return;
    }

    const lottieInstance = lottieInstanceRef.current;
    const start = lottieObj.start || 0;
    const duration = lottieObj.duration || 2;
    const totalFramesInTimeline = duration * fps;

    if (totalFramesInTimeline <= 0) {
      lottieInstance.goToAndStop(0, true);
      return;
    }

    const relativeFrame = frame - start;

    // If we haven't reached the start frame yet, don't show animation
    if (relativeFrame < 0) {
      lottieInstance.goToAndStop(0, true);
      return;
    }

    // Calculate progress and animate
    const rawProgress = relativeFrame / totalFramesInTimeline;
    const finalProgress = Math.max(0, Math.min(1, rawProgress));
    const lottieFrame = finalProgress * lottieInstance.totalFrames;
    lottieInstance.goToAndStop(lottieFrame, true);

  }, [isLottieReady, frame, fps, lottie, count]);

  // Calculate Lottie dimensions to match emoji size
  const getLottieDimensions = () => {
    console.log()
    if (!lottieObj) return {width: 0, height: 0}
    if (!lottieObj?.anim?.w || !lottieObj?.anim?.h) {
      return { width: lottieObj.size, height: lottieObj.size };
    }
    const aspectRatio = lottieObj.anim.w / lottieObj.anim.h;
    const targetSize = lottieObj.size; // Match emoji size
    const width = aspectRatio >= 1 ? targetSize : targetSize * aspectRatio;
    const height = aspectRatio >= 1 ? targetSize / aspectRatio : targetSize;
    return { width, height };
  };

  if (count === 0) {
    // Priority: Lottie > Emoji > Nothing
    if (lottie) {
      const dimensions = getLottieDimensions();
      return (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: dimensions.width,
            height: dimensions.height,
          }}
        >
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      );
    }
    
    if (emoji) {
      return (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
            fontSize: BALL_SIZE * 1.5,
            display: 'flex',
            alignItems: 'center',
            flexDirection: "row",
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {emoji}
        </div>
      );
    }
    
    // Otherwise, render nothing for zero goals.
    return null;
  }

  const isFourGoals = count === 4;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
        display: 'flex',
        flexWrap: isFourGoals ? 'wrap' : 'nowrap',
        flexDirection: isFourGoals ? 'row' : 'column',
        width: isFourGoals ? BALL_SIZE * 2 + 5 : BALL_SIZE,
        // Make balls overlap vertically
        gap: isFourGoals ? 5 : -15,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array(count)
        .fill(true)
        .map((_, i) => (
          <Img
            key={i}
            src={goalImage}
            style={{ width: BALL_SIZE, height: BALL_SIZE }}
          />
        ))}
    </div>
  );
};

const ScoreBox: React.FC<{
  color: string;
  progress: number;
  score: number;
  scoreChangeFrame: number;
  hasScoreChanged: boolean;
}> = ({ color, progress, score, scoreChangeFrame, hasScoreChanged }) => {
  const frame = useCurrentFrame();

  // Gentler opening animation with longer duration
  const width = easingFns.sineInOut(progress) * SCORE_BOX_WIDTH

  // Initial number scale-up animation - starts when box is about 60% open
  const numberProgress = interpolate(
    progress,
    [0.6, 1],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const initialNumberScale = elasticOut(numberProgress);

  // Pop effect triggered by actual collision timing - only if score actually changed
  const framesSinceScoreChange = frame - scoreChangeFrame;
  const isRecentScoreChange = hasScoreChanged && framesSinceScoreChange >= 0 && framesSinceScoreChange < 40;
  const popScale = isRecentScoreChange
    ? 0.5 + 0.5 * elasticOut(Math.min(framesSinceScoreChange / 40, 1))
    : 1;

  // Combine both scales - initial opening and pop effects
  const textScale = initialNumberScale * popScale;

  return (
    <div
      style={{
        backgroundColor: color,
        width: width,
        overflow: "hidden",
        height: SCORE_BOX_HEIGHT,
        borderRadius: 0,
        transformOrigin: 'left',
        display: 'flex',
        position: "relative",
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
      8px 5px 25px rgba(0,0,0,0.8)
      `,
      }}
    >
      <div
        style={{
          transform: `scale(${textScale})`,
          color: 'white',
          fontSize: 150,
          fontWeight: 'bold',
          textShadow: '2px 2px 8px rgba(0,0,0,1)',
          transition: 'none',
          position: "absolute",
          top: -6,
          right: SCORE_RIGHT_OFFSET
        }}
      >
        {score}
      </div>
    </div>
  );
};

// -- Main Video Component -- //

export const GoalsRace: React.FC<z.infer<typeof mySchema>> = ({ data }) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const numPlayers = playerNames.length;

  const durationInFrames = (data.length + 2) * FRAMES_PER_WEEK;

  const graphMovement = interpolate(
    frame,
    [0, durationInFrames],
    [width, width - (data.length + 1) * WEEK_WIDTH]
  );

  const graphAreaHeight = height - PADDING_TOP - BOTTOM_AREA_HEIGHT;
  const playerLaneHeight = (graphAreaHeight - GRAPH_BOTTOM_PADDING) / numPlayers;

  const processedData = data.map((weekData, weekIndex) => ({
    ...weekData,
    data: weekData.data.map((playerData) => {
      const prevWeekValue =
        weekIndex > 0
          ? data[weekIndex - 1].data.find((p) => p.name === playerData.name)?.value ?? 0
          : 0;
      return {
        ...playerData,
        newGoals: playerData.value - prevWeekValue,
      };
    }),
  }));

  return (
    <AbsoluteFill style={{
        background: `radial-gradient(ellipse at top left, rgba(30, 58, 138, 0.4), transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.3), transparent 60%),
          linear-gradient(to right, #1E3A8A, #3B82F6)`,
      }}>
      {/* --- Clipped Graph Area with different background --- */}
      <AbsoluteFill
      style={{
          left: SIDEBAR_WIDTH + PADDING_LEFT,
          top: PADDING_TOP,
          width: width - (SIDEBAR_WIDTH + PADDING_LEFT),
          height: graphAreaHeight,
          overflow: 'hidden', // This is crucial for clipping
          // background: "#3B82F6"
        }}
      >
        {/* Container for all moving elements */}
        <div
          style={{
            position: 'absolute',
            left: graphMovement - (SIDEBAR_WIDTH + PADDING_LEFT),
            top: 0,
            height: '100%',
          }}
        >
          {processedData.map((week, i) => (
            <div
              key={week.date}
              style={{
                position: 'absolute',
                left: i * WEEK_WIDTH,
                height: '100%',
                width: WEEK_WIDTH,
              }}
            >
              {/* Bold vertical line */}
              <div style={{
                position: 'absolute', left: '50%', top: 72, width: 8, height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', transform: 'translateX(-50%)',
                zIndex: 2, // CHANGED: Set z-index to 2
              }} />
              {/* Week Label - Made larger and bolder */}
              <div style={{ position: 'absolute', top: -10, width: '100%', textAlign: 'center', color: 'white', fontFamily: "Bebas Nue", fontSize: 64, fontWeight: 'bold', textShadow: '0 4px 10px rgba(2, 8, 95, 0.8)' }}>{week.date}</div>

              {/* Goal Balls or Emojis */}
              {week.data.map((player) => {
                const playerIndex = playerNames.indexOf(player.name);
                if (playerIndex === -1) return null;
                const laneTop = playerIndex * playerLaneHeight + GRAPH_TOP_PADDING;
                return (
                  // CHANGED: Added zIndex to the ball container
                  <div key={player.name} style={{ position: 'absolute', top: laneTop, height: playerLaneHeight, width: '100%', zIndex: 4 }}>
                    <GoalBalls count={player.newGoals} emoji={player.emoji} lottie={player.lottie && { ...player.lottie, anim: lottieAnims[player.lottie.anim]}}/>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* --- UI Overlay (Axes, Title, Avatars, Score Boxes) --- */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: PADDING_TOP - 200,
            left: PADDING_LEFT,
            padding: "12px 70px",
            border: '5px solid white',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: 80,
            fontWeight: 'bold',
            textShadow: '0 4px 10px rgba(2, 8, 95, 0.75)',
            boxShadow: '0 4px 10px rgba(2, 8, 95, 0.5)',
            fontFamily: "Bebas Nue"
          }}
        >
          GOALS IN FIRST 40 LEAGUE GAMES
        </div>

        {/* CHANGED: Added zIndex to the Y-axis line */}
        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: PADDING_TOP, bottom: BOTTOM_AREA_HEIGHT - 4, width: 8, backgroundColor: 'white', zIndex: 5 }} />
        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: height - BOTTOM_AREA_HEIGHT, right: 0, height: 8, backgroundColor: 'white', zIndex: 5 }} />

        {playerNames.map((name, i) => {
          const laneTop = PADDING_TOP + GRAPH_TOP_PADDING + i * playerLaneHeight;
          const playerImageSize = playerLaneHeight * 0.5;

          let currentScore = 0;
          let firstGoalWeek = -1;
          let lastScoreChangeFrame = -1;
          let hasActualScoreChange = false;

          // First pass: find the current accumulated score by checking all weeks up to current position
          const scoreBoxLeft = SIDEBAR_WIDTH + PADDING_LEFT + 8;
          const collisionThreshold = scoreBoxLeft + 60; // Earlier collision detection

          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;

            // Update current score for all weeks that have passed the collision threshold
            if (weekXPosition <= collisionThreshold) {
              const weekScore = data[weekIdx].data.find(p => p.name === name)?.value ?? 0;
              currentScore = Math.max(currentScore, weekScore);
            }

            if (firstGoalWeek === -1 && (data[weekIdx].data.find(p => p.name === name)?.value ?? 0) > 0) {
              firstGoalWeek = weekIdx;
            }
          }

          // Second pass: find when the most recent score change happened for pop animation
          let previousScore = 0;
          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;

            // Check for collision in a narrower window around the threshold
            if (weekXPosition <= collisionThreshold && weekXPosition >= collisionThreshold - 30) {
              const weekScore = data[weekIdx].data.find(p => p.name === name)?.value ?? 0;
              const playerWeekData = processedData[weekIdx].data.find(p => p.name === name);
              const newGoalsThisWeek = playerWeekData?.newGoals ?? 0;

              // Only trigger animation if there are actual new goals this week AND score increased
              if (weekScore > previousScore && newGoalsThisWeek > 0) {
                // Calculate the exact frame when the collision happens
                const ballCenterX = weekXPosition;
                
                // By calculating the offset based on a fixed 60 frames, we decouple the
                // pop animation speed from the `FRAMES_PER_WEEK` variable. This ensures
                // the animation in ScoreBox (which expects a ~40 frame animation) is
                // correctly timed regardless of the graph's scroll speed.
                const frameOffsetBasedOn60 =
                  ((collisionThreshold - ballCenterX) / WEEK_WIDTH) * 60;
                lastScoreChangeFrame = frame - frameOffsetBasedOn60;

                hasActualScoreChange = true;
              }
              previousScore = Math.max(previousScore, weekScore);
            }
          }

          const firstGoalWeekXPos = graphMovement + firstGoalWeek * WEEK_WIDTH;

          // Only start expanding when balls are very close to the score box
          const scoreboxProgress = interpolate(
            firstGoalWeekXPos,
            [scoreBoxLeft - 100, scoreBoxLeft + 140],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div key={name} style={{ position: 'absolute', top: laneTop, left: 0, width: '100%', height: playerLaneHeight }}>
              {/* CHANGED: Added zIndex to the dotted line */}
              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: '50%', width: width, borderTop: `12px dashed ${LANE_COLOR}`, zIndex: 1 }} />

              {/* <div style={{ position: 'absolute', left: PADDING_LEFT - IMG_RIGHT_OFFSET, top: '50%', transform: 'translateY(-50%)', height: "playerImageSize", width: playerImageSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '12px solid whitesmoke', boxShadow: '2px 7px 10px rgba(2, 8, 95, 0.5)' }}>
                <Img src={staticFile(`player-images/${imageMap[name]}`)} style={{ width: '100%', height: '100%' }} />
              </div> */}
              <div style={{ position: 'absolute', left: PADDING_LEFT - IMG_RIGHT_OFFSET, top: '50%', transform: 'translateY(-50%)', height: "playerImageSize", width: playerImageSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Img src={staticFile(`player-images/${imageMap[name]}`)} style={{ width: '100%', height: '100%', filter: "drop-shadow(0 0 16px midnightblue)" }} />
              </div>

              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT + 8, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                {firstGoalWeek !== -1 && (
                  <ScoreBox
                    color={colorMap[name]}
                    progress={scoreboxProgress}
                    score={currentScore}
                    scoreChangeFrame={lastScoreChangeFrame}
                    hasScoreChanged={hasActualScoreChange}
                  />
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};