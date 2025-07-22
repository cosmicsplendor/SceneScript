import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  AbsoluteFill,
  Img,
} from 'remotion';

// Interfaces
interface PlayerData { name: string; value: number; }
interface DataStep { date: string; data: PlayerData[]; }
interface Position3D { x: number; z: number; }
interface TrophyAnimation { x: number; y: number; scale: number; progress: number; }
interface Particle { x: number; y: number; delay: number; }

interface SoccerSizeProps {
  data?: DataStep[];
  player1Name?: string;
  player2Name?: string;
  player1Position?: Position3D;
  player2Position?: Position3D;
  player1Scale?: number;
  player2Scale?: number;
  basePlayerHeight?: number;
  imageMappers?: { [key: string]: (value: number) => string; };

  // This new prop lets us manually define the height multiplier for each sprite.
  imageGrowthFactors?: { [key: string]: number[] };

  backgroundUrl?: string;
  horizonLine?: number;
  worldDepth?: number;
  farScale?: number;
  player1TrophyLaneX?: number;
  player2TrophyLaneX?: number;
  trophyStartDepth?: number;
  trophySpeed?: number;
  celebrationDuration?: number;
  breathingRate?: (value: number) => number;
  breathingAmplitude?: (value: number) => number;
  physicalMetric?: (value: number) => string;
  titleText?: string;
  hookDuration?: number;
  stepDuration?: number;
  trophyImage?: string;
  useParticles?: boolean;
  particleCount?: number;
  metricBoxYOffset?: number;
}

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

const SoccerSize: React.FC<SoccerSizeProps> = ({
  data = [
    { date: '2008', data: [{ name: 'Ronaldo', value: 1 }, { name: 'Messi', value: 0 }] },
    { date: '2009', data: [{ name: 'Ronaldo', value: 1 }, { name: 'Messi', value: 1 }] },
    { date: '2010', data: [{ name: 'Ronaldo', value: 1 }, { name: 'Messi', value: 2 }] },
    { date: '2011', data: [{ name: 'Ronaldo', value: 1 }, { name: 'Messi', value: 3 }] },
    { date: '2012', data: [{ name: 'Ronaldo', value: 1 }, { name: 'Messi', value: 4 }] },
    { date: '2013', data: [{ name: 'Ronaldo', value: 2 }, { name: 'Messi', value: 4 }] },
    { date: '2014', data: [{ name: 'Ronaldo', value: 3 }, { name: 'Messi', value: 4 }] },
    { date: '2015', data: [{ name: 'Ronaldo', value: 3 }, { name: 'Messi', value: 5 }] },
    { date: '2016', data: [{ name: 'Ronaldo', value: 4 }, { name: 'Messi', value: 5 }] },
    { date: '2017', data: [{ name: 'Ronaldo', value: 5 }, { name: 'Messi', value: 5 }] },
    { date: '2019', data: [{ name: 'Ronaldo', value: 5 }, { name: 'Messi', value: 6 }] },
    { date: '2021', data: [{ name: 'Ronaldo', value: 5 }, { name: 'Messi', value: 7 }] },
  ],
  player1Name = 'Messi',
  player2Name = 'Ronaldo',
  player1Position = { x: 120, z: 164 },
  player2Position = { x: 850, z: 164 },
  player1Scale = 1.75,
  player2Scale = 1.75,
  basePlayerHeight = 45,
  imageMappers = {
    // Note: The player's score is 'value'. `value: 0` maps to `mess1.png`, `value: 1` to `mess2.png`, etc.
    Messi: (value: number) => staticFile(`images/mess${value + 1}.png`),
    Ronaldo: (value: number) => staticFile(`images/ron${value + 1}.png`),
  },

  // ** IMPORTANT: YOU MUST UPDATE THESE VALUES BASED ON YOUR ACTUAL IMAGE SIZES **
  // The first value (at index 0) should always be 1.0 (the base size).
  // The value at index 1 is (height of image 2 / height of image 1).
  // The value at index 2 is (height of image 3 / height of image 1), etc.
  imageGrowthFactors = {
    Messi: Array(9).fill(0).map((_, i) => 1 + i * 0.05), // Example values for mess1.png through mess8.png
    Ronaldo: Array(6).fill(0).map((_, i) => 1 + i * 0.055),           // Example values for ron1.png through ron6.png
  },
  backgroundUrl = staticFile('images/beach_dawn.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  player1TrophyLaneX = 230,
  player2TrophyLaneX = 850,
  trophyStartDepth = 0,
  trophySpeed = 1.5,
  celebrationDuration = 1,
  breathingRate = (value: number) => 0.8 + value * 0.05,
  breathingAmplitude = (value: number) => 0.02 + value * 0.002,
  physicalMetric = (value: number) => `+${value * 20}KG`,
  titleText = "If Ballon d'Or Made You Bigger",
  hookDuration = 1,
  stepDuration = 2,
  trophyImage = staticFile('images/ballondor_trophy.png'),
  useParticles = true,
  particleCount = 30,
  metricBoxYOffset = -1100
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  const finalDataStep = data[data.length - 1];
  const hookTargetValue = Math.min(
    finalDataStep.data.find((p) => p.name === player1Name)?.value || 0,
    finalDataStep.data.find((p) => p.name === player2Name)?.value || 0
  ) + 1;
  const isHook = timeInSeconds < hookDuration;
  const mainStartTime = hookDuration;
  const totalMainDuration = data.length * stepDuration;
  const isEndCard = timeInSeconds >= mainStartTime + totalMainDuration;

  let targetPlayer1Value = 0, targetPlayer2Value = 0;
  let activePlayer: string | null = null;
  let isPlayerTurn = false;
  let currentDate = '';
  let prevPlayer1Value = 0, prevPlayer2Value = 0;
  let stepTime = 0;

  if (isHook) {
    const p = Math.min(timeInSeconds / hookDuration, 1);
    targetPlayer1Value = Math.floor(p * hookTargetValue);
    targetPlayer2Value = Math.floor(p * hookTargetValue);
    currentDate = 'Fast Forward...';
  } else if (!isEndCard) {
    const mainTime = timeInSeconds - mainStartTime;
    stepTime = mainTime % stepDuration;
    const currentStepIndex = Math.min(Math.floor(mainTime / stepDuration), data.length - 1);
    const cData = data[currentStepIndex];
    currentDate = cData.date;
    targetPlayer1Value = cData.data.find((p) => p.name === player1Name)?.value || 0;
    targetPlayer2Value = cData.data.find((p) => p.name === player2Name)?.value || 0;

    const pData = currentStepIndex > 0 ? data[currentStepIndex - 1] : null;
    prevPlayer1Value = pData ? (pData.data.find((d) => d.name === player1Name)?.value ?? 0) : 0;
    prevPlayer2Value = pData ? (pData.data.find((d) => d.name === player2Name)?.value ?? 0) : 0;

    if (targetPlayer1Value > prevPlayer1Value) activePlayer = player1Name;
    else if (targetPlayer2Value > prevPlayer2Value) activePlayer = player2Name;

    const stepProgress = stepTime / stepDuration;
    isPlayerTurn = activePlayer !== null && stepProgress < (trophySpeed + celebrationDuration) / stepDuration;
  } else {
    targetPlayer1Value = finalDataStep.data.find((p) => p.name === player1Name)?.value || 0;
    targetPlayer2Value = finalDataStep.data.find((p) => p.name === player2Name)?.value || 0;
    currentDate = 'Final Score';
  }

  const getDisplayValue = (playerName: string, targetValue: number, prevValue: number) => {
    if (isPlayerTurn && activePlayer === playerName && stepTime < trophySpeed) {
      return prevValue;
    }
    return targetValue;
  };

  const displayPlayer1Value = getDisplayValue(player1Name, targetPlayer1Value, prevPlayer1Value);
  const displayPlayer2Value = getDisplayValue(player2Name, targetPlayer2Value, prevPlayer2Value);

  const project2D5 = (x: number, z: number) => {
    const zProgress = Math.min(z / worldDepth, 1);
    const scale = lerp(1, farScale, zProgress);
    const startY = height;
    const endY = height * horizonLine;
    const y = lerp(startY, endY, zProgress);
    return { x: width / 2 + (x - width / 2) * scale, y: y, scale: scale };
  };
  const getBreathingScale = (value: number) => lerp(1, 1 + breathingAmplitude(value), (Math.sin(timeInSeconds * breathingRate(value) * Math.PI) + 1) / 2);
  const player1Proj = project2D5(player1Position.x, player1Position.z);
  const player2Proj = project2D5(player2Position.x, player2Position.z);

  const trophyAnim = (() => {
    if (!isPlayerTurn || !activePlayer) return null;
    const trophyProgress = Math.min(stepTime / trophySpeed, 1);
    if (trophyProgress >= 1) return null;
    const targetPos = activePlayer === player1Name ? player1Position : player2Position;
    const trophyLaneX = activePlayer === player1Name ? player1TrophyLaneX : player2TrophyLaneX;
    const currentX = trophyLaneX;
    const currentZ = lerp(trophyStartDepth, targetPos.z, trophyProgress);
    const trophyProj = project2D5(currentX, currentZ);
    return { x: trophyProj.x, y: trophyProj.y, scale: trophyProj.scale * 3, progress: trophyProgress };
  })();
  const generateParticles = (count = particleCount) => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, delay: Math.random() * 0.4 }));

  const players = [
    { proj: player1Proj, name: player1Name, value: displayPlayer1Value, scale: player1Scale, pos: player1Position },
    { proj: player2Proj, name: player2Name, value: displayPlayer2Value, scale: player2Scale, pos: player2Position },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src={backgroundUrl} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <AbsoluteFill style={{ alignItems: 'center', zIndex: 10 }}>
        {
          !isHook && !isEndCard && (
            <div style={{ marginTop: '5%', fontSize: '48px', fontWeight: 'bold', color: '#fff', textShadow: '3px 3px 6px rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1vh 3vw', borderRadius: '15px' }}>{titleText}</div>
          )
        }
      </AbsoluteFill>

      {(isHook || isEndCard) && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <div style={{ position: 'absolute', top: '12%', fontSize: '5vh', fontWeight: '900', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{currentDate}</div>
        </AbsoluteFill>
      )}

      {players.map((p, i) => {
        // Look up the growth factor from our manual prop. Fallback to 1.0 if not found.
        const growthFactor = (imageGrowthFactors?.[p.name]?.[p.value]) ?? 1.0;

        // Calculate the final height using the base height, perspective, and our manual growth factor.
        const dynamicHeight = basePlayerHeight * p.proj.scale * growthFactor;

        return (
          <div key={i} style={{
            position: 'absolute', left: p.proj.x, top: p.proj.y,
            transform: `translateX(-50%) translateY(-100%) scale(${p.scale * getBreathingScale(p.value)})`,
            transformOrigin: 'bottom center',
            zIndex: Math.round(p.pos.z),
            height: `${dynamicHeight}vh`, // Use the new dynamic height here
            transition: 'height 0.3s ease-out, left 0.3s ease-out, top 0.3s ease-out',
          }}>
            <Img src={imageMappers[p.name](p.value)} alt={p.name} style={{
              display: 'block', height: '100%', width: 'auto', objectFit: 'contain',
              filter: activePlayer === p.name ? 'drop-shadow(0 0 25px #00ff00)' : 'none',
              transition: 'filter 0.3s',
            }} />
          </div>
        );
      })}

      {!isHook && !isEndCard && players.map((p, i) => (
        <div key={`metric-${i}`} style={{
          // --- Container Styles (Perfectly Centered by Flexbox) ---
          position: 'absolute',
          left: p.proj.x + (i * 2 * 200) - 200,
          top: p.proj.y + metricBoxYOffset,
          transform: `translateX(-50%)`,
          zIndex: Math.round(p.pos.z) + 1,
          backgroundColor: 'white',
          borderRadius: "12px", // Added for softer look
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            // --- Text Styles ---
            color: '#000',
            fontSize: '100px',
            fontWeight: 'bold',

            // --- THE FIX: Nudge the text down to visually center it ---
            transform: 'translateY(0.08em)' // Adjust this value (e.g., 0.05em to 0.1em) for your font
          }}>
            {p.value}
          </span>
        </div>
      ))}

      {trophyAnim && (
        <div style={{
          position: 'absolute', left: trophyAnim.x, top: trophyAnim.y,
          transform: `translateX(-50%) translateY(-50%) scale(${trophyAnim.scale})`,
          zIndex: 9999, filter: `brightness(${1 + trophyAnim.progress * 2}) drop-shadow(0 0 ${30 * trophyAnim.progress}px gold)`
        }}>
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '0px',
            fontSize: '64px',
            fontWeight: '900',
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            WebkitTextStroke: '4px rgba(0, 0, 0, 0.9)',
            textStroke: '4px rgba(0, 0, 0, 0.9)',
          }}>
            {currentDate}
          </div>
          <Img src={trophyImage} style={{ width: '8vh', height: 'auto' }} />
          {useParticles && generateParticles().map((particle, i) => (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%', width: '6px', height: '6px',
              backgroundColor: '#ffd700', borderRadius: '50%',
              opacity: Math.max(0, 1 - trophyAnim.progress - particle.delay),
              transform: `translate(${particle.x}px, ${particle.y}px) scale(${1.5 - trophyAnim.progress})`,
              boxShadow: '0 0 10px #ffd700',
            }} />
          ))}
        </div>
      )}

      {isPlayerTurn && !isHook && (() => {
        const popupProgress = Math.min(Math.max(0, (stepTime - trophySpeed) / celebrationDuration), 1);
        if (popupProgress === 0 || popupProgress === 1) return null;
        const targetProj = activePlayer === player1Name ? player1Proj : player2Proj;
        const popUpScale = 1 + Math.sin(popupProgress * Math.PI) * 0.5;
        return (
          <div style={{
            position: 'absolute', left: targetProj.x, top: targetProj.y - 180,
            transform: `translateX(-50%) translateY(${-popupProgress * 100}px) scale(${popUpScale})`,
            fontSize: '10vh', fontWeight: 'bold', color: '#00ff00',
            textShadow: '3px 3px 0px #000, 0 0 20px #00ff00',
            opacity: 1 - popupProgress, zIndex: 9999,
          }}>+1</div>
        );
      })()}

      {isEndCard && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '5vw', background: 'rgba(0,0,0,0.85)',
            padding: '4vh 6vw', borderRadius: '20px', border: '2px solid #fff'
          }}>
            {[
              { name: player1Name, value: finalDataStep.data.find((p) => p.name === player1Name)?.value || 0, isWinner: (finalDataStep.data.find((p) => p.name === player1Name)?.value || 0) >= (finalDataStep.data.find((p) => p.name === player2Name)?.value || 0) },
              { name: player2Name, value: finalDataStep.data.find((p) => p.name === player2Name)?.value || 0, isWinner: (finalDataStep.data.find((p) => p.name === player2Name)?.value || 0) > (finalDataStep.data.find((p) => p.name === player1Name)?.value || 0) },
            ].map((p, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: '4vh', fontWeight: 'bold',
                color: p.isWinner ? 'gold' : '#fff', transform: p.isWinner ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.5s',
              }}>{p.name}<br />{p.value} 🏆</div>
            ))}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export default SoccerSize;