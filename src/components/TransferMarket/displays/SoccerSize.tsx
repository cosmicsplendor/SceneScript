import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

const SoccerSize = ({
  // Data
  data = [
    { date: "2008", data: [{ name: "Ronaldo", value: 1 }] },
    { date: "2009", data: [{ name: "Messi", value: 1 }, { name: "Ronaldo", value: 1 }] },
   
  ],
  
  // Player Configuration
  player1Name = "Messi",
  player2Name = "Ronaldo",
  player1Position = { x: 200, z: 100 }, // Left side
  player2Position = { x: 600, z: 100 }, // Right side
  player1Scale = 1,
  player2Scale = 1,
  
  // Image Mappers
  imageMappers = {
    Messi: (value) => staticFile(`images/mess${value || 1}.png`),
    Ronaldo: (value) => staticFile(`images/ron${value || 1}.png`)
  },
  
  // 2.5D World Configuration
  backgroundUrl = staticFile("images/background.png"),
  fov = 75, // Field of view in degrees
  cameraHeight = 300, // Camera height in pixels
  
  // Trophy/Reward Configuration
  trophyEntryPoint = { x: 400, z: 500 }, // Center, deep in screen
  trophySpeed = 2, // seconds to reach player
  celebrationDuration = 1.5, // seconds
  
  // Breathing Effect
  breathingRate = (value) => 0.8 + (value * 0.1), // Hz
  breathingAmplitude = (value) => 0.02 + (value * 0.005), // Scale factor
  
  // Physical Transformation Mapping
  physicalMetric = (value) => `+${value * 25}kg`,
  titleText = "Ballon d'Or = +10kg",
  
  // Timing Configuration
  hookDuration = 1, // seconds for quick cut hook
  stepDuration = 3, // seconds per data step
  
  // Trophy Configuration
  trophyImage = staticFile("images/trophy.png"),
  
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
  
  let currentPlayer1Value, currentPlayer2Value, currentStepIndex, isPlayerTurn, activePlayer;
  
  if (isHook) {
    // Hook phase - quick animation to minimum final value
    const progress = timeInSeconds / hookDuration;
    currentPlayer1Value = Math.floor(progress * minFinalValue);
    currentPlayer2Value = Math.floor(progress * minFinalValue);
    isPlayerTurn = false;
    activePlayer = null;
  } else {
    // Main sequence
    const mainTime = timeInSeconds - mainStartTime;
    currentStepIndex = Math.floor(mainTime / stepDuration);
    
    if (currentStepIndex >= data.length) {
      // End state
      currentPlayer1Value = finalPlayer1;
      currentPlayer2Value = finalPlayer2;
      isPlayerTurn = false;
      activePlayer = null;
    } else {
      const currentData = data[currentStepIndex].data;
      currentPlayer1Value = currentData.find(p => p.name === player1Name)?.value || 0;
      currentPlayer2Value = currentData.find(p => p.name === player2Name)?.value || 0;
      
      // Determine if it's a player's turn (value increased)
      const prevData = currentStepIndex > 0 ? data[currentStepIndex - 1].data : [];
      const prevPlayer1Value = prevData.find(p => p.name === player1Name)?.value || 0;
      const prevPlayer2Value = prevData.find(p => p.name === player2Name)?.value || 0;
      
      if (currentPlayer1Value > prevPlayer1Value) {
        activePlayer = player1Name;
        isPlayerTurn = true;
      } else if (currentPlayer2Value > prevPlayer2Value) {
        activePlayer = player2Name;
        isPlayerTurn = true;
      } else {
        isPlayerTurn = false;
        activePlayer = null;
      }
    }
  }
  
  // 2.5D Projection Helper
  const project2D5 = (x, z) => {
    const fovRad = (fov * Math.PI) / 180;
    const distance = z + cameraHeight;
    const scale = cameraHeight / distance;
    return {
      x: width / 2 + (x - width / 2) * scale,
      y: height - cameraHeight * scale,
      scale: scale
    };
  };
  
  // Calculate breathing effect
  const getBreathingScale = (playerValue) => {
    const rate = breathingRate(playerValue);
    const amplitude = breathingAmplitude(playerValue);
    const breathCycle = Math.sin(timeInSeconds * rate * 2 * Math.PI);
    return 1 + (breathCycle * amplitude);
  };
  
  // Project player positions
  const player1Proj = project2D5(player1Position.x, player1Position.z);
  const player2Proj = project2D5(player2Position.x, player2Position.z);
  
  // Trophy animation
  const getTrophyAnimation = () => {
    if (!isPlayerTurn || isHook) return null;
    
    const stepTime = (timeInSeconds - mainStartTime) % stepDuration;
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
  const generateParticles = (centerX, centerY, count = particleCount) => {
    const particles = [];
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
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      {/* Background */}
      <img
        src={backgroundUrl}
        alt="Background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1
        }}
      />
      
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        zIndex: 10
      }}>
        {titleText}
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
        transition: isHook ? 'none' : 'transform 0.5s ease'
      }}>
        <img
          src={imageMappers[player1Name](currentPlayer1Value)}
          alt={player1Name}
          style={{
            display: 'block',
            maxWidth: '150px',
            height: 'auto'
          }}
        />
        
        {/* Player 1 Pointer */}
        {activePlayer === player1Name && (
          <>
            <div style={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: `translateX(-50%) translateY(${Math.sin(timeInSeconds * 3) * 5}px)`,
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '20px solid #00ff00',
              filter: 'drop-shadow(0 0 10px #00ff00)',
              zIndex: 6
            }} />
            
            {/* Score Display */}
            <div style={{
              position: 'absolute',
              top: -100,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: 16,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
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
        transition: isHook ? 'none' : 'transform 0.5s ease'
      }}>
        <img
          src={imageMappers[player2Name](currentPlayer2Value)}
          alt={player2Name}
          style={{
            display: 'block',
            maxWidth: '150px',
            height: 'auto'
          }}
        />
        
        {/* Player 2 Pointer */}
        {activePlayer === player2Name && (
          <>
            <div style={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: `translateX(-50%) translateY(${Math.sin(timeInSeconds * 3) * 5}px)`,
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '20px solid #00ff00',
              filter: 'drop-shadow(0 0 10px #00ff00)',
              zIndex: 6
            }} />
            
            {/* Score Display */}
            <div style={{
              position: 'absolute',
              top: -100,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: 16,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
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
            scale(${trophyAnim.scale})
            rotate(${trophyAnim.progress * 360}deg)
          `,
          zIndex: 4,
          filter: `brightness(${1 + trophyAnim.progress}) drop-shadow(0 0 ${20 * trophyAnim.progress}px gold)`
        }}>
          <img
            src={trophyImage}
            alt="Trophy"
            style={{
              width: '60px',
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
                width: '4px',
                height: '4px',
                backgroundColor: '#ffd700',
                borderRadius: '50%',
                opacity: Math.max(0, 1 - trophyAnim.progress - particle.delay),
                transform: `scale(${1 - trophyAnim.progress})`,
                boxShadow: '0 0 6px #ffd700'
              }}
            />
          ))}
        </div>
      )}
      
      {/* +1 Popup Animation */}
      {isPlayerTurn && !isHook && (() => {
        const stepTime = (timeInSeconds - mainStartTime) % stepDuration;
        const popupProgress = Math.min((stepTime - trophySpeed) / celebrationDuration, 1);
        
        if (popupProgress <= 0 || popupProgress >= 1) return null;
        
        const targetProj = activePlayer === player1Name ? player1Proj : player2Proj;
        
        return (
          <div style={{
            position: 'absolute',
            left: targetProj.x,
            top: targetProj.y - 120,
            transform: `
              translateX(-50%) translateY(${-popupProgress * 50}px)
              scale(${1 + popupProgress * 0.5})
            `,
            fontSize: 48,
            fontWeight: 'bold',
            color: '#00ff00',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
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
          bottom: 50,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 50,
          zIndex: 8
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            padding: '15px 25px',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            {player1Name}: {finalPlayer1} 🏆
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            padding: '15px 25px',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            {player2Name}: {finalPlayer2} 🏆
          </div>
        </div>
      )}
    </div>
  );
};

export default SoccerSize;