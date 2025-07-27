import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  AbsoluteFill,
  Img,
} from 'remotion';

// --- INTERFACES & PROPS ---

interface PlayerInfo {
  name: string;
  position: { x: number; z: number };
  baseScale: number;
  trophyStartX: number;
  spriteFrames: (string | { src: string; xOffset?: number; scale?: number })[];
}

interface PlayerData {
  name: string;
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
  // New props for the floor text
  floorTextPerspective?: number;
  floorTextRotateX?: number;
  floorTextYPosition?: number;
  floorTextScale?: number;
  floorTextColor?: string;
}

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// --- COMPONENT ---

const MultiSoccerSize: React.FC<MultiSoccerSizeProps> = ({
  players,
  data,
  scaleMultiplier = 0,
  backgroundUrl = staticFile('images/cruise_bg.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  stepDuration = 2.0,
  trophySpeed = 1,
  celebrationDuration = 1.5,
  basePlayerHeight = 20,
  metricGraphicPath = (value) => staticFile('images/ucl_trophy.png'),
  // Default values for new floor text props
  floorTextPerspective = 600,
  floorTextRotateX = 45,
  floorTextYPosition = 1400,
  floorTextScale = 2,
  floorTextColor = '#000',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // --- TIMING ---
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = totalMainDuration;
  const isAfterMain = timeInSeconds >= mainEndTime;

  const currentStepIndex = isAfterMain
    ? data.length - 1
    : Math.floor(timeInSeconds / stepDuration);

  const stepTime = isAfterMain ? stepDuration : timeInSeconds % stepDuration;
  const hasImpactOccurred = stepTime >= trophySpeed;


  // --- MEMOIZED CALCULATIONS ---
  const currentValues = useMemo(() => {
    const prevStepIndex = currentStepIndex - 1;
    const currentDataStep = data[currentStepIndex];
    const prevDataStep = prevStepIndex >= 0 ? data[prevStepIndex] : null;

    return players.map(player => {
      const targetValue = currentDataStep.data.find(d => d.name === player.name)?.value || 0;
      const prevValue = prevDataStep?.data.find(d => d.name === player.name)?.value || 0;
      const increment = targetValue - prevValue;
      const visualValue = hasImpactOccurred ? targetValue : prevValue;

      const spriteIndex = hasImpactOccurred ? currentStepIndex + 1 : currentStepIndex;
      const clampedSpriteIndex = Math.min(spriteIndex, player.spriteFrames.length - 1);
      const spriteFrame = player.spriteFrames[clampedSpriteIndex];

      let spriteSrc: string;
      let xOffset = 0;
      let customScale = 1;

      if (typeof spriteFrame === 'string') {
        spriteSrc = spriteFrame;
      } else if (spriteFrame && typeof spriteFrame === 'object') {
        spriteSrc = spriteFrame.src;
        xOffset = spriteFrame.xOffset || 0;
        customScale = spriteFrame.scale || 1;
      } else {
        spriteSrc = ''; // Fallback for safety
      }

      return {
        ...player,
        visualValue,
        increment,
        spriteSrc,
        xOffset,
        customScale,
      };
    });
  }, [currentStepIndex, hasImpactOccurred, data, players]);

  const dateInfo = useMemo(() => {
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

      {/* Date Display on Floor */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute',
          top: floorTextYPosition,
          transformStyle: 'preserve-3d', // Create 3D rendering context
          zIndex: 1, // Ensure it's behind players
        }}>
          <div style={{
            fontSize: '8em',
            fontWeight: 'bold',
            color: floorTextColor,
            transform: `
                  perspective(${floorTextPerspective}px)
                  rotateX(${floorTextRotateX}deg)
                  scale(${floorTextScale})
                `,
          }}>
            {dateInfo.currentDate}
          </div>
        </div>
      </AbsoluteFill>


      {/* Players */}
      {currentValues.map((player) => {
        const proj = project2D5(player.position.x, player.position.z);
        const dynamicScale = 1 + player.visualValue * scaleMultiplier;
        const totalScale = proj.scale * player.baseScale * dynamicScale * player.customScale;

        return (
          <div
            key={player.name}
            style={{
              position: 'absolute',
              left: proj.x,
              top: proj.y,
              transform: `translateX(calc(-50% + ${player.xOffset}px)) translateY(-100%) scale(${totalScale})`,
              transformOrigin: 'bottom center',
              zIndex: Math.round(player.position.z),
              height: `${basePlayerHeight}px`,
            }}
          >
            <Img
              src={player.spriteSrc}
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

      {/* Score Boxes */}
      {currentValues.map((player) => {
        const proj = project2D5(player.position.x, player.position.z);

        return (
          <div
            key={`${player.name}-score`}
            style={{
              position: 'absolute',
              top: proj.y, // Position above the player
              left: proj.x,
              transform: 'translateX(-50%)', // Center horizontally
              zIndex: Math.round(player.position.z) + 1, // Ensure it's above the player
              backgroundColor: 'white',
              color: 'black',
              width: 90,
              height: 90,
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '5px',
              fontSize: '48px',
              fontWeight: 'bold',
              border: '1px solid black',
              boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
            }}
          >
            {player.visualValue}
          </div>
        );
      })}


      {/* Value Increment Animations */}
      {currentValues.map((player) => {
        if (isAfterMain) return null;

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
            {player.increment > 0 && popupProgress > 0 && popupProgress < 1 && (
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