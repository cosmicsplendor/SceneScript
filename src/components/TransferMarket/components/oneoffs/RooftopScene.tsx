import React from 'react';
import {
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
} from 'remotion';

const RooftopScene = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Configuration object - all timing in seconds and positioning configurable
  const config = {
    // Image sources with individual dimensions
    sprites: {
      background: {
        src: 'images/bg.png',
        width: width,
        height: height * 0.6, // Adjust as needed
      },
      building: {
        src: 'images/rooftop.png',
        width: 1600,
        height: 384,
      },
      ronaldo: {
        standing: {
          src: 'images/ronaldo1.png',
          width: 229,
          height: 722,
        },
        pushing: {
          src: 'images/ronaldo2.png',
          width: 419,
          height: 619,
        },
      },
      messi: {
        standing: {
          src: 'images/messi1.png',
          width: 262,
          height: 646,
        },
        pushing: {
          src: 'images/messi2.png',
          width: 404,
          height: 645,
        },
      },
    },

    // Timing configuration (in seconds, relative to scene start)
    timing: {
      sceneStart: 0,
      raceBeginSlide: { start: 0, duration: 1.0 },
      bgFade: { start: 0, duration: 1.0 },
      buildingEntry: { start: 1.0, duration: 2.0 },
      hold: { start: 3.0, duration: 3.0 },
      ronaldoPushStart: { start: 6.0, duration: 1.5 },
      messiPush: { start: 9.0, duration: 2.0 },
      ronaldoFall: { start: 11, duration: 3.0 },
    },

    // Position configuration
    positions: {
      buildingStartY: height + 200,
      buildingFinalY: height - 384,
      buildingRightEdge: width,
      playerSpacing: 400, // Reduced from 600 to make interaction more visible
      pushDistance: 400, // Reduced from 500 to make it more realistic
      fallRotation: -30,
      // Collision detection threshold
      collisionThreshold: 300,
      // Anchor points for sprites (0.5 = center, 0 = left, 1 = right)
      spriteAnchor: {
        x: 0.5, // Center horizontally
        y: 1.0, // Bottom vertically
      },
    },
  };

  // Helper function to convert seconds to frames
  const secondsToFrames = (seconds) => seconds * fps;

  // Helper function to get current time in seconds
  const currentTime = frame / fps;

  // Helper function to interpolate values
  const interpolate = (input, inputRange, outputRange, easing = null) => {
    if (input <= inputRange[0]) return outputRange[0];
    if (input >= inputRange[1]) return outputRange[1];

    let progress = (input - inputRange[0]) / (inputRange[1] - inputRange[0]);
    
    if (easing) {
      progress = easing(progress);
    }

    return outputRange[0] + (outputRange[1] - outputRange[0]) * progress;
  };

  // Easing functions
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  // Helper function to get sprite position based on anchor point
  const getAnchoredPosition = (targetX, targetY, spriteWidth, spriteHeight, anchorX = 0.5, anchorY = 1.0) => {
    return {
      x: targetX - (spriteWidth * anchorX),
      y: targetY - (spriteHeight * anchorY),
    };
  };

  // Helper function to get progress within a time range
  const getTimeProgress = (startTime, duration) => {
    if (currentTime < startTime) return 0;
    if (currentTime > startTime + duration) return 1;
    return (currentTime - startTime) / duration;
  };

  // --- ANIMATION LOGIC ---

  // "Race Begin" text box slide-in animation
  const raceBeginProgress = getTimeProgress(
    config.timing.raceBeginSlide.start,
    config.timing.raceBeginSlide.duration
  );
  const raceBeginX = interpolate(
    raceBeginProgress,
    [0, 1],
    [-400, 40],
    easeOut
  );

  // Background opacity
  const bgOpacity = interpolate(
    getTimeProgress(config.timing.bgFade.start, config.timing.bgFade.duration),
    [0, 1],
    [0, 1]
  );

  // Building Y position with easing
  const buildingProgress = getTimeProgress(
    config.timing.buildingEntry.start,
    config.timing.buildingEntry.duration
  );
  const buildingY = interpolate(
    buildingProgress,
    [0, 1],
    [config.positions.buildingStartY, config.positions.buildingFinalY],
    easeInOut
  );

  // Calculate building and player anchor points
  const buildingX = config.positions.buildingRightEdge - config.sprites.building.width;
  const buildingCenterX = buildingX + config.sprites.building.width / 2;
  const playerAnchorY = buildingY + 150; // Standing on building

  // --- SIMPLIFIED PHYSICS LOGIC ---
  
  // Base positions (where players start)
  const baseRonaldoX = buildingCenterX - config.positions.playerSpacing / 2;
  const baseMessiX = buildingCenterX + config.positions.playerSpacing / 2;

  // Get animation progress values
  const ronaldoPushProgress = getTimeProgress(
    config.timing.ronaldoPushStart.start,
    config.timing.ronaldoPushStart.duration
  );
  
  const messiPushProgress = getTimeProgress(
    config.timing.messiPush.start,
    config.timing.messiPush.duration
  );

  // Calculate Ronaldo's movement during his push
  const ronaldoPushMovement = ronaldoPushProgress * config.positions.pushDistance;
  
  // Calculate how much Ronaldo pushes Messi
  // Messi only moves when Ronaldo has moved far enough to reach him
  const distanceBetweenPlayers = baseMessiX - baseRonaldoX;
  const ronaldoReachDistance = distanceBetweenPlayers - config.positions.collisionThreshold;
  
  let messiPushBackMovement = 0;
  if (ronaldoPushMovement > ronaldoReachDistance) {
    // Ronaldo has reached Messi, so Messi gets pushed
    messiPushBackMovement = (ronaldoPushMovement - ronaldoReachDistance) * 0.8; // Messi moves 80% of the push force
  }

  // Calculate Messi's counter-push movement
  const messiCounterPushMovement = messiPushProgress * config.positions.pushDistance * 1.2; // Messi pushes back harder

  // Final positions
  const ronaldoFinalX = baseRonaldoX + ronaldoPushMovement - messiCounterPushMovement; // Ronaldo gets pushed back by Messi
  const messiFinalX = baseMessiX + messiPushBackMovement - messiCounterPushMovement; // Messi moves towards Ronaldo when counter-pushing

  // Ronaldo fall animation
  const fallProgress = getTimeProgress(
    config.timing.ronaldoFall.start,
    config.timing.ronaldoFall.duration
  );
  const ronaldoFallY = playerAnchorY + fallProgress * fallProgress * 2000;
  const ronaldoFallRotation = fallProgress * config.positions.fallRotation;

  // Determine current phase and visibility
  const getCurrentPhase = () => {
    if (currentTime < config.timing.ronaldoPushStart.start) return 'initial';
    if (currentTime < config.timing.messiPush.start) return 'ronaldo-pushing';
    if (currentTime < config.timing.ronaldoFall.start) return 'messi-pushing';
    return 'ronaldo-falling';
  };
  const currentPhase = getCurrentPhase();

  // Final anchor positions
  const ronaldoAnchorX = ronaldoFinalX;
  const ronaldoAnchorY = currentPhase === 'ronaldo-falling' ? ronaldoFallY : playerAnchorY;
  const messiAnchorX = messiFinalX;
  const messiAnchorY = playerAnchorY;

  // --- SPRITE POSITIONING ---
  const ronaldoStandingPos = getAnchoredPosition(
    ronaldoAnchorX, ronaldoAnchorY, 
    config.sprites.ronaldo.standing.width, config.sprites.ronaldo.standing.height,
    config.positions.spriteAnchor.x, config.positions.spriteAnchor.y
  );
  const ronaldoPushingPos = getAnchoredPosition(
    ronaldoAnchorX, ronaldoAnchorY,
    config.sprites.ronaldo.pushing.width, config.sprites.ronaldo.pushing.height,
    config.positions.spriteAnchor.x, config.positions.spriteAnchor.y
  );
  const messiStandingPos = getAnchoredPosition(
    messiAnchorX, messiAnchorY,
    config.sprites.messi.standing.width, config.sprites.messi.standing.height,
    config.positions.spriteAnchor.x, config.positions.spriteAnchor.y
  );
  const messiPushingPos = getAnchoredPosition(
    messiAnchorX, messiAnchorY,
    config.sprites.messi.pushing.width, config.sprites.messi.pushing.height,
    config.positions.spriteAnchor.x, config.positions.spriteAnchor.y
  );

  // Z-index management
  const ronaldoZIndex = currentPhase === 'ronaldo-falling' ? 100 : currentPhase === 'messi-pushing' ? 102 : 103;
  const messiZIndex = currentPhase === 'messi-pushing' ? 104 : 103;
  const buildingZIndex = 101;

  // Visibility conditions
  const showBuilding = currentTime >= config.timing.buildingEntry.start;
  const isSceneActive = currentTime >= config.timing.buildingEntry.start;
  const isRonaldoFalling = currentPhase === 'ronaldo-falling';

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: 'linear-gradient(to bottom, #1a2347, #302b4c)',
      }}
    >
      {/* Background Cityscape */}
      <img
        src={staticFile(config.sprites.background.src)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: config.sprites.background.width,
          height: config.sprites.background.height,
          opacity: bgOpacity,
          zIndex: 0,
        }}
      />

      {/* Building */}
      {showBuilding && (
        <img
          src={staticFile(config.sprites.building.src)}
          style={{
            position: 'absolute',
            left: buildingX,
            top: buildingY,
            width: config.sprites.building.width,
            height: config.sprites.building.height,
            zIndex: buildingZIndex,
          }}
        />
      )}
      
      {/* Ronaldo (Standing) */}
      {isSceneActive && currentPhase !== 'ronaldo-pushing' && (
         <img
          src={staticFile(config.sprites.ronaldo.standing.src)}
          style={{
            position: 'absolute',
            left: ronaldoStandingPos.x,
            top: ronaldoStandingPos.y,
            width: config.sprites.ronaldo.standing.width,
            height: config.sprites.ronaldo.standing.height,
            zIndex: ronaldoZIndex,
            transform: isRonaldoFalling ? `rotate(${ronaldoFallRotation}deg)` : 'none',
            transformOrigin: 'bottom center',
          }}
        />
      )}

      {/* Ronaldo (Pushing) */}
      {isSceneActive && currentPhase === 'ronaldo-pushing' && (
         <img
          src={staticFile(config.sprites.ronaldo.pushing.src)}
          style={{
            position: 'absolute',
            left: ronaldoPushingPos.x,
            top: ronaldoPushingPos.y,
            width: config.sprites.ronaldo.pushing.width,
            height: config.sprites.ronaldo.pushing.height,
            zIndex: ronaldoZIndex,
          }}
        />
      )}

      {/* Messi (Standing) */}
      {isSceneActive && currentPhase !== 'messi-pushing' && (
        <img
          src={staticFile(config.sprites.messi.standing.src)}
          style={{
            position: 'absolute',
            left: messiStandingPos.x,
            top: messiStandingPos.y,
            width: config.sprites.messi.standing.width,
            height: config.sprites.messi.standing.height,
            zIndex: messiZIndex,
          }}
        />
      )}
      
      {/* Messi (Pushing) */}
      {isSceneActive && currentPhase === 'messi-pushing' && (
        <img
          src={staticFile(config.sprites.messi.pushing.src)}
          style={{
            position: 'absolute',
            left: messiPushingPos.x,
            top: messiPushingPos.y,
            width: config.sprites.messi.pushing.width,
            height: config.sprites.messi.pushing.height,
            zIndex: messiZIndex,
          }}
        />
      )}

      {/* "Race Begin" Text Box */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: raceBeginX,
          backgroundColor: 'white',
          color: 'black',
          padding: '12px 24px',
          borderRadius: '12px',
          borderBottomLeftRadius: 0,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '32px',
          fontWeight: 'bold',
          zIndex: 1000,
        }}
      >
        Race Begin
      </div>
    </AbsoluteFill>
  );
};

export default RooftopScene;