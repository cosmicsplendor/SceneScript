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
  breathingPhaseShift?: number; // Individual breathing phase shift in radians
}

interface PlayerData {
  name: string;
  value: number;
  emoji?: string; // Optional emoji field
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
  breathingRate?: (value: number) => number;
  breathingAmplitude?: (value: number) => number;
  // --- Props for independent date animation path ---
  dateStartX?: number;
  dateEndX?: number;
  dateStartZ?: number;
  dateEndZ?: number;
  dateTextScale?: number;
  dateTextColor?: string;
  dateTextPerspective?: number;
  dateTextRotateX?: number;
  dateTextFloorYOffset?: number; // Fine-tune vertical position on the floor
}

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// Elastic easing function for bounce effect
const elasticOut = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const p = 0.3;
  const s = p / 4;
  return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
};

// --- COMPONENT ---

const MultiSoccerSize: React.FC<MultiSoccerSizeProps> = ({
  players,
  data,
  scaleMultiplier = 0,
  backgroundUrl = staticFile('images/beach_dawn.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.55,
  stepDuration = 1.5,
  trophySpeed = 1.25,
  celebrationDuration = 0.25,
  basePlayerHeight = 20,
  metricGraphicPath = (value) => {
    return staticFile(`images/value${value}.png`)
  },
  breathingRate = (value: number) => 1,
  breathingAmplitude = (value: number) => 0.02,
  // --- Default values for independent date animation ---
  dateStartX = 530,
  dateEndX = 530,
  dateStartZ = 0,
  dateEndZ = 80, // Travels further back
  dateTextScale = 1,
  dateTextColor = 'white',
  dateTextPerspective = 700,
  dateTextRotateX = 50, // More perspective for floor
  dateTextFloorYOffset = 60, // Nudge text up from the projection line
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // Set default X positions based on video width if not provided
  const finalDateStartX = dateStartX ?? width / 2;
  const finalDateEndX = dateEndX ?? width / 2;

  const timeEpsilon = 1 / (fps * 100);
  const correctedTime = timeInSeconds + timeEpsilon;

  // --- TIMING ---
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = totalMainDuration;
  const isAfterMain = correctedTime >= mainEndTime;

  const currentStepIndex = isAfterMain
    ? data.length - 1
    : Math.floor(correctedTime / stepDuration);

  const stepTime = isAfterMain ? stepDuration : correctedTime % stepDuration;

  // Unified animation progress for both date and metric values
  const trophyProgress = stepTime / trophySpeed;
  const impactTime = trophySpeed;
  const hasImpactOccurred = stepTime >= impactTime;

  // Value animation progress - starts after impact
  const valueAnimationDuration = 0.8; // Duration for value text animation
  const valueAnimationStart = impactTime;
  const valueAnimationProgress = hasImpactOccurred ?
    Math.min((stepTime - valueAnimationStart) / valueAnimationDuration, 1) : 0;

  // --- MEMOIZED CALCULATIONS ---
  const currentValues = useMemo(() => {
    const prevStepIndex = currentStepIndex - 1;
    const currentDataStep = data[currentStepIndex];
    const prevDataStep = prevStepIndex >= 0 ? data[prevStepIndex] : null;

    return players.map(player => {
      const currentData = currentDataStep.data.find(d => d.name === player.name);
      const prevData = prevDataStep?.data.find(d => d.name === player.name);
      
      const targetValue = currentData?.value || 0;
      const targetEmoji = currentData?.emoji; // Get emoji from current data
      const prevValue = prevData?.value || 0;
      const prevEmoji = prevData?.emoji; // Get previous emoji
      const increment = targetValue - prevValue;
      const visualValue = hasImpactOccurred ? targetValue : prevValue;
      // Show current emoji if it exists, regardless of impact timing
      const visualEmoji = targetEmoji;

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
        spriteSrc = '';
      }

      return {
        ...player,
        visualValue,
        visualEmoji, // Include visual emoji
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

  // UPDATED: Breathing scale with individual phase shifts
  const getBreathingScale = useCallback((value: number, phaseShift: number = 0) => {
    const rate = breathingRate(value);
    const amplitude = breathingAmplitude(value);
    const breath = (Math.sin(timeInSeconds * rate * Math.PI + phaseShift) + 1) / 2;
    return lerp(1, 1 + amplitude, breath);
  }, [breathingAmplitude, breathingRate, timeInSeconds]);


  // --- RENDER ---
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Background */}
      <Img src={backgroundUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: "saturate(1.4) brightness(1.1)", }} />

      {/* Players */}
      {currentValues.map((player) => {
        const proj = project2D5(player.position.x, player.position.z);
        const dynamicScale = 1 + player.visualValue * scaleMultiplier;
        const breathingScale = getBreathingScale(player.visualValue, player.breathingPhaseShift || 0);
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
            <Img src={player.spriteSrc} alt={player.name} style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain', filter: "saturate(1.05) brightness(1.05) contrast(1)", }} />
          </div>
        );
      })}

      {/* Score Boxes with Animated Values or Emojis */}
      {currentValues.map((player) => {
        const proj = project2D5(player.position.x, player.position.z);

        // --- NEW: DENIAL SHAKE ANIMATION LOGIC ---
        let denialShakeOffset = 0;
        const denialAnimationStart = trophySpeed; // Starts right when the emoji animation finishes
        const denialAnimationDuration = 0.4; // How long the shake lasts
        const isDenialTime = stepTime >= denialAnimationStart && stepTime < denialAnimationStart + denialAnimationDuration;

        // Condition: Animate only if increment is 0 and there's an emoji.
        if (isDenialTime && player.increment === 0 && player.visualEmoji) {
            const denialProgress = (stepTime - denialAnimationStart) / denialAnimationDuration;
            const shakeFrequency = 2; // How many times it shakes back and forth
            const shakeAmplitude = 10; // Max pixels to move left/right
            denialShakeOffset = Math.sin(denialProgress * Math.PI * 2 * shakeFrequency) * shakeAmplitude;
        }

        // Calculate text scale based on animation progress
        const textScale = hasImpactOccurred && player.increment > 0 ?
          0.5 * (1 + elasticOut(valueAnimationProgress)) : 1;

        // Always show the numeric value in score boxes
        const displayContent = player.visualValue;
        const fontSize = '120px';

        return (
          <div key={`${player.name}-score`} style={{
            position: 'absolute',
            bottom: 500,
            left: proj.x,
            // NEW: Apply the shake offset here, combined with the centering transform
            transform: `translateX(calc(-50% + ${denialShakeOffset}px))`,
            zIndex: Math.round(player.position.z) + 1,
            backgroundColor: 'white',
            color: 'black',
            width: 180,
            height: 180,
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            borderRadius: '10px',
            fontSize: fontSize,
            fontWeight: 800,
            boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.76)',
          }} >
            <div style={{
              transform: `scale(${textScale})`,
              transition: 'none',
            }}>
              {displayContent}
            </div>
          </div>
        );
      })}

      {/* Metric Value (Ball) Animations - Show emoji when increment is 0 */}
      {currentValues.map((player) => {
        if (isAfterMain || trophyProgress >= 1) return null;
        
        // Show animation if increment > 0 OR if increment = 0 and emoji exists
        const shouldShowAnimation = player.increment > 0 || (player.increment === 0 && player.visualEmoji);
        if (!shouldShowAnimation) return null;

        const startX = player.trophyStartX;
        const startZ = 0;
        const currentX = lerp(startX, player.position.x, easingFns.linear(trophyProgress) * 0.85);
        const currentZ = lerp(startZ, player.position.z, easingFns.linear(trophyProgress) * 0.9);
        const animProj = project2D5(currentX, currentZ);

        // Show emoji if increment is 0 and emoji exists, otherwise show metric image
        const isEmojiAnimation = player.increment === 0 && player.visualEmoji;

        return (
          <div key={`${player.name}-increment-metric`} style={{ 
            position: 'absolute', 
            width: animProj.scale * 400, 
            left: animProj.x - (animProj.scale * 400 / 2), 
            top: animProj.y - (animProj.scale * 400 / 2), 
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isEmojiAnimation ? (
              <div style={{
                fontSize: `${animProj.scale * 140}px`,
                lineHeight: 1,
                transform: `translate(-40px, 200px)`, // Adjust vertical position
              }}>
                {player.visualEmoji}
              </div>
            ) : (
              <Img src={metricGraphicPath(player.increment)} style={{ width: '100%', height: 'auto' }} />
            )}
          </div>
        );
      })}

      {/* --- Date Animation on Floor --- */}
      {!isAfterMain && trophyProgress > 0 && trophyProgress < 1 && (
        (() => {
          const currentDateX = lerp(finalDateStartX, finalDateEndX, trophyProgress);
          const currentDateZ = lerp(dateStartZ, dateEndZ, trophyProgress);
          const dateProj = project2D5(currentDateX, currentDateZ);

          return (
            <div style={{ position: 'absolute', left: dateProj.x, top: dateProj.y, transformStyle: 'preserve-3d', zIndex: Math.round(currentDateZ), transform: 'translateX(-50%) translateY(-50%)', }}>
                <div style={{
                fontSize: '8em',
                textAlign: "center",
                fontWeight: 'bold',
                color: dateTextColor,
                textShadow: '0 0 12px #000, 2px 2px 0 #222, -2px -2px 0 #222, 0 2px 0 #222, 2px 0px 0 #222',
                WebkitTextStroke: '2px #222',
                // SVG stroke fallback for better cross-browser support
                // Use filter: drop-shadow for a subtle outline if needed
                filter: 'drop-shadow(0 0 2px #222) drop-shadow(0 0 4px #000)',
                transform: `translateY(${dateTextFloorYOffset}px) perspective(${dateTextPerspective}px) rotateX(${dateTextRotateX}deg) scale(${dateProj.scale * dateTextScale})`,
                whiteSpace: 'pre-line',
                }}>
                <span
                  style={{
                  WebkitTextStroke: '2px #fff',
                  color: dateTextColor,
                  paintOrder: 'stroke fill',
                  textTransform: 'uppercase',
                  }}
                >
                  {dateInfo.currentDate.replace(' ', '\n')}
                </span>
                </div>
            </div>
          );
        })()
      )}

      {/* Title Card */}
      <div style={{ position: 'absolute', fontFamily: "Bebas Nue", top: 340, left: '50%', transform: 'translateX(-50%)', background: 'black', color: '#fff', width: 740, padding: '24px 64px', borderRadius: '32px', boxShadow: '0 8px 32px rgba(30,60,114,0.25)', fontSize: '4.5em', fontWeight: 900, letterSpacing: '0.05em', border: '4px solid #fff', textAlign: 'center', zIndex: 2000, }}>
        Last 40 League Games
      </div>
    </AbsoluteFill>
  );
};

export default MultiSoccerSize;