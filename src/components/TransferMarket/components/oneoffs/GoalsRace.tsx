import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring, staticFile } from 'remotion';

// --- Types for data and configuration ---
interface PlayerGoals {
  name: string;
  goals: number; // Goals scored in this specific week
}

interface WeekData {
  weekNumber: number; // e.g., 1, 2, ... 52
  players: PlayerGoals[];
}

interface GoalsIn2023Props {
  data: WeekData[];
  playerImages: { [name: string]: string }; // e.g., { 'Mbappe': 'mbappe.png' }
  playerColors: { [name: string]: string }; // e.g., { 'Mbappe': 'green' }
  ballImage: string; // e.g., 'ball.png' (path relative to public folder)
}

// --- Constants for layout and sizing ---
const PLAYER_HEIGHT = 160; // Vertical space allocated for each player row
const PLAYER_IMAGE_SIZE = 120; // Diameter of player circular images
const SCORE_BOX_WIDTH = 180;
const SCORE_BOX_HEIGHT = 100; // Height of the score number box
const GRID_LINE_WIDTH = 4; // Thickness of the vertical week lines
const WEEK_COLUMN_WIDTH = 300; // Horizontal space allocated for each week's column in the timeline
const BALL_SIZE = 40; // Diameter of a single soccer ball image
const LEFT_COLUMN_WIDTH = 280; // Total width of the fixed left column (player images + padding)
const HEADER_HEIGHT = 150; // Height of the "GOALS IN 2023" title section

// --- Helper function for positioning multiple balls ---
const getBallPositions = (numGoals: number, playerIndex: number, ballSize: number, scoreBoxHeight: number) => {
  const positions: { top: number; left: number }[] = [];
  // Calculate the vertical center of the player's score box/lane
  // This is used as a reference point for placing balls symmetrically
  const centerOfLaneY = playerIndex * PLAYER_HEIGHT + HEADER_HEIGHT + (PLAYER_HEIGHT - scoreBoxHeight) / 2 + scoreBoxHeight / 2;

  // Helper to get the top CSS value for a ball based on its vertical offset from the lane center
  const getTopPosition = (offsetFromCenter: number) => centerOfLaneY + offsetFromCenter - ballSize / 2;

  switch (numGoals) {
    case 1:
      positions.push({ top: getTopPosition(0), left: 0 }); // Centered
      break;
    case 2:
      positions.push(
        { top: getTopPosition(-ballSize / 2), left: 0 }, // Top ball
        { top: getTopPosition(ballSize / 2), left: 0 }   // Bottom ball
      );
      break;
    case 3:
      // Vertical stacking with slight overlap
      positions.push(
        { top: getTopPosition(-ballSize * 0.7), left: 0 }, // Top
        { top: getTopPosition(0), left: 0 },               // Middle
        { top: getTopPosition(ballSize * 0.7), left: 0 }   // Bottom
      );
      break;
    case 4:
      // 2x2 grid arrangement
      positions.push(
        { top: getTopPosition(-ballSize / 2), left: -ballSize / 2 }, // Top-left
        { top: getTopPosition(-ballSize / 2), left: ballSize / 2 },  // Top-right
        { top: getTopPosition(ballSize / 2), left: -ballSize / 2 },  // Bottom-left
        { top: getTopPosition(ballSize / 2), left: ballSize / 2 }   // Bottom-right
      );
      break;
    default:
      // For more than 4 goals (or unexpected numbers), stack them vertically with slight overlap
      // This is a generic fall-back, adjust as needed for specific layouts if >4 goals are common
      for (let i = 0; i < numGoals; i++) {
        const totalStackHeight = (numGoals - 1) * ballSize * 0.8; // Example overlap
        const startYOffset = -totalStackHeight / 2;
        positions.push({ top: getTopPosition(startYOffset + i * ballSize * 0.8), left: 0 });
      }
      break;
  }
  return positions;
};


export const GoalsIn2023: React.FC<GoalsIn2023Props> = ({ data, playerImages, playerColors, ballImage }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Determine player names once from the first week's data to ensure consistent order
  const playerNames = data[0].players.map(p => p.name);

  // Calculate cumulative goals for each player across all weeks
  // This array will store scores like: [0, week1_total, week2_total, ..., final_total]
  const cumulativeGoals: { [playerName: string]: number[] } = {};
  playerNames.forEach(name => cumulativeGoals[name] = [0]); // Initialize with 0 goals at week 0

  data.forEach(weekData => {
    playerNames.forEach(playerName => {
      const playerGoalsThisWeek = weekData.players.find(p => p.name === playerName)?.goals || 0;
      const prevTotal = cumulativeGoals[playerName][cumulativeGoals[playerName].length - 1];
      cumulativeGoals[playerName].push(prevTotal + playerGoalsThisWeek);
    });
  });

  // Animation timing parameters
  const framesPerWeek = fps * 1.5; // Each week's transition animation lasts 1.5 seconds
  const totalWeeks = data.length;

  // Determine the current "week index" being animated
  // It goes from 0 (before Week 1) up to totalWeeks (after last week's goals are counted)
  const currentWeekIndex = Math.min(Math.floor(frame / framesPerWeek), totalWeeks);

  // Progress within the current week's 0-1 transition
  const progressInCurrentWeek = (frame % framesPerWeek) / framesPerWeek;

  // Calculate the overall timeline scroll offset for week columns
  // This ensures the timeline shifts left as weeks pass
  const timelineOffset = -currentWeekIndex * WEEK_COLUMN_WIDTH;
  const scrollX = interpolate(progressInCurrentWeek, [0, 1], [0, -WEEK_COLUMN_WIDTH], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      width,
      height,
      backgroundColor: '#2654d2', // Deep blue background, matching screenshot
      fontFamily: 'Roboto, sans-serif', // Using Roboto for a clean, modern look
      color: 'white',
      overflow: 'hidden', // Essential for clipping moving elements
      position: 'relative',
    }}>
      {/* Header: "GOALS IN 2023" Title */}
      <div style={{
        position: 'absolute',
        top: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '20px 40px',
        border: '4px solid white',
        borderRadius: '8px',
        fontSize: 50,
        fontWeight: 'bold',
        zIndex: 10, // High z-index to stay on top
        backgroundColor: '#2654d2', // Match background to prevent showing through
        whiteSpace: 'nowrap', // Prevent text wrapping
      }}>
        GOALS IN 2023
      </div>

      {/* Player Section: Fixed Left Column (Player Images) */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: HEADER_HEIGHT,
        width: LEFT_COLUMN_WIDTH,
        height: height - HEADER_HEIGHT,
        backgroundColor: '#2654d2', // Same background color, acts as a clipping mask
        zIndex: 8, // Above timeline and score boxes
      }}>
        {playerNames.map((playerName, index) => (
          <div key={playerName} style={{
            display: 'flex',
            alignItems: 'center',
            height: PLAYER_HEIGHT,
            paddingLeft: 20, // Padding for the player images
            boxSizing: 'border-box',
          }}>
            <img
              src={staticFile(playerImages[playerName])} // Load player image from public folder
              alt={playerName}
              style={{
                width: PLAYER_IMAGE_SIZE,
                height: PLAYER_IMAGE_SIZE,
                borderRadius: '50%', // Make image circular
                objectFit: 'cover',
                border: `4px solid ${playerColors[playerName]}`, // Player-specific border color
              }}
            />
          </div>
        ))}
      </div>

      {/* Score Boxes: Fixed position, to the right of player images */}
      <div style={{
        position: 'absolute',
        left: LEFT_COLUMN_WIDTH, // Starts where player images column ends
        top: HEADER_HEIGHT,
        height: height - HEADER_HEIGHT,
        zIndex: 7, // Above timeline, below player column
      }}>
        {playerNames.map((playerName, index) => {
          // Get the score before the current week's goals are added
          const scoreBeforeTransition = cumulativeGoals[playerName][currentWeekIndex];
          // Get the score after the current week's goals are added
          // If it's the very last week, the score stays at the final total
          const scoreAfterTransition = cumulativeGoals[playerName][currentWeekIndex + 1] || scoreBeforeTransition;

          // Animate the score count-up using Remotion's spring function
          const scoreSpringValue = spring({
            frame: frame - currentWeekIndex * framesPerWeek, // Frame relative to the start of this week's animation
            fps,
            config: {
              damping: 200, // Controls "bounciness"
              stiffness: 1000, // Controls speed
              mass: 0.5, // Controls inertia
            },
            from: scoreBeforeTransition,
            to: scoreAfterTransition,
          });

          // Display the animated integer score
          const displayedScore = Math.floor(scoreSpringValue);

          return (
            <div key={`score-${playerName}`} style={{
              position: 'absolute',
              top: index * PLAYER_HEIGHT + (PLAYER_HEIGHT - SCORE_BOX_HEIGHT) / 2, // Vertically center in its lane
              left: 0, // Positioned at the left edge of this container
              width: SCORE_BOX_WIDTH,
              height: SCORE_BOX_HEIGHT,
              backgroundColor: playerColors[playerName], // Player-specific box color
              borderRadius: 10, // Rounded corners for the box
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 60,
              fontWeight: 'bold',
            }}>
              {displayedScore}
            </div>
          );
        })}
      </div>

      {/* Timeline/Grid Section: Moves from right to left */}
      <div style={{
        position: 'absolute',
        left: LEFT_COLUMN_WIDTH + SCORE_BOX_WIDTH, // Starts after player images and score boxes
        top: HEADER_HEIGHT,
        height: height - HEADER_HEIGHT,
        width: width - (LEFT_COLUMN_WIDTH + SCORE_BOX_WIDTH), // Remaining width for the timeline
        overflow: 'hidden', // Clips balls as they pass beyond the left edge
        zIndex: 4, // Below player section and score boxes
      }}>
        <div style={{
          position: 'absolute',
          left: timelineOffset + scrollX, // Apply overall scroll and smooth transition
          height: '100%',
          display: 'flex', // Arrange week columns horizontally
          whiteSpace: 'nowrap', // Prevents week columns from wrapping to the next line
        }}>
          {/* Render enough weeks to fill the screen and transition smoothly */}
          {/* We render totalWeeks + 1 because cumulativeGoals has totalWeeks + 1 entries.
              The index 'i' here corresponds to the week's position in the timeline. */}
          {Array.from({ length: totalWeeks + 2 }, (_, i) => {
            const weekIdx = i; // This index corresponds to the week's position (0 for "before week 1", 1 for Week 1, etc.)
            const weekData = data[weekIdx - 1]; // Get actual week data (data array is 0-indexed for week 1, etc.)

            // Optimization: Only render weeks that are currently visible or about to be visible
            const isRelevant = weekIdx >= currentWeekIndex - 1 && weekIdx <= currentWeekIndex + Math.ceil(width / WEEK_COLUMN_WIDTH) + 1;

            if (!isRelevant || !weekData) {
              // For weekIdx 0 (the initial state before Week 1 starts),
              // we still need the column for the vertical line if it's the first one,
              // but no weekData exists, so we return a placeholder div
              if (weekIdx === 0 && currentWeekIndex === 0) {
                 return (
                    <div key={`week-placeholder-${weekIdx}`} style={{ width: WEEK_COLUMN_WIDTH, flexShrink: 0, height: '100%' }}></div>
                 );
              }
              return null;
            }

            return (
              <div key={`week-${weekData.weekNumber}`} style={{
                width: WEEK_COLUMN_WIDTH,
                height: '100%',
                position: 'relative',
                // Vertical line for weeks (except the very first one)
                borderLeft: weekIdx > 0 ? `${GRID_LINE_WIDTH}px solid rgba(255, 255, 255, 0.2)` : 'none',
                boxSizing: 'border-box',
                flexShrink: 0, // Prevent column from shrinking
              }}>
                {/* Week Number (positioned relative to its column) */}
                <div style={{
                  position: 'absolute',
                  top: -60, // Positioned above the grid lines
                  left: 0,
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: 'white',
                  // Adjust text position to be centered above the vertical line
                  transform: `translateX(${GRID_LINE_WIDTH / 2}px)`,
                }}>
                  {`WEEK ${weekData.weekNumber}`}
                </div>

                {/* Horizontal Dotted Lines (Lanes for each player) */}
                {playerNames.map((playerName, playerIndex) => (
                  <div key={`lane-${weekData.weekNumber}-${playerName}`} style={{
                    position: 'absolute',
                    top: playerIndex * PLAYER_HEIGHT + PLAYER_HEIGHT / 2, // Center of the player lane
                    left: 0,
                    width: '100%',
                    height: 2,
                    borderTop: '2px dotted rgba(255, 255, 255, 0.5)', // Dotted line style
                  }} />
                ))}

                {/* Balls for this specific week */}
                {weekData.players.map((playerGoal, playerIndex) => {
                  if (playerGoal.goals === 0) return null; // Don't render if no goals

                  const ballPositions = getBallPositions(
                    playerGoal.goals,
                    playerIndex,
                    BALL_SIZE,
                    SCORE_BOX_HEIGHT
                  );

                  return (
                    <React.Fragment key={`balls-${weekData.weekNumber}-${playerGoal.name}`}>
                      {ballPositions.map((pos, ballIdx) => (
                        <img
                          key={`ball-${weekData.weekNumber}-${playerGoal.name}-${ballIdx}`}
                          src={staticFile(ballImage)}
                          alt="goal ball"
                          style={{
                            position: 'absolute',
                            width: BALL_SIZE,
                            height: BALL_SIZE,
                            top: pos.top,
                            // Position balls centered within their week column relative to its vertical line
                            left: pos.left + (WEEK_COLUMN_WIDTH / 2) - (BALL_SIZE / 2),
                          }}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom text overlays (e.g., "ALL CHAMPIONS LEAGUE", music info) */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        left: 20,
        fontSize: 30,
        zIndex: 10,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{ marginRight: 10, fontSize: 40, lineHeight: '1' }}>▶</span> ALL CHAMPIONS LEAGUE
      </div>
      <div style={{
        position: 'absolute',
        bottom: 50,
        left: 20,
        fontSize: 30,
        zIndex: 10,
        color: 'white',
      }}>
        TOP GOALSCORERS IN 2023
      </div>
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 20,
        fontSize: 24,
        zIndex: 10,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{ marginRight: 10, fontSize: 30, lineHeight: '1' }}>🎵</span> City · lofi'chield
      </div>
    </div>
  );
};