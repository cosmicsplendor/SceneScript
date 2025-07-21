import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  AbsoluteFill,
  Img,
} from 'remotion';

// --- (Interfaces are unchanged) ---
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
  backgroundUrl?: string;
  horizonLine?: number;
  worldDepth?: number;
  farScale?: number;
  trophyEntryPoint?: Position3D;
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
}

// Linear interpolation helper
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
  player1Position = { x: 230, z: 190 },
  player2Position = { x: 1000, z: 190 },
  player1Scale = 2,
  player2Scale = 2,
  basePlayerHeight = 45,
  imageMappers = {
    Messi: (value: number) => staticFile(`images/mess${Math.max(value + 1, 0)}.png`),
    Ronaldo: (value: number) => staticFile(`images/ron${Math.max(value + 1, 0)}.png`),
  },
  backgroundUrl = staticFile('images/beach_dawn.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  trophyEntryPoint = { x: 500, z: 0 },
  trophySpeed = 2,
  celebrationDuration = 1,
  breathingRate = (value: number) => 0.8 + value * 0.05,
  breathingAmplitude = (value: number) => 0.02 + value * 0.002,
  physicalMetric = (value: number) => `+${value * 10}KG`,
  titleText = "Ballon d'Or = +10KG",
  hookDuration = 2,
  stepDuration = 3,
  trophyImage = staticFile('images/ucl_trophy.png'),
  useParticles = true,
  particleCount = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // --- (Animation state logic is unchanged) ---
  const finalDataStep = data[data.length - 1];
  const finalPlayer1Value = finalDataStep.data.find((p) => p.name === player1Name)?.value || 0;
  const finalPlayer2Value = finalDataStep.data.find((p) => p.name === player2Name)?.value || 0;
  const hookTargetValue = Math.min(finalPlayer1Value, finalPlayer2Value);
  const isHook = timeInSeconds < hookDuration;
  const mainStartTime = hookDuration;
  const totalMainDuration = data.length * stepDuration;
  const isEndCard = timeInSeconds >= mainStartTime + totalMainDuration;
  let currentPlayer1Value = 0; let currentPlayer2Value = 0; let activePlayer: string | null = null;
  let isPlayerTurn = false; let currentDate = '';
  if (isHook) {
    const p = Math.min(timeInSeconds / hookDuration, 1);
    currentPlayer1Value = Math.floor(p * hookTargetValue);
    currentPlayer2Value = Math.floor(p * hookTargetValue);
    currentDate = 'Fast Forward...';
  } else if (!isEndCard) {
    const mainTime = timeInSeconds - mainStartTime;
    const currentStepIndex = Math.min(Math.floor(mainTime / stepDuration), data.length - 1);
    const cData = data[currentStepIndex];
    currentDate = cData.date;
    currentPlayer1Value = cData.data.find((p) => p.name === player1Name)?.value || 0;
    currentPlayer2Value = cData.data.find((p) => p.name === player2Name)?.value || 0;
    const pData = currentStepIndex > 0 ? data[currentStepIndex - 1] : null;
    const pV1 = pData?.data.find((p) => p.name === player1Name)?.value ?? hookTargetValue;
    const pV2 = pData?.data.find((p) => p.name === player2Name)?.value ?? hookTargetValue;
    if (currentPlayer1Value > pV1) activePlayer = player1Name;
    else if (currentPlayer2Value > pV2) activePlayer = player2Name;
    const stepProgress = (mainTime % stepDuration) / stepDuration;
    isPlayerTurn = activePlayer !== null && stepProgress < (trophySpeed + celebrationDuration) / stepDuration;
  } else {
    currentPlayer1Value = finalPlayer1Value;
    currentPlayer2Value = finalPlayer2Value;
    currentDate = 'Final Score';
  }
  
  // --- (Helper functions are unchanged) ---
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
    const mainTime = timeInSeconds - mainStartTime;
    const stepTime = mainTime % stepDuration;
    const trophyProgress = Math.min(stepTime / trophySpeed, 1);
    if (trophyProgress >= 1) return null;
    const targetPos = activePlayer === player1Name ? player1Position : player2Position;
    const currentX = lerp(trophyEntryPoint.x, targetPos.x, trophyProgress);
    const currentZ = lerp(trophyEntryPoint.z, targetPos.z, trophyProgress);
    const trophyProj = project2D5(currentX, currentZ);
    return { x: trophyProj.x, y: trophyProj.y, scale: trophyProj.scale * 3, progress: trophyProgress };
  })();
  const generateParticles = (count = particleCount) => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, delay: Math.random() * 0.4 }));

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src={backgroundUrl} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}/>
      <AbsoluteFill style={{ alignItems: 'center', zIndex: 10 }}>
        <div style={{ marginTop: '5%', fontSize: '4.5vh', fontWeight: 'bold', color: '#fff', textShadow: '3px 3px 6px rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1vh 3vw', borderRadius: '15px' }}>{titleText}</div>
      </AbsoluteFill>
      
      {/* --- MODIFIED: The static date text now ONLY appears during the hook or end card. --- */}
      {(isHook || isEndCard) && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <div style={{ position: 'absolute', bottom: '22%', fontSize: '5vh', fontWeight: '900', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{currentDate}</div>
        </AbsoluteFill>
      )}

      {/* --- (Player rendering is unchanged) --- */}
      {[
        { proj: player1Proj, name: player1Name, value: currentPlayer1Value, scale: player1Scale, pos: player1Position },
        { proj: player2Proj, name: player2Name, value: currentPlayer2Value, scale: player2Scale, pos: player2Position },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.proj.x, top: p.proj.y,
          transform: `translateX(-50%) translateY(-100%) scale(${p.scale * getBreathingScale(p.value)})`,
          transformOrigin: 'bottom center',
          zIndex: Math.round(p.pos.z),
          height: `${basePlayerHeight * p.proj.scale}vh`,
          transition: 'height 0.3s ease-out, left 0.3s ease-out, top 0.3s ease-out',
        }}>
          <Img src={imageMappers[p.name](p.value)} alt={p.name} style={{
            display: 'block', height: '100%', width: 'auto', objectFit: 'contain',
            filter: activePlayer === p.name ? 'drop-shadow(0 0 25px #00ff00)' : 'none',
            transition: 'filter 0.3s',
          }}/>
          {activePlayer === p.name && (
            <div style={{
              position: 'absolute', top: '-25%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '10px 15px', borderRadius: '10px',
              fontSize: '20px', fontWeight: 'bold', whiteSpace: 'nowrap', border: '2px solid #00ff00',
            }}>{p.value} × 🏆 = {physicalMetric(p.value)}</div>
          )}
        </div>
      ))}
      
      {/* --- (Trophy rendering is unchanged, its logic already supports the new behavior) --- */}
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
            marginBottom: '20px',
            fontSize: '2vh',
            fontWeight: '900',
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}>
            {currentDate}
          </div>

          <Img src={trophyImage} style={{ width: '8vh', height: 'auto' }} />

          {useParticles && generateParticles().map((particle, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '6px',
              height: '6px',
              backgroundColor: '#ffd700',
              borderRadius: '50%',
              opacity: Math.max(0, 1 - trophyAnim.progress - particle.delay),
              transform: `translate(${particle.x}px, ${particle.y}px) scale(${1.5 - trophyAnim.progress})`,
              boxShadow: '0 0 10px #ffd700',
            }}/>
          ))}
        </div>
      )}

      {/* --- (The rest of the component is unchanged) --- */}
      {isPlayerTurn && !isHook && (() => {
        const mainTime = timeInSeconds - mainStartTime;
        const stepTime = mainTime % stepDuration;
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
              { name: player1Name, value: finalPlayer1Value, isWinner: finalPlayer1Value >= finalPlayer2Value },
              { name: player2Name, value: finalPlayer2Value, isWinner: finalPlayer2Value > finalPlayer1Value },
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