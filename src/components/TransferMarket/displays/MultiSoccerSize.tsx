import { easingFns } from '../../../../lib/d3/utils/math';
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
  floorTextPerspective?: number;
  floorTextRotateX?: number;
  floorTextYPosition?: number;
  floorTextScale?: number;
  floorTextColor?: string;
  floorTextFadeInDuration?: number;
  floorTextHoldDuration?: number;
  floorTextFadeOutDuration?: number;
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
  stepDuration = 3.4, // Increased default to accommodate sequence
  trophySpeed = 1.4,
  celebrationDuration = 0.75,
  basePlayerHeight = 20,
  metricGraphicPath = (value) => {
    return staticFile(`images/value${value}.png`)
  },
  floorTextPerspective = 600,
  floorTextRotateX = 45,
  floorTextYPosition = 1300,
  floorTextScale = 1.75,
  floorTextColor = 'white',
  floorTextFadeInDuration = 0.4,
  floorTextHoldDuration = 0.6, // Shortened hold time to fit sequence
  floorTextFadeOutDuration = 0.2,
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

  // --- MODIFICATION: The impact from the ball now happens much later
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
                filter: "saturate(1.05) brightness(1.05) contrast(1)",
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
              top: proj.y,
              left: proj.x,
              transform: 'translateX(-50%)',
              zIndex: Math.round(player.position.z) + 1,
              backgroundColor: 'white',
              color: 'black',
              width: 120,
              height: 120,
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '10px',
              fontSize: '64px',
              fontWeight: 'bold',
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.76)',
            }}
          >
            {player.visualValue}
          </div>
        );
      })}


      {/* Value Increment Animations */}
      {currentValues.map((player) => {
        if (isAfterMain) return null;

        // --- MODIFICATION: DELAY ANIMATION START ---
        // 1. Define when the ball animation should start.
        // It starts only after the text has faded in, held, and faded out.
        const ballAnimationStartTime = floorTextFadeInDuration + floorTextHoldDuration + floorTextFadeOutDuration;

        // 2. Calculate the ball's travel progress based on the new start time.
        // If it's not yet time for the ball to move, its progress is 0.
        const trophyProgress = stepTime > ballAnimationStartTime
          ? (stepTime - ballAnimationStartTime) / trophySpeed
          : 0;

        // 3. The popup animation also needs to be delayed, as it happens after impact.
        const impactTime = ballAnimationStartTime + trophySpeed;
        const popupProgress = Math.min(Math.max(0, (stepTime - impactTime) / celebrationDuration), 1);
        // --- END MODIFICATION ---

        const targetProj = project2D5(player.position.x, player.position.z);
        const startX = player.trophyStartX;
        const startZ = 0;
        const currentX = lerp(startX, player.position.x, easingFns.linear(trophyProgress) * 0.85);
        const currentZ = lerp(startZ, player.position.z, easingFns.linear(trophyProgress) * 0.85);
        const animProj = project2D5(currentX, currentZ);
        const popUpScale = 1 + Math.sin(popupProgress * Math.PI) * 0.4;

        // IMPORTANT: Ensure your stepDuration is long enough for the whole sequence!
        // stepDuration should be >= floorTextFadeInDuration + floorTextHoldDuration + floorTextFadeOutDuration + trophySpeed + celebrationDuration

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
      <div
        style={{
          position: 'absolute',
          top: 120,
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