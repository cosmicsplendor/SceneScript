import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile, AbsoluteFill } from 'remotion';

// TypeScript Interfaces
interface PlayerData {
  name: string;
  value: number;
}

interface DataStep {
  date: string;
  data: PlayerData[];
}

interface Position3D {
  x: number;
  z: number;
}

interface TrophyAnimation {
  x: number;
  y: number;
  scale: number;
  progress: number;
}

interface Particle {
  x: number;
  y: number;
  delay: number;
}

interface SoccerSizeProps {
  data?: DataStep[];
  player1Name?: string;
  player2Name?: string;
  player1Position?: Position3D;
  player2Position?: Position3D;
  player1Scale?: number;
  player2Scale?: number;
  imageMappers?: {
    [key: string]: (value: number) => string;
  };
  backgroundUrl?: string;
  fov?: number;
  cameraHeight?: number;
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

const SoccerSize: React.FC<SoccerSizeProps> = ({
  // Data - Updated with more realistic progression
  data = [
    { date: "2008", data: [{ name: "Ronaldo", value: 1 }, { name: "Messi", value: 0 }] },
    { date: "2009", data: [{ name: "Ronaldo", value: 1 }, { name: "Messi", value: 1 }] },
    { date: "2010", data: [{ name: "Ronaldo", value: 1 }, { name: "Messi", value: 2 }] },
    { date: "2011", data: [{ name: "Ronaldo", value: 1 }, { name: "Messi", value: 3 }] },
    { date: "2012", data: [{ name: "Ronaldo", value: 1 }, { name: "Messi", value: 4 }] },
    { date: "2013", data: [{ name: "Ronaldo", value: 2 }, { name: "Messi", value: 4 }] },
    { date: "2014", data: [{ name: "Ronaldo", value: 3 }, { name: "Messi", value: 4 }] },
    { date: "2015", data: [{ name: "Ronaldo", value: 3 }, { name: "Messi", value: 5 }] },
    { date: "2016", data: [{ name: "Ronaldo", value: 4 }, { name: "Messi", value: 5 }] },
    { date: "2017", data: [{ name: "Ronaldo", value: 5 }, { name: "Messi", value: 5 }] }
  ],

  // Player Configuration
  player1Name = "Messi",
  player2Name = "Ronaldo",
  player1Position = { x: 300, z: 200 },
  player2Position = { x: 700, z: 200 },
  player1Scale = 1,
  player2Scale = 1,

  // Image Mappers
  imageMappers = {
    Messi: (value: number) => staticFile(`images/mess${Math.max(value, 1)}.png`),
    Ronaldo: (value: number) => staticFile(`images/ron${Math.max(value, 1)}.png`)
  },

  // 2.5D World Configuration
  backgroundUrl = staticFile("images/beach_dawn.png"),
  fov = 75,
  cameraHeight = 400,

  // Trophy/Reward Configuration
  trophyEntryPoint = { x: 500, z: 600 },
  trophySpeed = 2,
  celebrationDuration = 1.5,

  // Breathing Effect
  breathingRate = (value: number) => 0.8 + (value * 0.1),
  breathingAmplitude = (value: number) => 0.02 + (value * 0.005),

  // Physical Transformation Mapping
  physicalMetric = (value: number) => `+${value * 10}kg`,
  titleText = "Ballon d'Or = +10kg",

  // Timing Configuration
  hookDuration = 2,
  stepDuration = 3,

  // Trophy Configuration
  trophyImage = staticFile("images/ucl_trophy.png"),

  // Particle Effects
  useParticles = true,
  particleCount = 20
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  // Calculate final values for hook
  const finalData = data[data.length - 1].data;
  const finalPlayer1 = finalData.find(p => p.name === player1Name)?.value || 0;
  const finalPlayer2 = finalData.find(p => p.name === player2Name)?.value || 0;
  const minFinalValue = Math.min(finalPlayer1, finalPlayer2);

  // Determine current phase
  const isHook = timeInSeconds < hookDuration;
  const mainStartTime = hookDuration;
  const totalMainDuration = data.length * stepDuration;

  let currentPlayer1Value: number, currentPlayer2Value: number, currentStepIndex: number;
  let isPlayerTurn = false, activePlayer: string | null = null;

  if (isHook) {
    // Hook phase - animate to minimum final value
    const progress = Math.min(timeInSeconds / hookDuration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    currentPlayer1Value = Math.floor(easeProgress * minFinalValue);
    currentPlayer2Value = Math.floor(easeProgress * minFinalValue);
  } else {
    // Main sequence
    const mainTime = timeInSeconds - mainStartTime;
    currentStepIndex = Math.min(Math.floor(mainTime / stepDuration), data.length - 1);

    if (currentStepIndex >= 0 && currentStepIndex < data.length) {
      const currentData = data[currentStepIndex].data;
      currentPlayer1Value = currentData.find(p => p.name === player1Name)?.value || 0;
      currentPlayer2Value = currentData.find(p => p.name === player2Name)?.value || 0;

      // Determine if it's a player's turn
      if (currentStepIndex > 0) {
        const prevData = data[currentStepIndex - 1].data;
        const prevPlayer1Value = prevData.find(p => p.name === player1Name)?.value || 0;
        const prevPlayer2Value = prevData.find(p => p.name === player2Name)?.value || 0;

        const stepProgress = (mainTime % stepDuration) / stepDuration;

        if (currentPlayer1Value > prevPlayer1Value && stepProgress < 0.8) {
          activePlayer = player1Name;
          isPlayerTurn = true;
        } else if (currentPlayer2Value > prevPlayer2Value && stepProgress < 0.8) {
          activePlayer = player2Name;
          isPlayerTurn = true;
        }
      } else if (currentStepIndex === 0) {
        // First step - check initial values
        const stepProgress = (mainTime % stepDuration) / stepDuration;
        if (currentPlayer1Value > minFinalValue && stepProgress < 0.8) {
          activePlayer = player1Name;
          isPlayerTurn = true;
        } else if (currentPlayer2Value > minFinalValue && stepProgress < 0.8) {
          activePlayer = player2Name;
          isPlayerTurn = true;
        }
      }
    } else {
      // End state
      currentPlayer1Value = finalPlayer1;
      currentPlayer2Value = finalPlayer2;
    }
  }

  // 2.5D Projection Helper - Fixed to use full viewport
  const project2D5 = (x: number, z: number) => {
    const fovRad = (fov * Math.PI) / 180;
    const distance = Math.max(z, 50); // Prevent division by zero
    const scale = cameraHeight / (cameraHeight + distance);

    return {
      x: x * scale + (width * (1 - scale)) / 2,
      y: height * 0.8 - (cameraHeight * scale * 0.3), // Use more of viewport
      scale: scale
    };
  };

  // Calculate breathing effect
  const getBreathingScale = (playerValue: number): number => {
    const rate = breathingRate(playerValue);
    const amplitude = breathingAmplitude(playerValue);
    const breathCycle = Math.sin(timeInSeconds * rate * 2 * Math.PI);
    return 1 + (breathCycle * amplitude);
  };

  // Project player positions
  const player1Proj = project2D5(player1Position.x, player1Position.z);
  const player2Proj = project2D5(player2Position.x, player2Position.z);

  // Trophy animation
  const getTrophyAnimation = (): TrophyAnimation | null => {
    if (!isPlayerTurn || isHook) return null;

    const mainTime = timeInSeconds - mainStartTime;
    const stepTime = mainTime % stepDuration;
    const trophyProgress = Math.min(stepTime / trophySpeed, 1);

    if (trophyProgress >= 1) return null;

    const targetPos = activePlayer === player1Name ? player1Position : player2Position;
    const currentX = trophyEntryPoint.x + (targetPos.x - trophyEntryPoint.x) * trophyProgress;
    const currentZ = trophyEntryPoint.z + (targetPos.z - trophyEntryPoint.z) * trophyProgress;

    const trophyProj = project2D5(currentX, currentZ);

    return {
      x: trophyProj.x,
      y: trophyProj.y,
      scale: trophyProj.scale,
      progress: trophyProgress
    };
  };

  const trophyAnim = getTrophyAnimation();

  // Particle system for trophy
  const generateParticles = (centerX: number, centerY: number, count = particleCount): Particle[] => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      particles.push({ x, y, delay: Math.random() * 0.5 });
    }
    return particles;
  };

  return (
    <AbsoluteFill style={{
      overflow: 'hidden',
      backgroundColor: '#000',
      zIndex: 10e5

    }}>

      <img
        src={backgroundUrl}
        style={{
          // FIX: Ensure the background image covers the full screen.
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: Math.min(width * 0.04, 32),
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        zIndex: 10
      }}>
        {titleText}
      </div>

      {/* Debug Info */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '2%',
        color: '#fff',
        fontSize: Math.min(width * 0.02, 14),
        background: 'rgba(0,0,0,0.7)',
        padding: '8px',
        borderRadius: '4px',
        zIndex: 10
      }}>
        Time: {timeInSeconds.toFixed(1)}s | Step: {currentStepIndex || 0} | {player1Name}: {currentPlayer1Value} | {player2Name}: {currentPlayer2Value}
        <br />
        Hook: {isHook ? 'Yes' : 'No'} | Active: {activePlayer || 'None'} | Turn: {isPlayerTurn ? 'Yes' : 'No'}
        <br />
        Final Values: {finalPlayer1} vs {finalPlayer2} | Min: {minFinalValue}
      </div>

      {/* Player 1 */}
      <div style={{
        position: 'absolute',
        left: player1Proj.x,
        top: player1Proj.y,
        transform: `
          translateX(-50%) translateY(-100%)
          scale(${player1Scale * player1Proj.scale * getBreathingScale(currentPlayer1Value)})
        `,
        zIndex: 5,
        transition: isHook ? 'transform 0.3s ease' : 'transform 0.5s ease'
      }}>
        <img
          src={imageMappers[player1Name](currentPlayer1Value)}
          alt={player1Name}
          style={{
            display: 'block',
            width: Math.min(width * 0.15, 120) + 'px',
            height: 'auto'
          }}
        />

        {/* Player 1 Pointer */}
        {activePlayer === player1Name && (
          <>
            <div style={{
              position: 'absolute',
              top: -80,
              left: '50%',
              transform: `translateX(-50%) translateY(${Math.sin(timeInSeconds * 4) * 8}px)`,
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '30px solid #00ff00',
              filter: 'drop-shadow(0 0 15px #00ff00)',
              zIndex: 6
            }} />

            {/* Score Display */}
            <div style={{
              position: 'absolute',
              top: -140,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              padding: '10px 15px',
              borderRadius: '10px',
              fontSize: Math.min(width * 0.025, 18),
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: '2px solid #00ff00',
              zIndex: 6
            }}>
              {currentPlayer1Value} × 🏆 ({physicalMetric(currentPlayer1Value)})
            </div>
          </>
        )}
      </div>

      {/* Player 2 */}
      <div style={{
        position: 'absolute',
        left: player2Proj.x,
        top: player2Proj.y,
        transform: `
          translateX(-50%) translateY(-100%)
          scale(${player2Scale * player2Proj.scale * getBreathingScale(currentPlayer2Value)})
        `,
        zIndex: 5,
        transition: isHook ? 'transform 0.3s ease' : 'transform 0.5s ease'
      }}>
        <img
          src={imageMappers[player2Name](currentPlayer2Value)}
          alt={player2Name}
          style={{
            display: 'block',
            width: Math.min(width * 0.15, 120) + 'px',
            height: 'auto'
          }}
        />

        {/* Player 2 Pointer */}
        {activePlayer === player2Name && (
          <>
            <div style={{
              position: 'absolute',
              top: -80,
              left: '50%',
              transform: `translateX(-50%) translateY(${Math.sin(timeInSeconds * 4) * 8}px)`,
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '30px solid #00ff00',
              filter: 'drop-shadow(0 0 15px #00ff00)',
              zIndex: 6
            }} />

            {/* Score Display */}
            <div style={{
              position: 'absolute',
              top: -140,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              padding: '10px 15px',
              borderRadius: '10px',
              fontSize: Math.min(width * 0.025, 18),
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: '2px solid #00ff00',
              zIndex: 6
            }}>
              {currentPlayer2Value} × 🏆 ({physicalMetric(currentPlayer2Value)})
            </div>
          </>
        )}
      </div>

      {/* Trophy Animation */}
      {trophyAnim && (
        <div style={{
          position: 'absolute',
          left: trophyAnim.x,
          top: trophyAnim.y,
          transform: `
            translateX(-50%) translateY(-50%)
            scale(${trophyAnim.scale * 1.5})
            rotate(${trophyAnim.progress * 360}deg)
          `,
          zIndex: 4,
          filter: `brightness(${1.5 + trophyAnim.progress}) drop-shadow(0 0 ${30 * trophyAnim.progress}px gold)`
        }}>
          <img
            src={trophyImage}
            alt="Trophy"
            style={{
              width: Math.min(width * 0.08, 60) + 'px',
              height: 'auto'
            }}
          />

          {/* Trophy Particles */}
          {useParticles && generateParticles(0, 0).map((particle, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: particle.x,
                top: particle.y,
                width: '6px',
                height: '6px',
                backgroundColor: '#ffd700',
                borderRadius: '50%',
                opacity: Math.max(0, 1 - trophyAnim.progress - particle.delay),
                transform: `scale(${1.5 - trophyAnim.progress})`,
                boxShadow: '0 0 10px #ffd700'
              }}
            />
          ))}
        </div>
      )}

      {/* +1 Popup Animation */}
      {isPlayerTurn && !isHook && (() => {
        const mainTime = timeInSeconds - mainStartTime;
        const stepTime = mainTime % stepDuration;
        const popupProgress = Math.min(Math.max((stepTime - trophySpeed) / celebrationDuration, 0), 1);

        if (popupProgress <= 0 || popupProgress >= 1) return null;

        const targetProj = activePlayer === player1Name ? player1Proj : player2Proj;

        return (
          <div style={{
            position: 'absolute',
            left: targetProj.x,
            top: targetProj.y - 160,
            transform: `
              translateX(-50%) translateY(${-popupProgress * 80}px)
              scale(${1.5 + popupProgress * 0.8})
            `,
            fontSize: Math.min(width * 0.08, 60),
            fontWeight: 'bold',
            color: '#00ff00',
            textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
            opacity: 1 - popupProgress,
            zIndex: 7
          }}>
            +1
          </div>
        );
      })()}

      {/* Final Comparison (shown at the end) */}
      {timeInSeconds > mainStartTime + totalMainDuration && (
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: Math.min(width * 0.1, 80),
          zIndex: 8
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            padding: '20px 30px',
            borderRadius: '15px',
            textAlign: 'center',
            fontSize: Math.min(width * 0.03, 22),
            fontWeight: 'bold',
            border: finalPlayer1 > finalPlayer2 ? '3px solid gold' : '2px solid #444'
          }}>
            {player1Name}: {finalPlayer1} 🏆
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            padding: '20px 30px',
            borderRadius: '15px',
            textAlign: 'center',
            fontSize: Math.min(width * 0.03, 22),
            fontWeight: 'bold',
            border: finalPlayer2 > finalPlayer1 ? '3px solid gold' : '2px solid #444'
          }}>
            {player2Name}: {finalPlayer2} 🏆
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default SoccerSize;