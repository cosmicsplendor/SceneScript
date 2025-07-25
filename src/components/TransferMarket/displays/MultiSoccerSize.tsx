import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  AbsoluteFill,
  Img,
  interpolate,
  Easing,
} from 'remotion';

// --- NEW INTERFACES ---

/**
 * Represents the data for a single player.
 */
interface PlayerInfo {
  name: string;
  position: { x: number; z: number };
  baseScale: number;
}

/**
* Represents a player's score at a specific data step.
*/
interface PlayerData {
  name: string;
  value: number;
}

/**
 * Represents a single step in the data sequence.
 */
interface DataStep {
  date: string;
  data: PlayerData[];
}

/**
 * Represents the properties for the MultiSoccerSize component.
 */
interface MultiSoccerSizeProps {
  players: PlayerInfo[];
  data: DataStep[];
  scaleMultiplier?: number;
  backgroundUrl?: string;
  horizonLine?: number;
  worldDepth?: number;
  farScale?: number;
  stepDuration?: number;
  trophySpeed?: number;
  celebrationDuration?: number;
  basePlayerHeight?: number;
  metricGraphicPath?: (value: number) => string;
}

// --- UTILITY FUNCTIONS ---
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;


// --- COMPONENT ---

const MultiSoccerSize: React.FC<MultiSoccerSizeProps> = ({
  players=[
    { name: 'Ronaldo', position: { x: 100, z: 100 }, baseScale: 30 },
    { name: 'Messi', position: { x: 1000, z: 100 }, baseScale: 30 }
  ],
  data=[{"date":"2006","data":[{"name":"Ronaldo","value":1},{"name":"Messi","value":1}]},{"date":"2010","data":[{"name":"Ronaldo","value":2},{"name":"Messi","value":1}]},{"date":"2014","data":[{"name":"Ronaldo","value":3},{"name":"Messi","value":5}]},{"date":"2018","data":[{"name":"Ronaldo","value":7},{"name":"Messi","value":6},{"name":"Mbappe","value":4}]},{"date":"2022","data":[{"name":"Ronaldo","value":8},{"name":"Messi","value":13},{"name":"Mbappe","value":12}]}],
  scaleMultiplier = 0.05,
  backgroundUrl = staticFile('images/stadium_bg.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  stepDuration = 2.0,
  trophySpeed = 1.0,
  celebrationDuration = 1.5,
  basePlayerHeight = 20,
  // metricGraphicPath = (value) => staticFile(`metrics/metricValue${value}.png`),
  metricGraphicPath = (value) => staticFile(`metrics/trophy.png`),
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // --- TIMING ---
  const mainStartTime = 1.0; // Start after a 1-second intro/buffer
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = mainStartTime + totalMainDuration;
  const isMain = timeInSeconds >= mainStartTime && timeInSeconds < mainEndTime;

  // --- MEMOIZED CALCULATIONS ---

  const currentValues = useMemo(() => {
    if (!isMain) {
      // Before the main animation, all player values are 0
      return players.map(p => ({ ...p, currentValue: 0, increment: 0 }));
    }

    const mainTime = timeInSeconds - mainStartTime;
    const currentStepIndex = Math.floor(mainTime / stepDuration);
    const prevStepIndex = currentStepIndex - 1;

    const currentDataStep = data[currentStepIndex];
    const prevDataStep = prevStepIndex >= 0 ? data[prevStepIndex] : null;

    return players.map(player => {
      const currentValue = currentDataStep.data.find(d => d.name === player.name)?.value || 0;
      const prevValue = prevDataStep?.data.find(d => d.name === player.name)?.value || 0;
      const increment = currentValue - prevValue;

      return {
        ...player,
        currentValue,
        increment,
      };
    });
  }, [isMain, timeInSeconds, mainStartTime, stepDuration, data, players]);

  const dateInfo = useMemo(() => {
    if (!isMain) return { currentDate: 'Getting Ready...', stepTime: 0 };
    const mainTime = timeInSeconds - mainStartTime;
    const currentStepIndex = Math.floor(mainTime / stepDuration);
    const stepTime = mainTime % stepDuration;
    return {
      currentDate: data[currentStepIndex].date,
      stepTime,
    };
  }, [isMain, timeInSeconds, mainStartTime, stepDuration, data]);

  // --- 2.5D PROJECTION ---
  const project2D5 = (x: number, z: number) => {
    const zProgress = Math.min(z / worldDepth, 1);
    const scale = lerp(1, farScale, zProgress);
    const startY = height;
    const endY = height * horizonLine;
    const y = lerp(startY, endY, zProgress);
    return { x: width / 2 + (x - width / 2) * scale, y: y, scale };
  };


  // --- RENDER ---

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Background */}
      <Img src={backgroundUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Date Display */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          position: 'absolute',
          top: '5%',
          fontSize: '4em',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
        }}>
          {dateInfo.currentDate}
        </div>
      </AbsoluteFill>

      {/* Players */}
      {currentValues.map((player) => {
        const proj = project2D5(player.position.x, player.position.z);
        const dynamicScale = 1 + player.currentValue * scaleMultiplier;
        const totalScale = proj.scale * player.baseScale * dynamicScale;
        const playerImage = staticFile(`images/${player.name.toLowerCase()}.png`);

        return (
          <div
            key={player.name}
            style={{
              position: 'absolute',
              left: proj.x,
              top: proj.y,
              transform: `translateX(-50%) translateY(-100%) scale(${totalScale})`,
              transformOrigin: 'bottom center',
              zIndex: Math.round(player.position.z),
              height: `${basePlayerHeight}px`,
            }}
          >
            <Img
              src={playerImage}
              alt={player.name}
              style={{
                display: 'block',
                height: '100%',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        );
      })}

      {/* Value Increment Animations */}
      {currentValues.map((player) => {
        if (!isMain || player.increment <= 0) return null;

        const trophyProgress = Math.min(dateInfo.stepTime / trophySpeed, 1);
        const targetProj = project2D5(player.position.x, player.position.z);

        // Animate the metric graphic from a starting point to the player
        const startX = targetProj.x + (Math.random() - 0.5) * 200; // Randomize start
        const startZ = 0;
        const currentX = lerp(startX, targetProj.x, trophyProgress);
        const currentZ = lerp(startZ, player.position.z, trophyProgress);
        const animProj = project2D5(currentX, currentZ);

        // Pop-up animation for the "+N" text
        const popupProgress = Math.min(Math.max(0, (dateInfo.stepTime - trophySpeed) / celebrationDuration), 1);
        const popUpScale = 1 + Math.sin(popupProgress * Math.PI) * 0.4;

        return (
          <React.Fragment key={`${player.name}-increment`}>
            {/* Metric Graphic */}
            {trophyProgress < 1 && (
              <div style={{
                position: 'absolute',
                left: animProj.x,
                top: animProj.y,
                transform: `translateX(-50%) translateY(-50%) scale(${animProj.scale})`,
                zIndex: 999,
              }}>
                <Img src={metricGraphicPath(player.increment)} style={{ width: '100px', height: 'auto' }} />
              </div>
            )}

            {/* "+N" Text */}
            {popupProgress > 0 && popupProgress < 1 && (
              <div style={{
                position: 'absolute',
                left: targetProj.x,
                top: targetProj.y - 150, // Start above the player
                transform: `translateX(-50%) translateY(${-popupProgress * 80}px) scale(${popUpScale})`,
                fontSize: '8em',
                fontWeight: 'bold',
                color: '#28a745', // Green color
                textShadow: '3px 3px 0px #000, 0 0 15px #28a745',
                opacity: 1 - popupProgress,
                zIndex: 1000,
              }}>
                +{player.increment}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export default MultiSoccerSize;