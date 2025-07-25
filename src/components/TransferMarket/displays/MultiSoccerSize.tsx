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

// --- UPDATED INTERFACES ---

/**
 * Represents the data for a single player, including animation properties.
 */
interface PlayerInfo {
  name: string;
  position: { x: number; z: number };
  baseScale: number;
  trophyStartX: number; // Starting X-coordinate for the metric animation lane
  spriteFrames: string[]; // Array of image paths for sprite animation
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
  players = [
    {
      name: 'Ronaldo',
      position: { x: 300, z: 120 },
      baseScale: 30,
      trophyStartX: -100, // Starts from the left side
      spriteFrames: [
        staticFile('images/ronaldo.png'),
        staticFile('images/ronaldo.png'),
        staticFile('images/ronaldo.png'),
        // ... add more frames as needed
      ]
    },
    {
      name: 'Messi',
      position: { x: 800, z: 120 },
      baseScale: 30,
      trophyStartX: 1200, // Starts from the right side
      spriteFrames: [
        staticFile('images/messi.png'),
        staticFile('images/messi.png'),
        staticFile('images/messi.png'),
        // ... add more frames as needed
      ]
    }
  ],
  data=[{"date":"2006","data":[{"name":"Ronaldo","value":1},{"name":"Messi","value":1}]},{"date":"2010","data":[{"name":"Ronaldo","value":2},{"name":"Messi","value":1}]},{"date":"2014","data":[{"name":"Ronaldo","value":3},{"name":"Messi","value":5}]},{"date":"2018","data":[{"name":"Ronaldo","value":7},{"name":"Messi","value":6},{"name":"Mbappe","value":4}]},{"date":"2022","data":[{"name":"Ronaldo","value":8},{"name":"Messi","value":13},{"name":"Mbappe","value":12}]}],
  scaleMultiplier = 0.04,
  backgroundUrl = staticFile('images/stadium_bg.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  stepDuration = 2.0,
  trophySpeed = 1.0,
  celebrationDuration = 1.5,
  basePlayerHeight = 20,
  metricGraphicPath = (value) => staticFile('images/ucl_trophy.png'),
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // --- TIMING ---
  const mainStartTime = 1.0;
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = mainStartTime + totalMainDuration;
  const isMain = timeInSeconds >= mainStartTime && timeInSeconds < mainEndTime;

  const currentStepIndex = isMain ? Math.floor((timeInSeconds - mainStartTime) / stepDuration) : -1;

  // --- MEMOIZED CALCULATIONS ---

  const currentValues = useMemo(() => {
    if (currentStepIndex < 0) {
      return players.map(p => ({ ...p, currentValue: 0, increment: 0, sprite: p.spriteFrames[0] }));
    }

    const prevStepIndex = currentStepIndex - 1;
    const currentDataStep = data[currentStepIndex];
    const prevDataStep = prevStepIndex >= 0 ? data[prevStepIndex] : null;

    return players.map(player => {
      const currentValue = currentDataStep.data.find(d => d.name === player.name)?.value || 0;
      const prevValue = prevDataStep?.data.find(d => d.name === player.name)?.value || 0;
      const increment = currentValue - prevValue;

      // Use the sprite for the current step, or the last available sprite.
      const sprite = player.spriteFrames[Math.min(currentStepIndex, player.spriteFrames.length - 1)];

      return {
        ...player,
        currentValue,
        increment,
        sprite,
      };
    });
  }, [currentStepIndex, data, players]);

  const dateInfo = useMemo(() => {
    if (currentStepIndex < 0) return { currentDate: 'Getting Ready...', stepTime: 0 };
    const mainTime = timeInSeconds - mainStartTime;
    const stepTime = mainTime % stepDuration;
    return {
      currentDate: data[currentStepIndex].date,
      stepTime,
    };
  }, [currentStepIndex, timeInSeconds, mainStartTime, stepDuration, data]);

  // --- 2.5D PROJECTION ---
  const project2D5 = (x: number, z: number) => {
    const zProgress = Math.min(z / worldDepth, 1);
    const scale = lerp(1, farScale, zProgress);
    const startY = height;
    const endY = height * horizonLine;
    const y = lerp(startY, endY, zProgress);
    return { x: width / 2 + (x - width / 2) * scale, y, scale };
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
              src={player.sprite}
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
        if (currentStepIndex < 0 || player.increment <= 0) return null;

        const trophyProgress = Math.min(dateInfo.stepTime / trophySpeed, 1);
        const targetProj = project2D5(player.position.x, player.position.z);

        // Animate the metric graphic from its defined start lane to the player
        const startX = player.trophyStartX;
        const startZ = 0; // Start at the front of the scene
        const currentX = lerp(startX, player.position.x, trophyProgress);
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
                top: targetProj.y - 150,
                transform: `translateX(-50%) translateY(${-popupProgress * 80}px) scale(${popUpScale})`,
                fontSize: '8em',
                fontWeight: 'bold',
                color: '#28a745',
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