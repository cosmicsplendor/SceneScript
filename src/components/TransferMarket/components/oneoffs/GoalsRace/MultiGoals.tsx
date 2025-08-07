import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from 'remotion';
import React from 'react';
import { z } from 'zod';
import { easingFns } from '../../../../../../lib/d3/utils/math';
import { RaysBackground } from './Backgrounds/RaysBg';
import logosMap from "../../../assets/logosMap.json"
import colorMap from "../../../assets/colorsMap.json"

// -- Data and Configuration -- //

const playerNames = [
  "Barcelona",
  "Real Madrid",
  "Man City",
  "Bayern Munich",
];

const imageMap: Record<string, string> = logosMap


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
        })
      ),
    })
  ),
});

// -- Animation Constants -- //
const SCORE_RIGHT_OFFSET = 14
const PADDING_TOP = 400; // Reduced vertical padding
const PADDING_LEFT = 50;
const SIDEBAR_WIDTH = 272;
const WEEK_WIDTH = 350;
const FRAMES_PER_WEEK = 44;
const BOTTOM_AREA_HEIGHT = 240; // Reduced space at the bottom
const BALL_SIZE = 64; // Base size, used for reference in circle size
const SCORE_BOX_WIDTH = 240;
const SCORE_BOX_HEIGHT = BALL_SIZE * 2.8; // Added 24 pixels height
const LANE_COLOR = "rgba(256, 256, 256, 0.4)"
const GRAPH_TOP_PADDING = 50
const GRAPH_BOTTOM_PADDING = 50
const IMG_RIGHT_OFFSET = 24; // Offset for player images
const CIRCLE_SIZE = 120
// Easing function for pop effect
const elasticOut = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// -- Helper Components -- //

// MODIFIED: This component now shows a number in a circle instead of ball images.
const GoalNumberCircle: React.FC<{
  count: number;
  emoji?: string;
  color: string;
}> = ({ count, emoji, color }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const springIn = spring({
    fps,
    frame,
    config: { stiffness: 100, damping: 10 },
    durationInFrames: 30,
  });

  if (count === 0) {
    // If there are no goals, but there is an emoji, show it.
    if (emoji) {
      return (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
            fontSize: BALL_SIZE * 1.2,
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

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: '50%',
        backgroundColor: "rgba(9, 240, 9, 1)",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '4px solid green',
      }}
    >
      <span
        style={{
          color: 'black',
          fontSize: 48,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        +{count}
      </span>
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
  const width = easingFns.sineInOut(progress) * SCORE_BOX_WIDTH;

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
  const isRecentScoreChange =
    hasScoreChanged &&
    framesSinceScoreChange >= 0 &&
    framesSinceScoreChange < 40; // The 40-frame duration you want
  
  const popScale = isRecentScoreChange
    ? 0.5 + 0.5 * elasticOut(Math.min(framesSinceScoreChange / 40, 1))
    : 1;

  // --- FIXED: This is the only line that changes ---
  // If a pop is happening, use its scale. Otherwise, use the initial opening scale.
  // This prevents the animations from fighting each other.
  const textScale = isRecentScoreChange ? popScale : initialNumberScale;

  return (
    <div
      style={{
        backgroundColor: color,
        width: width,
        overflow: 'hidden',
        height: SCORE_BOX_HEIGHT,
        borderRadius: 0,
        transformOrigin: 'left',
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `8px 5px 25px rgba(0,0,0,0.8)`,
      }}
    >
      <div
        style={{
          transform: `scale(${textScale})`,
          color: 'white',
          fontSize: 100,
          fontWeight: 'bold',
          textShadow: '2px 2px 8px rgba(0,0,0,1)',
          transition: 'none',
          position: 'absolute',
          top: 20,
          right: SCORE_RIGHT_OFFSET,
        }}
      >
        {score}
      </div>
    </div>
  );
};

// -- Main Video Component -- //

export const MultiGoals: React.FC<z.infer<typeof mySchema>> = ({ data }) => {
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
          ? data[weekIndex - 1].data.find((p) => p.name === playerData.name)
              ?.value ?? 0
          : 0;
      return {
        ...playerData,
        newGoals: playerData.value - prevWeekValue,
      };
    }),
  }));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at top left, rgba(30, 58, 138, 0.4), transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.3), transparent 60%),
          linear-gradient(to right, #1E3A8A, #3B82F6)`,
      }}
    >
      {/* --- Clipped Graph Area with different background --- */}
      <AbsoluteFill
        style={{
          left: SIDEBAR_WIDTH + PADDING_LEFT,
          top: PADDING_TOP,
          width: width - (SIDEBAR_WIDTH + PADDING_LEFT),
          height: graphAreaHeight,
          overflow: 'hidden',
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
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 50,
                  width: 8,
                  height: '100%',
                  backgroundColor: 'rgba(9, 240, 9, 1)',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  width: '100%',
                  textAlign: 'center',
                  color: 'white',
                  fontSize: 48,
                  fontWeight: 'bold',
                  textShadow: '0 4px 10px rgba(2, 8, 95, 0.8)',
                }}
              >
                {week.date}
              </div>
              {week.data.map((player) => {
                const playerIndex = playerNames.indexOf(player.name);
                if (playerIndex === -1) return null;
                const laneTop =
                  playerIndex * playerLaneHeight + GRAPH_TOP_PADDING;
                return (
                  <div
                    key={player.name}
                    style={{
                      position: 'absolute',
                      top: laneTop,
                      height: playerLaneHeight,
                      width: '100%',
                      zIndex: 4,
                    }}
                  >
                    <GoalNumberCircle
                      count={player.newGoals}
                      emoji={player.emoji}
                      color={colorMap[player.name]}
                    />
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
            padding: '12px 70px',
            border: '5px solid white',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: 100,
            fontWeight: 'bold',
            textShadow: '0 4px 10px rgba(2, 8, 95, 0.75)',
            boxShadow: '0 4px 10px rgba(2, 8, 95, 0.5)',
            fontFamily: 'Bebas Nue',
          }}
        >
          GOALS IN 21st CENTURY
        </div>
        <div
          style={{
            position: 'absolute',
            left: SIDEBAR_WIDTH + PADDING_LEFT,
            top: PADDING_TOP,
            bottom: BOTTOM_AREA_HEIGHT - 4,
            width: 12,
            backgroundColor: 'white',
            zIndex: 5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: SIDEBAR_WIDTH + PADDING_LEFT,
            top: height - BOTTOM_AREA_HEIGHT,
            right: 0,
            height: 12,
            backgroundColor: 'white',
            zIndex: 5,
          }}
        />
        {playerNames.map((name, i) => {
          const laneTop =
            PADDING_TOP + GRAPH_TOP_PADDING + i * playerLaneHeight;
          const playerImageSize = playerLaneHeight * 0.925;

          let currentScore = 0;
          let firstGoalWeek = -1;

          const scoreBoxLeft = SIDEBAR_WIDTH + PADDING_LEFT + 8;
          const collisionThreshold = scoreBoxLeft + 60; // Earlier collision detection

          // First pass for score is unchanged and correct.
          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;
            if (weekXPosition <= collisionThreshold) {
              const weekScore =
                data[weekIdx].data.find((p) => p.name === name)?.value ?? 0;
              currentScore = Math.max(currentScore, weekScore);
            }
            if (
              firstGoalWeek === -1 &&
              (data[weekIdx].data.find((p) => p.name === name)?.value ?? 0) > 0
            ) {
              firstGoalWeek = weekIdx;
            }
          }

          // --- FIXED: STABLE ANIMATION TRIGGER LOGIC ---
          let mostRecentStartFrame = -1;

          // Find the MOST RECENT collision that has already happened.
          let previousScore = 0;
          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;
            const weekScore =
              data[weekIdx].data.find((p) => p.name === name)?.value ?? 0;
            const newGoalsThisWeek =
              processedData[weekIdx].data.find((p) => p.name === name)
                ?.newGoals ?? 0;

            // Check if a score increase event has passed the threshold.
            if (
              weekXPosition <= collisionThreshold &&
              weekScore > previousScore &&
              newGoalsThisWeek > 0
            ) {
              // This is a valid collision. Use your timing logic to find its start frame.
              const ballCenterX = weekXPosition;
              const frameOffsetBasedOn60 =
                ((collisionThreshold - ballCenterX) / WEEK_WIDTH) * 60;
              const startFrameForThisCollision = frame - frameOffsetBasedOn60;

              // Keep track of the most recent (highest frame number) collision start.
              mostRecentStartFrame = Math.max(
                mostRecentStartFrame,
                startFrameForThisCollision
              );
            }
            previousScore = Math.max(previousScore, weekScore);
          }

          // Now, derive the animation props from this STABLE, reliable frame number.
          const lastScoreChangeFrame = mostRecentStartFrame;
          const framesSinceCollision = frame - lastScoreChangeFrame;

          // hasActualScoreChange will now stay TRUE for the full 40 frames.
          const hasActualScoreChange =
            lastScoreChangeFrame !== -1 &&
            framesSinceCollision >= 0 &&
            framesSinceCollision < 40;
          
          // The rest of your code is unchanged.
          const firstGoalWeekXPos = graphMovement + firstGoalWeek * WEEK_WIDTH;
          const scoreboxProgress = interpolate(
            firstGoalWeekXPos,
            [scoreBoxLeft - 100, scoreBoxLeft + 140],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={name}
              style={{
                position: 'absolute',
                top: laneTop,
                left: 0,
                width: '100%',
                height: playerLaneHeight,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: SIDEBAR_WIDTH + PADDING_LEFT,
                  top: '50%',
                  width: width,
                  borderTop: `12px dashed ${LANE_COLOR}`,
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: PADDING_LEFT - IMG_RIGHT_OFFSET,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: playerImageSize,
                  width: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Img
                  src={imageMap[name]}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: SIDEBAR_WIDTH + PADDING_LEFT + 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                }}
              >
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