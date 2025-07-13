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
      ronaldoPush: { start: 6.0, duration: 1.5 },
      messiPush: { start: 9.0, duration: 2.0 },
      ronaldoFall: { start: 11.0, duration: 3.0 },
    },

    // Position configuration
    positions: {
      buildingStartY: height + 200,
      buildingFinalY: height - 384,
      buildingRightEdge: width,
      playerSpacing: 400,
      pushDistance: 80,
      fallRotation: 30,
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

  // Helper function to check if we're in a time range
  const isInTimeRange = (startTime, duration) => {
    return currentTime >= startTime && currentTime <= startTime + duration;
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

  // Calculate building and player positions
  const buildingX = config.positions.buildingRightEdge - config.sprites.building.width;
  const buildingCenterX = buildingX + config.sprites.building.width / 2;
  
  // Base positions for players (these are anchor points)
  const baseRonaldoAnchorX = buildingCenterX - config.positions.playerSpacing / 2;
  const baseMessiAnchorX = buildingCenterX + config.positions.playerSpacing / 2;
  const playerAnchorY = buildingY + 150; // Standing on building

  // Ronaldo push animation
  const ronaldoPushProgress = getTimeProgress(
    config.timing.ronaldoPush.start,
    config.timing.ronaldoPush.duration
  );
  const ronaldoAnchorX = baseRonaldoAnchorX + ronaldoPushProgress * config.positions.pushDistance;

  // Messi push back during Ronaldo's push
  const messiPushBackStart = config.timing.ronaldoPush.start + config.timing.ronaldoPush.duration * 0.7;
  const messiPushBackProgress = getTimeProgress(
    messiPushBackStart,
    config.timing.ronaldoPush.duration * 0.3
  );
  const messiAnchorXAfterRonaldoPush = baseMessiAnchorX + messiPushBackProgress * config.positions.pushDistance;

  // Messi push animation
  const messiPushProgress = getTimeProgress(
    config.timing.messiPush.start,
    config.timing.messiPush.duration
  );
  const messiAnchorX = messiAnchorXAfterRonaldoPush - messiPushProgress * config.positions.pushDistance * 1.5;
  const finalRonaldoAnchorX = ronaldoAnchorX + messiPushProgress * config.positions.pushDistance * 1.5;

  // Ronaldo fall animation
  const fallProgress = getTimeProgress(
    config.timing.ronaldoFall.start,
    config.timing.ronaldoFall.duration
  );
  const fallAnchorY = playerAnchorY + fallProgress * fallProgress * 200;
  const fallRotation = fallProgress * config.positions.fallRotation;

  // Determine current phase and sprites
  const getCurrentPhase = () => {
    if (currentTime < config.timing.ronaldoPush.start) return 'initial';
    if (currentTime < config.timing.messiPush.start) return 'ronaldo-pushing';
    if (currentTime < config.timing.ronaldoFall.start) return 'messi-pushing';
    return 'ronaldo-falling';
  };

  const currentPhase = getCurrentPhase();
  
  // Get current sprites
  const ronaldoSprite = currentPhase === 'ronaldo-pushing' 
    ? config.sprites.ronaldo.pushing 
    : config.sprites.ronaldo.standing;
  const messiSprite = currentPhase === 'messi-pushing' 
    ? config.sprites.messi.pushing 
    : config.sprites.messi.standing;

  // Calculate actual sprite positions using anchoring
  const ronaldoTargetX = currentPhase === 'ronaldo-falling' ? finalRonaldoAnchorX : ronaldoAnchorX;
  const ronaldoTargetY = currentPhase === 'ronaldo-falling' ? fallAnchorY : playerAnchorY;
  const ronaldoPos = getAnchoredPosition(
    ronaldoTargetX, 
    ronaldoTargetY, 
    ronaldoSprite.width, 
    ronaldoSprite.height,
    config.positions.spriteAnchor.x,
    config.positions.spriteAnchor.y
  );

  const messiPos = getAnchoredPosition(
    messiAnchorX, 
    playerAnchorY, 
    messiSprite.width, 
    messiSprite.height,
    config.positions.spriteAnchor.x,
    config.positions.spriteAnchor.y
  );

  // Z-index management
  const ronaldoZIndex = currentPhase === 'ronaldo-falling' ? 100 : currentPhase === 'messi-pushing' ? 102 : 103;
  const messiZIndex = currentPhase === 'messi-pushing' ? 104 : 103;
  const buildingZIndex = 101;

  // Visibility conditions
  const showBuilding = currentTime >= config.timing.buildingEntry.start;
  const showRonaldo = currentTime >= config.timing.buildingEntry.start && 
                      currentTime < config.timing.ronaldoFall.start + config.timing.ronaldoFall.duration;
  const showMessi = currentTime >= config.timing.buildingEntry.start;

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
        alt="Background Cityscape"
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
          alt="Rooftop Building"
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

      {/* Ronaldo */}
      {showRonaldo && (
        <img
          id="sprite-ronaldo"
          src={staticFile(ronaldoSprite.src)}
          alt="Ronaldo"
          style={{
            position: 'absolute',
            left: ronaldoPos.x,
            top: ronaldoPos.y,
            width: ronaldoSprite.width,
            height: ronaldoSprite.height,
            zIndex: ronaldoZIndex,
            transform: currentPhase === 'ronaldo-falling'
              ? `rotate(${fallRotation}deg)`
              : 'none',
            transformOrigin: 'bottom center',
          }}
        />
      )}

      {/* Messi */}
      {showMessi && (
        <img
          id="sprite-messi"
          src={staticFile(messiSprite.src)}
          alt="Messi"
          style={{
            position: 'absolute',
            left: messiPos.x,
            top: messiPos.y,
            width: messiSprite.width,
            height: messiSprite.height,
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

      {/* Debug info */}
      <div
        style={{
          position: 'absolute',
          top: height - 160,
          left: 10,
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
        }}
      >
        <div>Frame: {frame} | Time: {currentTime.toFixed(2)}s</div>
        <div>Phase: {currentPhase}</div>
        <div>Building Y: {Math.round(buildingY)}</div>
        <div>Ronaldo: {Math.round(ronaldoTargetX)}, {Math.round(ronaldoTargetY)}</div>
        <div>Messi: {Math.round(messiAnchorX)}, {Math.round(playerAnchorY)}</div>
        <div>Ronaldo Sprite: {ronaldoSprite.width}x{ronaldoSprite.height}</div>
        <div>Messi Sprite: {messiSprite.width}x{messiSprite.height}</div>
      </div>
    </AbsoluteFill>
  );
};

export default RooftopScene;