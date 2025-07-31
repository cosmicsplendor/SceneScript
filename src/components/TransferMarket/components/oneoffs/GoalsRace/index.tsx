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

// Zod schema for validating props
export const mySchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      data: z.array(
        z.object({
          name: z.string(),
          value: z.number(),
        })
      ),
    })
  ),
});

// -- Animation Constants -- //

const PADDING_TOP = 300; // Reduced vertical padding
const PADDING_LEFT = 100; 
const SIDEBAR_WIDTH = 240;
const WEEK_WIDTH = 300;
const FRAMES_PER_WEEK = 60;
const BOTTOM_AREA_HEIGHT = 240; // Reduced space at the bottom
const BALL_SIZE = 56;
const SCORE_BOX_WIDTH = 200;
const SCORE_BOX_HEIGHT = BALL_SIZE * 2.8 + 24; // Added 24 pixels height
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
}> = ({ color, progress, score, scoreChangeFrame }) => {
  const frame = useCurrentFrame();

  // Gentler opening animation with longer duration
  const width = easingFns.sineInOut(progress) * SCORE_BOX_WIDTH

  // Pop effect triggered by actual collision timing
  const framesSinceScoreChange = frame - scoreChangeFrame;
  const isRecentScoreChange = framesSinceScoreChange >= 0 && framesSinceScoreChange < 30;

  const textScale = isRecentScoreChange
    ? 0.3 + 0.7 * elasticOut(Math.min(framesSinceScoreChange / 20, 1))
    : 1;

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
        fontSize: 80,
        fontWeight: 'bold',
        textShadow: '2px 2px 8px rgba(0,0,0,1)',
        transition: 'none',
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
    <AbsoluteFill style={{ backgroundColor: '#1a2b6d' }}>
      {/* --- Clipped Graph Area with different background --- */}
      <AbsoluteFill
        style={{
          left: SIDEBAR_WIDTH + PADDING_LEFT,
          top: PADDING_TOP,
          width: width - (SIDEBAR_WIDTH + PADDING_LEFT),
          height: graphAreaHeight,
          overflow: 'hidden', // This is crucial for clipping
          backgroundColor: '#203387', // Slightly different color
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
              <div style={{ position: 'absolute', left: '50%', top: 0, width: 12, height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', transform: 'translateX(-50%)' }} />
              {/* Week Label - Made larger and bolder */}
              <div style={{ position: 'absolute', top: -10, width: '100%', textAlign: 'center', color: 'white', fontSize: 54, fontWeight: 'bold' }}>{week.date}</div>

              {/* Goal Balls */}
              {week.data.map((player) => {
                const playerIndex = playerNames.indexOf(player.name);
                if (playerIndex === -1) return null;
                const laneTop = playerIndex * playerLaneHeight + GRAPH_TOP_PADDING;
                return (
                  <div key={player.name} style={{ position: 'absolute', top: laneTop, height: playerLaneHeight, width: '100%' }}>
                    <GoalBalls count={player.newGoals} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* --- UI Overlay (Axes, Title, Avatars, Score Boxes) --- */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: PADDING_TOP - 200 - 25, left: PADDING_LEFT, width: 777, height:200, border: '5px solid white', borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 60, fontWeight: 'bold' }}>
          GOALS IN {year}
        </div>

        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: PADDING_TOP, bottom: BOTTOM_AREA_HEIGHT, width: 8, backgroundColor: 'white' }} />
        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: height - BOTTOM_AREA_HEIGHT, right: 0, height: 8, backgroundColor: 'white' }} />

        {playerNames.map((name, i) => {
          const laneTop = PADDING_TOP + GRAPH_TOP_PADDING + i * playerLaneHeight;
          const playerImageSize = playerLaneHeight * 0.925;

          let currentScore = 0;
          let firstGoalWeek = -1;
          let lastScoreChangeFrame = -1;

          // First pass: find the current accumulated score by checking all weeks up to current position
          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;
            const scoreBoxLeft = SIDEBAR_WIDTH + PADDING_LEFT + 8;

            // Update current score for all weeks that have passed the score box
            if (weekXPosition <= scoreBoxLeft + 20) {
              const weekScore = data[weekIdx].data.find(p => p.name === name)?.value ?? 0;
              currentScore = Math.max(currentScore, weekScore); // Always keep the highest accumulated score
            }

            if (firstGoalWeek === -1 && (data[weekIdx].data.find(p => p.name === name)?.value ?? 0) > 0) {
              firstGoalWeek = weekIdx;
            }
          }

          // Second pass: find when the most recent score change happened for pop animation
          let previousScore = 0;
          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;
            const scoreBoxLeft = SIDEBAR_WIDTH + PADDING_LEFT + 8;

            if (weekXPosition <= scoreBoxLeft + 20 && weekXPosition >= scoreBoxLeft - 10) {
              const weekScore = data[weekIdx].data.find(p => p.name === name)?.value ?? 0;
              if (weekScore > previousScore) {
                // Calculate the exact frame when the collision happens
                const ballCenterX = weekXPosition;
                const frameOffset = (scoreBoxLeft + 5 - ballCenterX) / WEEK_WIDTH * FRAMES_PER_WEEK;
                lastScoreChangeFrame = frame - frameOffset;
              }
              previousScore = Math.max(previousScore, weekScore);
            }
          }

          const firstGoalWeekXPos = graphMovement + firstGoalWeek * WEEK_WIDTH;
          const scoreBoxLeft = SIDEBAR_WIDTH + PADDING_LEFT + 8;

          // Only start expanding when balls are very close to the score box
          const scoreboxProgress = interpolate(
            firstGoalWeekXPos,
            [scoreBoxLeft - 100, scoreBoxLeft + 20], // Fixed order: from far to close
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div key={name} style={{ position: 'absolute', top: laneTop, left: 0, width: '100%', height: playerLaneHeight }}>
              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT, top: '50%', width: width, borderTop: `12px dashed ${LANE_COLOR}` }} />

              <div style={{ position: 'absolute', left: (SIDEBAR_WIDTH + PADDING_LEFT - playerImageSize) / 2, top: '50%', transform: 'translateY(-50%)', height: playerImageSize, width: playerImageSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '8px solid whitesmoke' }}>
                <Img src={staticFile(`race-images/${imageMap[name]}`)} style={{ width: '100%', height: '100%' }} />
              </div>

              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING_LEFT + 8, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                {firstGoalWeek !== -1 && (
                  <ScoreBox
                    color={colorMap[name]}
                    progress={scoreboxProgress}
                    score={currentScore}
                    scoreChangeFrame={lastScoreChangeFrame}
                  />
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
} ;