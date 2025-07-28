import { easingFns } from '../../../../lib/d3/utils/math';
import React, { useCallback, useMemo } from 'react';
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
  floorTextPerspective?: number;
  floorTextRotateX?: number;
  floorTextYPosition?: number;
  floorTextScale?: number;
  floorTextColor?: string;
  floorTextFadeInDuration?: number;
  floorTextHoldDuration?: number;
  floorTextFadeOutDuration?: number;
  // --- NEW: Props for breathing animation ---
  breathingRate?: (value: number) => number;
  breathingAmplitude?: (value: number) => number;
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
  farScale = 0.55,
  stepDuration = 3.4,
  trophySpeed = 1.4,
  celebrationDuration = 0.75,
  basePlayerHeight = 20,
  metricGraphicPath = (value) => {
    return staticFile(`images/value${value}.png`)
  },
  floorTextPerspective = 600,
  floorTextRotateX = 45,
  floorTextYPosition = 1350,
  floorTextScale = 1.75,
  floorTextColor = 'white',
  floorTextFadeInDuration = 0.4,
  floorTextHoldDuration = 0.6,
  floorTextFadeOutDuration = 0.2,
  // --- NEW: Default values for breathing animation ---
  breathingRate = (value: number) => 1 + value * 0.0125,
  breathingAmplitude = (value: number) => 0.02 + value * 0.00025,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // --- NEW: Frame flicker fix ---
  // A small epsilon prevents floating-point errors at the exact boundary of a step.
  const timeEpsilon = 1 / (fps * 100);
  const correctedTime = timeInSeconds + timeEpsilon;

  // --- TIMING (Now uses 'correctedTime' for step calculation) ---
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = totalMainDuration;
  const isAfterMain = correctedTime >= mainEndTime;

  const currentStepIndex = isAfterMain
    ? data.length - 1
    : Math.floor(correctedTime / stepDuration);

  const stepTime = isAfterMain ? stepDuration : correctedTime % stepDuration;

  // We determine hasImpactOccurred based on the full sequence.
  const ballAnimationStartTime = floorTextFadeInDuration + floorTextHoldDuration + floorTextFadeOutDuration;
  const impactTime = ballAnimationStartTime + trophySpeed;
  const hasImpactOccurred = stepTime >= impactTime;


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

  const floorTextOpacity = useMemo(() => {
    if (isAfterMain) {
      return 1;
    }

    const fadeInEndTime = floorTextFadeInDuration;
    const holdEndTime = fadeInEndTime + floorTextHoldDuration;
    const fadeOutEndTime = holdEndTime + floorTextFadeOutDuration;

    if (stepTime < fadeInEndTime) {
      return easingFns.cubicIn(stepTime / fadeInEndTime);
    }
    if (stepTime < holdEndTime) {
      return 1;
    }
    if (stepTime < fadeOutEndTime) {
      const fadeOutProgress = (stepTime - holdEndTime) / floorTextFadeOutDuration;
      return 1 - easingFns.sineOut(fadeOutProgress);
    }
    return 0;
  }, [isAfterMain, stepTime, floorTextFadeInDuration, floorTextHoldDuration, floorTextFadeOutDuration]);


  // --- 2.5D PROJECTION ---
  const project2D5 = (x: number, z: number) => {
    const zProgress = Math.min(z / worldDepth, 1);
    const scale = lerp(1, farScale, zProgress);
    const startY = height;
    const endY = height * horizonLine;
    const y = lerp(startY, endY, zProgress);
    return { x: width / 2 + (x - width / 2) * scale, y, scale };
  };

  // --- NEW: Breathing animation function ---
  const getBreathingScale = useCallback((value: number) => {
      // Uses the uncorrected 'timeInSeconds' for a smooth, continuous oscillation
      const rate = breathingRate(value);
      const amplitude = breathingAmplitude(value);
      const breath = (Math.sin(timeInSeconds * rate * Math.PI) + 1) / 2;
      return lerp(1, 1 + amplitude, breath);
  }, [breathingAmplitude, breathingRate, timeInSeconds]);


  // --- RENDER ---
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Background */}
      <Img src={backgroundUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: "saturate(1.5) brightness(1.05)", }} />

      {/* Date Display on Floor */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: floorTextOpacity,
      }}>
        <div style={{
          position: 'absolute',
          top: floorTextYPosition,
          transformStyle: 'preserve-3d',
          zIndex: 1,
        }}>
          <div style={{
            fontSize: '8em',
            fontWeight: 'bold',
            color: floorTextColor,
            textShadow: `
              0 0 12px #000,
              2px 2px 0 #222,
              -2px -2px 0 #222,
              0 2px 0 #222,
              2px 0px 0 #222
            `,
            WebkitTextStroke: '2px #222',
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
        
        // --- NEW: Breathing scale is calculated and applied ---
        const breathingScale = getBreathingScale(player.visualValue);
        const totalScale = proj.scale * player.baseScale * dynamicScale * player.customScale * breathingScale;

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
                filter: "saturate(1.05) brightness(1.05) contrast(1)",
              }}
            />
          </div>
        );
      })}

      {/* Score Boxes (No changes needed here) */}
      {currentValues.map((player) => {
        const proj = project2D5(player.position.x, player.position.z);

        return (
          <div
            key={`${player.name}-score`}
            style={{
              position: 'absolute',
              top: proj.y,
              left: proj.x,
              transform: 'translateX(-50%)',
              zIndex: Math.round(player.position.z) + 1,
              backgroundColor: 'white',
              color: 'black',
              width: 180,
              height: 180,
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '10px',
              fontSize: '120px',
              fontWeight: 'bold',
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.76)',
            }}
          >
            {player.visualValue}
          </div>
        );
      })}


      {/* Value Increment Animations (No changes needed here) */}
      {currentValues.map((player) => {
        if (isAfterMain) return null;

        const ballAnimationStartTime = floorTextFadeInDuration + floorTextHoldDuration + floorTextFadeOutDuration;
        const trophyProgress = stepTime > ballAnimationStartTime
          ? (stepTime - ballAnimationStartTime) / trophySpeed
          : 0;
        const impactTime = ballAnimationStartTime + trophySpeed;
        const popupProgress = Math.min(Math.max(0, (stepTime - impactTime) / celebrationDuration), 1);

        const targetProj = project2D5(player.position.x, player.position.z);
        const startX = player.trophyStartX;
        const startZ = 0;
        const currentX = lerp(startX, player.position.x, easingFns.linear(trophyProgress) * 0.85);
        const currentZ = lerp(startZ, player.position.z, easingFns.linear(trophyProgress) * 0.85);
        const animProj = project2D5(currentX, currentZ);
        const popUpScale = 1 + Math.sin(popupProgress * Math.PI) * 0.4;

        return (
          <React.Fragment key={`${player.name}-increment`}>
            {trophyProgress > 0 && trophyProgress < 1 && (
              <div style={{
                position: 'absolute',
                width: animProj.scale * 400,
                left: animProj.x - (animProj.scale * 400 / 2),
                top: animProj.y - (animProj.scale * 400 / 2),
                zIndex: 999,
              }}>
                <Img
                  src={metricGraphicPath(player.increment)}
                  style={{
                    width: '100%',
                    height: 'auto'
                  }}
                />
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
      
      {/* Title Card (No changes needed here) */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'black',
          color: '#fff',
          width: 650,
          padding: '24px 64px',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(30,60,114,0.25)',
          fontSize: '3em',
          fontWeight: 900,
          letterSpacing: '0.05em',
          border: '4px solid #fff',
          textAlign: 'center',
          zIndex: 2000,
          opacity:
            timeInSeconds < 1.5
              ? 1
              : timeInSeconds > 2
                ? 0
                : 1 - (timeInSeconds - 1.5) / 0.5,
        }}
      >
        WORLD CUP GOALS
      </div>
    </AbsoluteFill>
  );
};

export default MultiSoccerSize;