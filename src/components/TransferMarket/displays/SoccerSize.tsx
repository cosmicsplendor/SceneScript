import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  AbsoluteFill,
  Img,
  interpolate,
  Easing,
} from 'remotion';

// --- (Interfaces remain the same) ---
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
  titleText?: string;
  hookDuration?: number;
  stepDuration?: number;
  trophyImage?: string;
  useParticles?: boolean;
  particleCount?: number;
  metricBoxYOffset?: number;
  fadeDuration?: number;
  titleCardDuration?: number;
  resetDuration?: number;
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
  player1Scale = 3,
  player2Scale = 3,
  basePlayerHeight = 25,
  imageMappers = {
    Messi: (value: number) => staticFile(`images/mess${Math.min(value, 8) + 1}.png`),
    Ronaldo: (value: number) => staticFile(`images/ron${Math.min(value, 5) + 1}.png`),
  },
  imageGrowthFactors = {
    Messi: Array(9).fill(0).map((_, i) => 1 + i * 0.05),
    Ronaldo: Array(6).fill(0).map((_, i) => 1 + i * 0.055),
  },
  backgroundUrl = staticFile('images/beach_dawn.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  player1TrophyLaneX = 230,
  player2TrophyLaneX = 850,
  trophyStartDepth = 0,
  trophySpeed = 1.4,
  celebrationDuration = 1,
  breathingRate = (value: number) => 0.8 + value * 0.05,
  breathingAmplitude = (value: number) => 0.02 + value * 0.002,
  titleText = "If Ballon d'Or Made You Bigger",
  hookDuration = 1.5,
  stepDuration = 2,
  trophyImage = staticFile('images/ballondor_trophy.png'),
  useParticles = true,
  particleCount = 30,
  metricBoxYOffset = -1100,
  fadeDuration = 0.5,
  titleCardDuration = 2.5,
  resetDuration = 1.0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  const getInterpolatedGrowthFactor = (name: string, visualValue: number): number => {
    const factors = imageGrowthFactors?.[name];
    if (!factors || factors.length === 0) return 1.0;
    const clampedValue = Math.max(0, Math.min(visualValue, factors.length - 1));
    const lowerIndex = Math.floor(clampedValue);
    const upperIndex = Math.ceil(clampedValue);
    if (lowerIndex === upperIndex) return factors[lowerIndex];
    return lerp(factors[lowerIndex], factors[upperIndex], clampedValue - lowerIndex);
  };

  const finalDataStep = data[data.length - 1];
  const hookTargetValue = Math.min(
    finalDataStep.data.find((p) => p.name === player1Name)?.value || 0,
    finalDataStep.data.find((p) => p.name === player2Name)?.value || 0
  );
    
  const hookEndTime = hookDuration;
  const resetEndTime = hookEndTime + resetDuration;
  const mainStartTime = resetEndTime;
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = mainStartTime + totalMainDuration;

  const isHook = timeInSeconds < hookEndTime;
  const isReset = timeInSeconds >= hookEndTime && timeInSeconds < resetEndTime;
  const isMain = timeInSeconds >= mainStartTime && timeInSeconds < mainEndTime;
  const isEndCard = timeInSeconds >= mainEndTime;

  let visualPlayer1Value = 0, visualPlayer2Value = 0;
  let displayPlayer1Value = 0, displayPlayer2Value = 0;
  let spriteIndex1 = 0, spriteIndex2 = 0;
  let activePlayer: string | null = null;
  let isPlayerTurn = false;
  let currentDate = '';
  let stepTime = 0;

  const UNIFIED_START_VALUE = 0;

  if (isHook) {
    const syncValue = interpolate(timeInSeconds, [0, hookDuration], [UNIFIED_START_VALUE, hookTargetValue]);
    visualPlayer1Value = syncValue;
    visualPlayer2Value = syncValue;
    spriteIndex1 = Math.floor(syncValue);
    spriteIndex2 = Math.floor(syncValue);
    currentDate = 'Fast Forward...';
  } else if (isReset) {
    // --- FINAL FIX: Animate down to the TRUE initial state (value 0) for both size and sprite ---
    const syncValue = interpolate(timeInSeconds, [hookEndTime, resetEndTime], [hookTargetValue, UNIFIED_START_VALUE], {
      easing: Easing.inOut(Easing.quad),
    });
    visualPlayer1Value = syncValue;
    visualPlayer2Value = syncValue;
    // Set the sprite to the true zero state. No flicker.
    spriteIndex1 = UNIFIED_START_VALUE;
    spriteIndex2 = UNIFIED_START_VALUE;
    displayPlayer1Value = 0;
    displayPlayer2Value = 0;
  } else if (isMain) {
    const mainTime = timeInSeconds - mainStartTime;
    stepTime = mainTime % stepDuration;
    const currentStepIndex = Math.min(Math.floor(mainTime / stepDuration), data.length - 1);
    const currentDataStep = data[currentStepIndex];
    currentDate = currentDataStep.date;
    const targetPlayer1Value = currentDataStep.data.find((p) => p.name === player1Name)?.value || 0;
    const targetPlayer2Value = currentDataStep.data.find((p) => p.name === player2Name)?.value || 0;
    
    const prevDataStep = data[currentStepIndex - 1];
    const prevPlayer1Value = prevDataStep?.data.find((d) => d.name === player1Name)?.value ?? 0;
    const prevPlayer2Value = prevDataStep?.data.find((d) => d.name === player2Name)?.value ?? 0;
    
    if (targetPlayer1Value > prevPlayer1Value) activePlayer = player1Name;
    else if (targetPlayer2Value > prevPlayer2Value) activePlayer = player2Name;
    
    isPlayerTurn = activePlayer !== null && (stepTime / stepDuration) < (trophySpeed + celebrationDuration) / stepDuration;
    
    const getVal = (name: string, target: number, prev: number) => (isPlayerTurn && activePlayer === name && stepTime < trophySpeed) ? prev : target;
    displayPlayer1Value = getVal(player1Name, targetPlayer1Value, prevPlayer1Value);
    displayPlayer2Value = getVal(player2Name, targetPlayer2Value, prevPlayer2Value);
    visualPlayer1Value = displayPlayer1Value;
    visualPlayer2Value = displayPlayer2Value;
    spriteIndex1 = displayPlayer1Value;
    spriteIndex2 = displayPlayer2Value;
  } else { // isEndCard
    visualPlayer1Value = finalDataStep.data.find((p) => p.name === player1Name)?.value || 0;
    visualPlayer2Value = finalDataStep.data.find((p) => p.name === player2Name)?.value || 0;
    displayPlayer1Value = visualPlayer1Value;
    displayPlayer2Value = visualPlayer2Value;
    spriteIndex1 = displayPlayer1Value;
    spriteIndex2 = displayPlayer2Value;
    currentDate = "For More GOAT Matchups SUBSCRIBE 🚀";
  }

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

  const hookEndFrame = hookEndTime * fps;
  const resetEndFrame = resetEndTime * fps;
  const titleFadeInEndFrame = hookEndFrame + fadeDuration * fps;
  const titleVisibleUntilFrame = titleFadeInEndFrame + titleCardDuration * fps;
  const titleFadeOutEndFrame = titleVisibleUntilFrame + fadeDuration * fps;
  const scoreFadeInEndFrame = resetEndFrame + fadeDuration * fps;
  
  const fastForwardOpacity = interpolate(frame, [hookEndFrame - (fadeDuration * fps), hookEndFrame], [1, 0], { extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [hookEndFrame, titleFadeInEndFrame, titleVisibleUntilFrame, titleFadeOutEndFrame], [0, 1, 1, 0]);
  const scoreOpacity = interpolate(frame, [resetEndFrame, scoreFadeInEndFrame], [0, 1]);

  const players = [
    { proj: player1Proj, name: player1Name, visualValue: visualPlayer1Value, displayValue: displayPlayer1Value, spriteIndex: spriteIndex1, scale: player1Scale, pos: player1Position },
    { proj: player2Proj, name: player2Name, visualValue: visualPlayer2Value, displayValue: displayPlayer2Value, spriteIndex: spriteIndex2, scale: player2Scale, pos: player2Position },
  ];
  
  const trophyAnim = (() => {
    if (!isPlayerTurn || !activePlayer) return null;
    const trophyProgress = Math.min(stepTime / trophySpeed, 1);
    if (trophyProgress >= 1) return null;
    const targetPos = activePlayer === player1Name ? player1Position : player2Position;
    const trophyLaneX = activePlayer === player1Name ? player1TrophyLaneX : player2TrophyLaneX;
    const trophyProj = project2D5(trophyLaneX, lerp(trophyStartDepth, targetPos.z, trophyProgress));
    return { x: trophyProj.x, y: trophyProj.y, scale: trophyProj.scale * 3, progress: trophyProgress };
  })();
  const generateParticles = (count = particleCount) => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, delay: Math.random() * 0.4 }));
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src={backgroundUrl} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      
      <AbsoluteFill style={{ alignItems: 'center', zIndex: 10, opacity: titleOpacity }}>
        <div style={{ marginTop: '5%', fontSize: '48px', fontWeight: 'bold', color: '#fff', textShadow: '3px 3px 6px rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1vh 3vw', borderRadius: '15px' }}>
          {titleText}
        </div>
      </AbsoluteFill>

      {(isHook || isEndCard) && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10, opacity: isHook ? fastForwardOpacity : 1 }}>
          <div style={{ position: 'absolute', top: isHook ? '12%': "6%", fontSize: '5vh', fontWeight: '900', textAlign: "center", color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            {currentDate}
          </div>
        </AbsoluteFill>
      )}

      {players.map((p, i) => {
        const growthFactor = getInterpolatedGrowthFactor(p.name, p.visualValue);
        const dynamicHeight = basePlayerHeight * p.proj.scale * growthFactor;
        const breathingScale = getBreathingScale(p.visualValue);
        
        return (
          <div key={i} style={{
            position: 'absolute', left: p.proj.x, top: p.proj.y,
            transform: `translateX(-50%) translateY(-100%) scale(${p.scale * breathingScale})`,
            transformOrigin: 'bottom center',
            zIndex: Math.round(p.pos.z),
            height: `${dynamicHeight}vh`,
          }}>
            <Img src={imageMappers[p.name](p.spriteIndex)} alt={p.name} style={{
              display: 'block', height: '100%', width: 'auto', objectFit: 'contain',
              filter: activePlayer === p.name ? 'drop-shadow(0 0 25px #00ff00)' : 'none',
            }} />
          </div>
        );
      })}

      {!isEndCard && players.map((p, i) => (
        <div key={`metric-${i}`} style={{
          position: 'absolute',
          left: p.proj.x + (i * 2 * 200) - 200,
          top: p.proj.y + metricBoxYOffset,
          transform: `translateX(-50%)`,
          zIndex: Math.round(p.pos.z) + 1,
          backgroundColor: 'white',
          borderRadius: "12px",
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scoreOpacity,
        }}>
          <span style={{ color: '#000', fontSize: '100px', fontWeight: 'bold', transform: 'translateY(0.08em)' }}>
            {p.displayValue}
          </span>
        </div>
      ))}
      
      {trophyAnim && (
        <div style={{ position: 'absolute', left: trophyAnim.x, top: trophyAnim.y, transform: `translateX(-50%) translateY(-50%) scale(${trophyAnim.scale})`, zIndex: 9999, filter: `brightness(${1 + trophyAnim.progress * 2}) drop-shadow(0 0 ${30 * trophyAnim.progress}px gold)` }}>
          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '0px', fontSize: '64px', fontWeight: '900', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', WebkitTextStroke: '4px rgba(0, 0, 0, 0.9)', textStroke: '4px rgba(0, 0, 0, 0.9)', }}>{currentDate}</div>
          <Img src={trophyImage} style={{ width: '8vh', height: 'auto' }} />
          {useParticles && generateParticles().map((particle, i) => (
            <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: '6px', height: '6px', backgroundColor: '#ffd700', borderRadius: '50%', opacity: Math.max(0, 1 - trophyAnim.progress - particle.delay), transform: `translate(${particle.x}px, ${particle.y}px) scale(${1.5 - trophyAnim.progress})`, boxShadow: '0 0 10px #ffd700', }} />
          ))}
        </div>
      )}
      {isPlayerTurn && !isHook && (() => {
        const popupProgress = Math.min(Math.max(0, (stepTime - trophySpeed) / celebrationDuration), 1);
        if (popupProgress === 0 || popupProgress === 1) return null;
        const targetProj = activePlayer === player1Name ? player1Proj : player2Proj;
        const popUpScale = 1 + Math.sin(popupProgress * Math.PI) * 0.5;
        return (
          <div style={{ position: 'absolute', left: targetProj.x, top: targetProj.y - 180, transform: `translateX(-50%) translateY(${-popupProgress * 100}px) scale(${popUpScale})`, fontSize: '10vh', fontWeight: 'bold', color: '#00ff00', textShadow: '3px 3px 0px #000, 0 0 20px #00ff00', opacity: 1 - popupProgress, zIndex: 9999, }}>+1</div>
        );
      })()}
      {isEndCard && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5vw', background: 'rgba(0,0,0,0.85)', padding: '4vh 6vw', borderRadius: '20px', border: '2px solid #fff' }}>
            {[
              { name: player1Name, value: finalDataStep.data.find((p) => p.name === player1Name)?.value || 0, isWinner: (finalDataStep.data.find((p) => p.name === player1Name)?.value || 0) >= (finalDataStep.data.find((p) => p.name === player2Name)?.value || 0) },
              { name: player2Name, value: finalDataStep.data.find((p) => p.name === player2Name)?.value || 0, isWinner: (finalDataStep.data.find((p) => p.name === player2Name)?.value || 0) > (finalDataStep.data.find((p) => p.name === player1Name)?.value || 0) },
            ].map((p, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '4vh', fontWeight: 'bold', color: p.isWinner ? 'gold' : '#fff', transform: p.isWinner ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.5s', }}>{p.name}<br />{p.value} 🏆</div>
            ))}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export default SoccerSize;