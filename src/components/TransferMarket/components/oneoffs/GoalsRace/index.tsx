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
const year = 2024;

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

const PADDING = 80; // More room at the top
const TITLE_HEIGHT = 160;
const SIDEBAR_WIDTH = 280;
const WEEK_WIDTH = 300;
const FRAMES_PER_WEEK = 60;
const BOTTOM_AREA_HEIGHT = 80; // Space at the very bottom
const BALL_SIZE = 40;
const SCORE_BOX_WIDTH = 120;
// Make box tall enough to cover a 2x2 grid or 3 stacked balls
const SCORE_BOX_HEIGHT = BALL_SIZE * 2.5;


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
        // Use flex-wrap for 2x2 grid
        flexWrap: isFourGoals ? 'wrap' : 'nowrap',
        flexDirection: isFourGoals ? 'row' : 'column',
        width: isFourGoals ? BALL_SIZE * 2 + 5 : BALL_SIZE,
        gap: isFourGoals ? 5 : -10,
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
}> = ({ color, progress, score }) => {
  const { fps } = useVideoConfig();

  const scaleUp = spring({
    fps,
    frame: progress * 30,
    config: { mass: 0.8, stiffness: 100, damping: 12 },
  });

  const textScale = spring({
    fps,
    frame: progress * 30 - 5,
    config: { stiffness: 200, damping: 10 },
  });

  return (
    <div
      style={{
        backgroundColor: color,
        width: SCORE_BOX_WIDTH,
        height: SCORE_BOX_HEIGHT,
        borderRadius: 15,
        transform: `scaleX(${scaleUp})`,
        transformOrigin: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 20,
      }}
    >
      <div
        style={{
          transform: `scale(${textScale})`,
          color: 'white',
          fontSize: 40,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
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

  // Correctly calculate graph area height
  const graphAreaHeight = height - TITLE_HEIGHT - BOTTOM_AREA_HEIGHT;
  const playerLaneHeight = graphAreaHeight / numPlayers;

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
      {/* --- Layer 1: Moving Goal Balls (Underneath UI) --- */}
      <div
        style={{
          position: 'absolute',
          left: graphMovement,
          top: TITLE_HEIGHT,
          height: graphAreaHeight,
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
            {week.data.map((player) => {
              const playerIndex = playerNames.indexOf(player.name);
              if (playerIndex === -1) return null;
              const laneTop = playerIndex * playerLaneHeight;
              return (
                <div
                  key={player.name}
                  style={{
                    position: 'absolute',
                    top: laneTop,
                    height: playerLaneHeight,
                    width: '100%',
                  }}
                >
                  <GoalBalls count={player.newGoals} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* --- Layer 2: UI Overlay (Axes, Text, Avatars, Score Boxes) --- */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: PADDING,
            left: PADDING,
            right: PADDING,
            height: TITLE_HEIGHT - PADDING * 0.8, // Adjusted for padding
            border: '5px solid white',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: 60,
            fontWeight: 'bold',
          }}
        >
          GOALS IN {year}
        </div>

        {/* Main Axes - Correctly positioned */}
        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING, top: TITLE_HEIGHT, bottom: BOTTOM_AREA_HEIGHT, width: 8, backgroundColor: 'white' }} />
        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING, top: height - BOTTOM_AREA_HEIGHT, right: 0, height: 8, backgroundColor: 'white' }} />

        {/* Moving Week Lines & Labels (On top layer to be visible) */}
         <div style={{ position: 'absolute', left: graphMovement, top: TITLE_HEIGHT, height: graphAreaHeight }}>
             {processedData.map((week, i) => (
                <div key={week.date} style={{position: 'absolute', left: i * WEEK_WIDTH, height: '100%', width: WEEK_WIDTH}}>
                     <div style={{position: 'absolute', left: '50%', top: 0, width: 8, height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', transform: 'translateX(-50%)', zIndex: -1 }} />
                     <div style={{position: 'absolute', top: 10, width: '100%', textAlign: 'center', color: 'white', fontSize: 28, fontWeight: '500' }}>{week.date}</div>
                </div>
             ))}
        </div>

        {/* Player Lanes UI */}
        {playerNames.map((name, i) => {
          const laneTop = TITLE_HEIGHT + i * playerLaneHeight;
          const playerImageSize = playerLaneHeight * 0.7;

          let currentScore = 0;
          let firstGoalWeek = -1;

          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;
            if (weekXPosition < SIDEBAR_WIDTH + PADDING + SCORE_BOX_WIDTH) {
              currentScore = data[weekIdx].data.find(p => p.name === name)?.value ?? currentScore;
            }
            if (firstGoalWeek === -1 && (data[weekIdx].data.find(p => p.name === name)?.value ?? 0) > 0) {
              firstGoalWeek = weekIdx;
            }
          }

          const firstGoalWeekXPos = graphMovement + firstGoalWeek * WEEK_WIDTH;

          // **FIXED INTERPOLATION**
          // inputRange is now monotonically increasing
          // outputRange is reversed to create expansion as the X position decreases.
          const scoreboxProgress = interpolate(
            firstGoalWeekXPos,
            [SIDEBAR_WIDTH + PADDING, SIDEBAR_WIDTH + PADDING + 150],
            [1, 0], // As X decreases from 490 to 340, output goes from 0 to 1.
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div key={name} style={{ position: 'absolute', top: laneTop, left: 0, width: '100%', height: playerLaneHeight }}>
              {/* Thicker, dashed line */}
              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING, top: '50%', width: width, borderTop: '6px dashed rgba(255, 255, 255, 0.2)' }} />
              
              <div style={{ position: 'absolute', left: (SIDEBAR_WIDTH + PADDING - playerImageSize) / 2, top: '50%', transform: 'translateY(-50%)', height: playerImageSize, width: playerImageSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '5px solid white' }}>
                <Img src={staticFile(`race-images/${imageMap[name]}`)} style={{ width: '100%', height: '100%' }} />
              </div>

              {/* Score Box on the right, appears and expands */}
              <div
                style={{
                  position: 'absolute',
                  left: SIDEBAR_WIDTH + PADDING + 8, // Positioned to the right of the Y-axis
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10, // Ensure it's above the balls
                }}
              >
                {firstGoalWeek !== -1 && (
                  <ScoreBox
                    color={colorMap[name]}
                    progress={scoreboxProgress}
                    score={currentScore}
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