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

const PADDING = 100; // Increased vertical padding
const TITLE_HEIGHT = 180; // Increased title area height
const SIDEBAR_WIDTH = 280;
const WEEK_WIDTH = 300;
const FRAMES_PER_WEEK = 60;
const BOTTOM_AREA_HEIGHT = 100; // More space at the bottom
const BALL_SIZE = 40;
const SCORE_BOX_WIDTH = 120;
const SCORE_BOX_HEIGHT = BALL_SIZE * 2.8; // Tall enough for 3 overlapping balls

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
        borderRadius: 0, // No border radius
        transform: `scaleX(${scaleUp})`,
        transformOrigin: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // Center the score text
      }}
    >
      <div
        style={{
          transform: `scale(${textScale})`,
          color: 'white',
          fontSize: 50, // Larger score font
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
      {/* --- Clipped Graph Area with different background --- */}
      <AbsoluteFill
        style={{
          left: SIDEBAR_WIDTH + PADDING,
          top: TITLE_HEIGHT,
          width: width - (SIDEBAR_WIDTH + PADDING),
          height: graphAreaHeight,
          overflow: 'hidden', // This is crucial for clipping
          backgroundColor: '#203387', // Slightly different color
        }}
      >
        {/* Container for all moving elements */}
        <div
          style={{
            position: 'absolute',
            left: graphMovement - (SIDEBAR_WIDTH + PADDING),
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
              <div style={{ position: 'absolute', left: '50%', top: 0, width: 8, height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', transform: 'translateX(-50%)' }} />
              {/* Week Label */}
              <div style={{ position: 'absolute', top: 10, width: '100%', textAlign: 'center', color: 'white', fontSize: 28, fontWeight: '500' }}>{week.date}</div>

              {/* Goal Balls */}
              {week.data.map((player) => {
                const playerIndex = playerNames.indexOf(player.name);
                if (playerIndex === -1) return null;
                const laneTop = playerIndex * playerLaneHeight;
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
        <div style={{ position: 'absolute', top: PADDING / 2, left: PADDING, right: PADDING, height: TITLE_HEIGHT - PADDING, border: '5px solid white', borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 60, fontWeight: 'bold' }}>
          GOALS IN {year}
        </div>

        <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING, top: TITLE_HEIGHT, bottom: BOTTOM_AREA_HEIGHT, width: 8, backgroundColor: 'white' }} />
        <div style={{ position: 'absolute', left: 0, top: height - BOTTOM_AREA_HEIGHT, right: 0, height: 8, backgroundColor: 'white' }} />

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

          const scoreboxProgress = interpolate(
            firstGoalWeekXPos,
            [SIDEBAR_WIDTH + PADDING, SIDEBAR_WIDTH + PADDING + 150],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div key={name} style={{ position: 'absolute', top: laneTop, left: 0, width: '100%', height: playerLaneHeight }}>
              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING, top: '50%', width: width, borderTop: '6px dashed rgba(255, 255, 255, 0.2)' }} />
              
              <div style={{ position: 'absolute', left: (SIDEBAR_WIDTH + PADDING - playerImageSize) / 2, top: '50%', transform: 'translateY(-50%)', height: playerImageSize, width: playerImageSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '5px solid white' }}>
                <Img src={staticFile(`race-images/${imageMap[name]}`)} style={{ width: '100%', height: '100%' }} />
              </div>

              <div style={{ position: 'absolute', left: SIDEBAR_WIDTH + PADDING + 8, top: '50%', transform: 'translateY(-50%)', zIndex: 5 /* Above graph but can be below other UI if needed */ }}>
                {firstGoalWeek !== -1 && (
                  <ScoreBox color={colorMap[name]} progress={scoreboxProgress} score={currentScore} />
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};