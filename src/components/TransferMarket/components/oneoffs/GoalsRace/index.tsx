import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Sequence,
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

type SampleData = z.infer<typeof mySchema>;

// -- Animation Constants -- //

const PADDING = 60;
const TITLE_HEIGHT = 160;
const SIDEBAR_WIDTH = 280;
const WEEK_WIDTH = 300; // Distance between each vertical week line
const FRAMES_PER_WEEK = 60; // Animation duration for one week to pass

// -- Helper Components -- //

const GoalBalls: React.FC<{ count: number }> = ({ count }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const balls = Array(count).fill(true);
  const ballSize = 40;

  const springIn = spring({
    fps,
    frame,
    config: { stiffness: 100, damping: 10 },
    durationInFrames: 30,
  });

  if (count === 0) return null;

  // Simple vertical stacking, centered
  const totalHeight = balls.length * ballSize * 0.8;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
        display: 'flex',
        flexDirection: 'column',
        gap: -10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {balls.map((_, i) => (
        <Img
          key={i}
          src={goalImage}
          style={{ width: ballSize, height: ballSize }}
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
    frame: progress * 30, // Trigger spring based on progress
    config: { mass: 0.8, stiffness: 100, damping: 12 },
  });

  const textScale = spring({
    fps,
    frame: progress * 30 - 5, // A slight delay for the text
    config: { stiffness: 200, damping: 10 },
  });

  return (
    <div
      style={{
        backgroundColor: color,
        width: 120,
        height: 70,
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

  // Calculate total duration based on data points
  const durationInFrames = (data.length + 2) * FRAMES_PER_WEEK;

  // Calculate position of the moving graph area
  const graphMovement = interpolate(
    frame,
    [0, durationInFrames],
    [width, width - (data.length + 1) * WEEK_WIDTH]
  );

  const playerLaneHeight =
    (height - TITLE_HEIGHT - PADDING * 2) / numPlayers;

  // Pre-process data to calculate new goals per week
  const processedData = data.map((weekData, weekIndex) => {
    return {
      ...weekData,
      data: weekData.data.map((playerData) => {
        const prevWeekValue =
          weekIndex > 0 ? data[weekIndex - 1].data.find(p => p.name === playerData.name)?.value ?? 0 : 0;
        return {
          ...playerData,
          newGoals: playerData.value - prevWeekValue,
        };
      }),
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a2b6d' }}>
      {/* --- Lower Layer: Moving Graph --- */}
      <div
        style={{
          position: 'absolute',
          left: graphMovement,
          top: TITLE_HEIGHT,
          height: height - TITLE_HEIGHT,
        }}
      >
        {processedData.map((week, i) => (
          <div
            key={week.date}
            style={{
              position: 'absolute',
              left: i * WEEK_WIDTH,
              height: '100%',
            }}
          >
            {/* Vertical Week Line */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                width: 8,
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.8)',
                transform: 'translateX(-50%)',
              }}
            />
            {/* Week Label */}
            <div
              style={{
                position: 'absolute',
                top: -40,
                width: '100%',
                textAlign: 'center',
                color: 'white',
                fontSize: 28,
                fontWeight: '500',
              }}
            >
              {week.date}
            </div>
            {/* Goals for each player in this week */}
            {week.data.map((player) => {
              const playerIndex = playerNames.indexOf(player.name);
              const laneTop = playerIndex * playerLaneHeight;
              return (
                <div
                  key={player.name}
                  style={{
                    position: 'absolute',
                    top: laneTop,
                    height: playerLaneHeight,
                    width: WEEK_WIDTH,
                  }}
                >
                  <GoalBalls count={player.newGoals} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* --- Upper Layer: Static Frame and UI --- */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {/* Background for Sidebar and Top Area */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: SIDEBAR_WIDTH + PADDING,
            height: height,
            background: 'linear-gradient(to bottom, #1a2b6d, #122056)',
            clipPath: `polygon(0 0, ${width} 0, ${width} ${TITLE_HEIGHT - 20
              }, ${SIDEBAR_WIDTH + PADDING} ${TITLE_HEIGHT - 20
              }, ${SIDEBAR_WIDTH + PADDING} ${height}, 0 ${height})`,
          }}
        />

        {/* Title */}
        <div
          style={{
            position: 'absolute',
            top: PADDING,
            left: PADDING,
            right: PADDING,
            height: TITLE_HEIGHT - PADDING * 1.5,
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

        {/* Main Axes */}
        <div
          style={{
            position: 'absolute',
            left: SIDEBAR_WIDTH + PADDING,
            top: TITLE_HEIGHT - 20,
            bottom: 0,
            width: 8,
            backgroundColor: 'white',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: SIDEBAR_WIDTH + PADDING,
            top: TITLE_HEIGHT - 20,
            right: 0,
            height: 8,
            backgroundColor: 'white',
          }}
        />

        {/* Player Lanes UI */}
        {playerNames.map((name, i) => {
          const laneTop = TITLE_HEIGHT + i * playerLaneHeight;

          // Find the current cumulative score for this player
          let currentScore = 0;
          let firstGoalWeek = -1;

          for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
            const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;
            if (weekXPosition < SIDEBAR_WIDTH + PADDING + 120) {
              currentScore = data[weekIdx].data.find(p => p.name === name)?.value ?? 0;
            }
            if (
              firstGoalWeek === -1 &&
              ((data[weekIdx].data.find(p => p.name === name)?.value ?? 0) > 0)
            ) {
              firstGoalWeek = weekIdx;
            }
          }

          // Animate ScoreBox opening
          const firstGoalWeekXPos = graphMovement + firstGoalWeek * WEEK_WIDTH;
          const scoreboxProgress = interpolate(
            firstGoalWeekXPos,
            [SIDEBAR_WIDTH + PADDING + 50, SIDEBAR_WIDTH + PADDING + 200],
            [0, 1],
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
              {/* Dotted Line */}
              <div
                style={{
                  position: 'absolute',
                  left: SIDEBAR_WIDTH,
                  top: '50%',
                  width: width,
                  borderTop: '4px dotted rgba(255, 255, 255, 0.2)',
                }}
              />
              {/* Player Image */}
              <div
                style={{
                  position: 'absolute',
                  left: 30,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: playerLaneHeight * 0.7,
                  width: playerLaneHeight * 0.7,
                  borderRadius: '50%',
                  backgroundColor: colorMap[name],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '5px solid white',
                }}
              >
                <Img
                  src={staticFile(`race-images/${imageMap[name]}`)}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              {/* Score Box */}
              <div
                style={{
                  position: 'absolute',
                  left: SIDEBAR_WIDTH + PADDING - 120, // Align right edge with axis
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
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