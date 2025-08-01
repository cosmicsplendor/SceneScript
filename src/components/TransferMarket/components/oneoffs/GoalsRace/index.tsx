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

// -- Data and Configuration -- //

const playerNames = [
  "Kylian Mbappé",
  "Mohamed Salah",
  "Cristiano Ronaldo",
  "Robert Lewandowski",
  "Harry Kane",
];

const imageMap: Record<string, string> = {
  "Kylian Mbappé": "mbappé.png",
  "Mohamed Salah": "salah.png",
  "Robert Lewandowski": "lewandowski.png",
  "Harry Kane": "kane.png",
  "Cristiano Ronaldo": "ronaldo.png",
};

const colorMap: Record<string, string> = {
  "Kylian Mbappé": "blue",
  "Mohamed Salah": "crimson",
  "Robert Lewandowski": "gold",
  "Harry Kane": "green",
  "Cristiano Ronaldo": "purple",
};

const goalImage = staticFile('images/ball.png');
const year = "2024-25";

// Updated Zod schema to include optional emoji field
export const mySchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      data: z.array(
        z.object({
          name: z.string(),
          value: z.number(),
          emoji: z.string().optional(), // New optional emoji field
        })
      ),
    })
  ),
});

// -- Animation Constants -- //
const SCORE_RIGHT_OFFSET = 16
const PADDING_TOP = 400; // Reduced vertical padding
const PADDING_LEFT = 100;
const SIDEBAR_WIDTH = 240;
const WEEK_WIDTH = 300;
const FRAMES_PER_WEEK = 60;
const BOTTOM_AREA_HEIGHT = 240; // Reduced space at the bottom
const BALL_SIZE = 64;
const SCORE_BOX_WIDTH = 200;
const SCORE_BOX_HEIGHT = BALL_SIZE * 2.8; // Added 24 pixels height
const LANE_COLOR = "rgba(256, 256, 256, 0.2)"
const GRAPH_TOP_PADDING = 50
const GRAPH_BOTTOM_PADDING = 50

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

const GoalBalls: React.FC<{ count: number }> = ({ count }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const springIn = spring({
    fps,
    frame,
    config: { stiffness: 100, damping: 10 },
    durationInFrames: 30,
  });

  if (count === 0) return null;

  const isFourGoals = count === 4;
  const isThreeGoals = count === 3;

  // For 3 goals, calculate how much the outer balls need to move inward to fit in score box
  // Score box height: BALL_SIZE * 2.8
  // For 3 balls to fit: top ball center + bottom ball center distance should be <= BALL_SIZE * 1.8
  // (because each ball extends BALL_SIZE/2 from its center)
  const adjustedBallSize = BALL_SIZE; // Always keep original size
  let adjustedGap;
  
  if (isThreeGoals) {
    // Available space between centers of top and bottom ball
    const availableCenterDistance = SCORE_BOX_HEIGHT - BALL_SIZE; // BALL_SIZE * 1.8
    // For 3 balls, we need 2 gaps between centers
    const requiredGapBetweenCenters = availableCenterDistance / 2;
    // The gap value is the overlap (negative spacing)
    adjustedGap = requiredGapBetweenCenters - BALL_SIZE; // This will be negative (overlap)
  } else if (isFourGoals) {
    adjustedGap = 5;
  } else {
    adjustedGap = -15;
  }

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
        // Make balls overlap vertically with adjusted gap
        gap: adjustedGap,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10, // High z-index for the entire ball container
      }}
    >
      {Array(count)
        .fill(true)
        .map((_, i) => (
          <Img
            key={i}
            src={goalImage}
            style={{ 
              width: adjustedBallSize, 
              height: adjustedBallSize,
              // Give middle ball higher z-index for 3-ball arrangement, all balls above bold lines
              zIndex: isThreeGoals && i === 1 ? 10 : 5, // All balls above bold lines (2)
              position: 'relative'
            }}
          />
        ))}
    </div>
  );
};

// New component for emoji display
const EmojiDisplay: React.FC<{ emoji: string }> = ({ emoji }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const springIn = spring({
    fps,
    frame,
    config: { stiffness: 100, damping: 10 },
    durationInFrames: 30,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
        fontSize: 80,
        textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
        zIndex: 10, // High z-index above bold lines
      }}
    >
      {emoji}
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
    ? 0.3 + 0.7 * elasticOut(Math.min(framesSinceScoreChange / 40, 1))
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
        0px -12px 24px 0px rgba(0,0,0,0.15),   /* top, softer and wider */
        0px 16px 32px 0px rgba(0,0,0,0.25),    /* bottom, softer and wider */
        16px 0px 32px 0px rgba(0,0,0,0.15),    /* right, softer and wider */
        6px 8px 24px 0px rgba(0,0,0,0.10)      /* diagonal bottom-right, softer */
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
      backgroundImage: `
        radial-gradient(ellipse at top left, rgba(0, 122, 255, 0.4), transparent 50%), 
 radial-gradient(ellipse at bottom right, rgba(0, 225, 255, 0.3), transparent 60%), 
 linear-gradient(to right, #007BFF, #00AFFF) 
      `
    }}>
      {/* --- Clipped Graph Area with different background --- */}
      <AbsoluteFill
        style={{
          left: SIDEBAR_WIDTH + PADDING_LEFT,
          top: PADDING_TOP,
          width: width - (SIDEBAR_WIDTH + PADDING_LEFT),
          height: graphAreaHeight,
          overflow: 'hidden', // This is crucial for clipping
          // backgroundColor: '#05219eff', // Slightly different color
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
                position: 'absolute', 
                left: '50%',  
                top: 50, 
                width: 8, 
                height: '100%', 
                backgroundColor: 'rgba(2, 0, 0, 1)', 
                transform: 'translateX(-50%)',
                zIndex: 0, // Below everything in the graph area
                // boxShadow: '0 6px 24px rgba(2, 8, 95, 0.4), 0 2px 8px rgba(1, 18, 75, 0.4), 0 0px 2px #000'
              }} />
              {/* Week Label - Made larger and bolder */}
              <div style={{ 
                position: 'absolute', 
                top: -10, 
                width: '100%', 
                textAlign: 'center', 
                color: 'white', 
                fontSize: 48, 
                fontWeight: 'bold',  
                textShadow: '0 6px 24px rgba(2, 8, 95, 0.4), 0 2px 8px rgba(1, 18, 75, 0.4), 0 0px 2px #000',
                zIndex: 15 // Keep high z-index for labels
              }}>
                {week.date}
              </div>

              {/* Goal Balls or Emoji */}
              {week.data.map((player) => {
                const playerIndex = playerNames.indexOf(player.name);
                if (playerIndex === -1) return null;
                const laneTop = playerIndex * playerLaneHeight + GRAPH_TOP_PADDING;
                return (
                  <div key={player.name} style={{ position: 'absolute', top: laneTop, height: playerLaneHeight, width: '100%', zIndex: 5 }}>
                    {/* Show emoji if present, otherwise show goal balls */}
                    {player.emoji ? (
                      <EmojiDisplay emoji={player.emoji} />
                    ) : (
                      <GoalBalls count={player.newGoals} />
                    )}
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
            fontSize: 72,
            fontWeight: 'bold',
            textShadow: '0 6px 24px rgba(2, 8, 95, 0.4), 0 2px 8px rgba(1, 18, 75, 0.4), 0 0px 2px #000',
            boxShadow: '0 6px 24px rgba(2, 8, 95, 0.4), 0 2px 8px rgba(1, 18, 75, 0.4, 0 0px 2px #000'
          }}
        >
          GOALS IN {year}
        </div>

        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: PADDING_TOP, bottom: BOTTOM_AREA_HEIGHT, width: 8, backgroundColor: 'white', zIndex: 5 }} />
        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: height - BOTTOM_AREA_HEIGHT, right: 0, height: 8, backgroundColor: 'white', zIndex: 5 }} />

        {playerNames.map((name, i) => {
          const laneTop = PADDING_TOP + GRAPH_TOP_PADDING + i * playerLaneHeight;
          const playerImageSize = playerLaneHeight * 0.925;

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
                const frameOffset = (collisionThreshold - ballCenterX) / WEEK_WIDTH * FRAMES_PER_WEEK;
                lastScoreChangeFrame = frame - frameOffset;
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
              {/* Lane line with lower z-index */}
              <div style={{ 
                position: 'absolute', 
                left: SIDEBAR_WIDTH + PADDING_LEFT, 
                top: '50%', 
                width: width, 
                borderTop: `12px dashed ${LANE_COLOR}`,
                zIndex: 1 // Below bold lines (2) and balls
              }} />

              <div style={{ position: 'absolute', left: (SIDEBAR_WIDTH + PADDING_LEFT - playerImageSize) / 2, top: '50%', transform: 'translateY(-50%)', height: playerImageSize, width: playerImageSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '12px solid whitesmoke', boxShadow: '0 6px 24px rgba(2, 8, 95, 0.4), 0 2px 8px rgba(1, 18, 75, 0.4), 0 0px 2px #000' }}>
                <Img src={staticFile(`race-images/${imageMap[name]}`)} style={{ width: '100%', height: '100%' }} />
              </div>

              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT + 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
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