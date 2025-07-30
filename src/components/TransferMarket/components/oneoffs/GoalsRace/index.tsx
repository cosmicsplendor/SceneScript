import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { ScoreBox } from './ScoreBox';

// --- Types (remain the same) ---
interface PlayerData { name: string; value: number; }
interface MatchDayData { date: string; data: PlayerData[]; }
interface GoalsRaceProps {
  data: MatchDayData[];
  playerImages: { [name: string]: string };
  playerColors: { [name: string]: string };
  ballImage: string;
}

// --- NEW Constants for accurate layout ---
const PLAYER_ROW_HEIGHT = 150;      // Total vertical space for one player
const PLAYER_IMAGE_SIZE = 100;      // Diameter of the player image
const SCORE_BOX_WIDTH = 110;
const SCORE_BOX_HEIGHT = 80;
const LEFT_PANE_WIDTH = 280;        // Width of the entire fixed left section
const GRAPH_AREA_START_X = LEFT_PANE_WIDTH; // Where the graph area begins
const HEADER_HEIGHT = 160;          // Space for the title
const WEEK_COLUMN_WIDTH = 250;      // Horizontal space per week
const BALL_SIZE = 35;
const VERTICAL_LINE_COLOR = 'black';
const HORIZONTAL_LINE_COLOR = 'rgba(0, 0, 0, 0.5)';

// Helper for ball positions (remains the same logic)
const getBallPositions = (numGoals: number, ballSize: number) => {
    // ... (same implementation as before)
  const positions: { top: number; left: number }[] = [];
  const getTopPosition = (offsetFromCenter: number) => PLAYER_ROW_HEIGHT / 2 + offsetFromCenter - ballSize / 2;
  switch (numGoals) { case 1: positions.push({ top: getTopPosition(0), left: 0 }); break; case 2: positions.push( { top: getTopPosition(-ballSize / 2), left: 0 }, { top: getTopPosition(ballSize / 2), left: 0 } ); break; case 3: positions.push( { top: getTopPosition(-ballSize * 0.7), left: 0 }, { top: getTopPosition(0), left: 0 }, { top: getTopPosition(ballSize * 0.7), left: 0 } ); break; case 4: positions.push( { top: getTopPosition(-ballSize / 2), left: -ballSize / 2 }, { top: getTopPosition(-ballSize / 2), left: ballSize / 2 }, { top: getTopPosition(ballSize / 2), left: -ballSize / 2 }, { top: getTopPosition(ballSize / 2), left: ballSize / 2 } ); break; default: for (let i = 0; i < numGoals; i++) { const totalStackHeight = (numGoals - 1) * ballSize * 0.8; const startYOffset = -totalStackHeight / 2; positions.push({ top: getTopPosition(startYOffset + i * ballSize * 0.8), left: 0 }); } break; }
  return positions;
};


export const GoalsRace: React.FC<GoalsRaceProps> = ({ data, playerImages, playerColors, ballImage }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const playerNames = data[0].data.map(p => p.name);

  const scoresByPlayer = playerNames.reduce((acc, name) => {
    acc[name] = [0, ...data.map(d => d.data.find(p => p.name === name)?.value || 0)];
    return acc;
  }, {} as Record<string, number[]>);

  const framesPerMatchDay = fps * 1.5;
  const totalMatchDays = data.length;
  const currentMatchDayIndex = Math.min(Math.floor(frame / framesPerMatchDay), totalMatchDays);
  const progressInCurrentMatchDay = (frame % framesPerMatchDay) / framesPerMatchDay;
  const timelineOffset = -currentMatchDayIndex * WEEK_COLUMN_WIDTH;
  const scrollX = interpolate(progressInCurrentMatchDay, [0, 1], [0, -WEEK_COLUMN_WIDTH], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ width, height, backgroundColor: '#305FE1', overflow: 'hidden', position: 'relative' }}>
      
      {/* --- 1. The Fixed Left Pane (Players and Scores) --- */}
      {/* This section does NOT move and sits on top of the graph */}
      <div style={{
        position: 'absolute',
        left: 0, top: HEADER_HEIGHT,
        width: LEFT_PANE_WIDTH,
        height: height - HEADER_HEIGHT,
        zIndex: 10, // High zIndex to be above the balls
      }}>
        {playerNames.map((playerName, index) => (
          <div key={playerName} style={{
            height: PLAYER_ROW_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 20,
          }}>
            <img src={staticFile(playerImages[playerName])} alt={playerName} style={{
              width: PLAYER_IMAGE_SIZE, height: PLAYER_IMAGE_SIZE,
              borderRadius: '50%', objectFit: 'cover',
              border: `5px solid white`,
            }} />
            <div style={{ marginLeft: 15 }}>
              <ScoreBox
                scores={scoresByPlayer[playerName]}
                color={playerColors[playerName]}
                frame={frame}
                framesPerMatchDay={framesPerMatchDay}
                scoreBoxWidth={SCORE_BOX_WIDTH}
                scoreBoxHeight={SCORE_BOX_HEIGHT}
              />
            </div>
          </div>
        ))}
      </div>

      {/* --- 2. The Moving Graph Area --- */}
      <div style={{
        position: 'absolute',
        left: GRAPH_AREA_START_X,
        top: 0, // Starts from the top to include WEEK labels
        width: width - GRAPH_AREA_START_X,
        height: height,
        zIndex: 5, // Sits below the left pane
      }}>
        {/* The WHITE vertical line that separates the panes */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: HEADER_HEIGHT,
          width: 6,
          height: height - HEADER_HEIGHT,
          backgroundColor: 'white',
          zIndex: 8, // Above timeline content but below left pane
        }} />

        {/* The scrolling container for weeks/balls */}
        <div style={{
          position: 'absolute',
          left: timelineOffset + scrollX,
          top: HEADER_HEIGHT, // Aligns with player rows
          height: height - HEADER_HEIGHT,
          display: 'flex',
        }}>
          {Array.from({ length: totalMatchDays + 1 }, (_, i) => {
            const matchDay = data[i - 1];
            if (!matchDay) return null;

            return (
              <div key={`week-${matchDay.date}`} style={{
                width: WEEK_COLUMN_WIDTH, height: '100%',
                position: 'relative', flexShrink: 0,
              }}>
                {/* Week Label (will be clipped by the white line) */}
                <div style={{
                  position: 'absolute',
                  top: -50, // Positioned above the player rows
                  left: 0,
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: 'white',
                  textTransform: 'uppercase',
                }}>
                  {matchDay.date}
                </div>
                
                {/* BLACK Vertical Line */}
                <div style={{
                  position: 'absolute',
                  left: WEEK_COLUMN_WIDTH / 2, // Centered in the column
                  top: 0,
                  width: 4,
                  height: '100%',
                  backgroundColor: VERTICAL_LINE_COLOR,
                }} />

                {/* Horizontal dotted lines and balls for each player */}
                {playerNames.map((playerName, playerIndex) => {
                   // CRITICAL FIX: Find the current player's data from the matchDay data
                   const playerGoalData = matchDay.data.find(p => p.name === playerName);
                   if (!playerGoalData) return null;
 
                   // Get goals for THIS specific match day
                   const currentTotal = playerGoalData.value;
                   const previousTotal = data[i - 2]?.data.find(p => p.name === playerName)?.value || 0;
                   const goalsThisMatchDay = currentTotal - previousTotal;
 
                   // Get ball positions relative to the row's center
                   const ballPositions = getBallPositions(goalsThisMatchDay, BALL_SIZE);
 
                  return (
                    <div key={`lane-${matchDay.date}-${playerName}`} style={{
                      position: 'absolute',
                      top: playerIndex * PLAYER_ROW_HEIGHT, // Position the lane at the top of the player's row
                      left: 0,
                      width: '100%',
                      height: PLAYER_ROW_HEIGHT,
                    }}>
                       {/* Dotted Horizontal Line (Now correctly centered) */}
                       <div style={{
                         position: 'absolute', top: '50%', left: 0,
                         width: '100%', height: 2, transform: 'translateY(-1px)',
                         borderTop: `3px dotted ${HORIZONTAL_LINE_COLOR}`,
                       }} />

                      {/* Render Balls */}
                      {ballPositions.map((pos, ballIdx) => (
                        <img
                          key={`ball-${matchDay.date}-${playerName}-${ballIdx}`}
                          src={staticFile(ballImage)} alt="goal" style={{
                            position: 'absolute',
                            width: BALL_SIZE, height: BALL_SIZE,
                            top: pos.top,
                            left: pos.left + (WEEK_COLUMN_WIDTH / 2) - (BALL_SIZE / 2),
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 3. Header Title --- */}
      <div style={{
        position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
        padding: '20px 40px', border: '5px solid white', borderRadius: '8px',
        fontSize: 45, fontWeight: 'bold', zIndex: 12, backgroundColor: '#305FE1',
        fontFamily: "'Oswald', sans-serif", letterSpacing: 2, color: 'white',
      }}>
        GOALS IN 2023
      </div>
    </div>
  );
};