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

// --- INTERFACES REMAIN THE SAME ---

interface PlayerInfo {
  name: string;
  position: { x: number; z: number };
  baseScale: number;
  trophyStartX: number;
  spriteFrames: string[];
}

interface PlayerData {
  name:string;
  value: number;
}

interface DataStep {
  date: string;
  data: PlayerData[];
}

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
        staticFile('images/ron1.png'),
        staticFile('images/ron2.png'),
        staticFile('images/ron3.png'),
        staticFile('images/ron4.png'),
        staticFile('images/ron5.png'),
        staticFile('images/ron6.png'),
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
  data = [{ "date": "2006", "data": [{ "name": "Ronaldo", "value": 1 }, { "name": "Messi", "value": 1 }] }, { "date": "2010", "data": [{ "name": "Ronaldo", "value": 2 }, { "name": "Messi", "value": 1 }] }, { "date": "2014", "data": [{ "name": "Ronaldo", "value": 3 }, { "name": "Messi", "value": 5 }] }, { "date": "2018", "data": [{ "name": "Ronaldo", "value": 7 }, { "name": "Messi", "value": 6 }, { "name": "Mbappe", "value": 4 }] }, { "date": "2022", "data": [{ "name": "Ronaldo", "value": 8 }, { "name": "Messi", "value": 13 }, { "name": "Mbappe", "value": 12 }] }],
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
  const isMain = timeInSeconds >= mainStartTime;
  const mainTime = timeInSeconds - mainStartTime;
  const currentStepIndex = isMain ? Math.floor(mainTime / stepDuration) : -1;
  const stepTime = isMain ? mainTime % stepDuration : 0;
  const hasImpactOccurred = stepTime >= trophySpeed;

  // --- MEMOIZED CALCULATIONS ---

  const currentValues = useMemo(() => {
    // Before main animation, use initial state
    if (currentStepIndex < 0) {
      return players.map(p => ({
        ...p,
        visualValue: 0,
        increment: 0,
        sprite: p.spriteFrames[0]
      }));
    }

    const prevStepIndex = currentStepIndex - 1;
    const currentDataStep = data[currentStepIndex];
    const prevDataStep = prevStepIndex >= 0 ? data[prevStepIndex] : null;

    return players.map(player => {
      const targetValue = currentDataStep.data.find(d => d.name === player.name)?.value || 0;
      const prevValue = prevDataStep?.data.find(d => d.name === player.name)?.value || 0;
      const increment = targetValue - prevValue;
      const visualValue = hasImpactOccurred ? targetValue : prevValue;

      // *** CORE LOGIC FIX HERE ***
      // Before impact, use the sprite for the current step.
      // After impact, advance to the sprite for the *next* step.
      const spriteIndex = hasImpactOccurred ? currentStepIndex + 1 : currentStepIndex;

      // Clamp index to prevent crashes if spriteFrames array is too short
      const clampedSpriteIndex = Math.min(spriteIndex, player.spriteFrames.length - 1);
      const sprite = player.spriteFrames[clampedSpriteIndex];

      return {
        ...player,
        visualValue,
        increment,
        sprite,
      };
    });
  }, [currentStepIndex, hasImpactOccurred, data, players]);

  const dateInfo = useMemo(() => {
    if (currentStepIndex < 0 || !data[currentStepIndex]) return { currentDate: 'Getting Ready...' };
    return {
      currentDate: data[currentStepIndex].date
    };
  }, [currentStepIndex, data]);

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
        const dynamicScale = 1 + player.visualValue * scaleMultiplier;
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

        const trophyProgress = Math.min(stepTime / trophySpeed, 1);
        const targetProj = project2D5(player.position.x, player.position.z);

        const startX = player.trophyStartX;
        const startZ = 0;
        const currentX = lerp(startX, player.position.x, trophyProgress);
        const currentZ = lerp(startZ, player.position.z, trophyProgress);
        const animProj = project2D5(currentX, currentZ);

        const popupProgress = Math.min(Math.max(0, (stepTime - trophySpeed) / celebrationDuration), 1);
        const popUpScale = 1 + Math.sin(popupProgress * Math.PI) * 0.4;

        return (
          <React.Fragment key={`${player.name}-increment`}>
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