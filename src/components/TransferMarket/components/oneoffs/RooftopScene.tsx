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
        // FIX: Removed width/height, as styling will now handle fullscreen cover.
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
        angry: {
          src: 'images/ronaldo3.png',
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
        angry: {
          src: 'images/messi3.png',
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

    // Timing configuration (in seconds)
    timing: {
      sceneStart: 44.7, // The absolute time in the composition where this scene begins
      // --- All timings below are RELATIVE to sceneStart ---
      bgFade: { start: 0, duration: 0.25 },
      buildingEntry: { start: 0, duration: 1.0 },
      hold: { start: 2.0, duration: 9.5},
      ronaldoPushStart: { start: 11.5, duration: 2},
      messiPush: { start: 14, duration: 2.0 },
      ronaldoFall: { start: 16, duration: 3.0 },
    },

    // Position configuration
    positions: {
      buildingStartY: height + 200,
      buildingFinalY: height - 384,
      buildingRightEdge: width,
      playerSpacing: 400,
      pushDistance: 500,
      fallRotation: -30,
      collisionThreshold: 300,
      spriteAnchor: {
        x: 0.5,
        y: 1.0,
      },
    },
  };

  // FIX: Respect scene start time.
  // 1. Get the absolute time in the video.
  const absoluteTime = frame / fps;

  // 2. If the absolute time is before the scene's start time, render nothing.
  if (absoluteTime < config.timing.sceneStart) {
    return null;
  }

  // 3. Calculate time relative to the scene's start. All animations will use this.
  const currentTime = absoluteTime - config.timing.sceneStart;


  // Helper function to convert seconds to frames
  const secondsToFrames = (seconds) => seconds * fps;

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

  // Helper function to get sprite position based on anchor point
  const getAnchoredPosition = (targetX, targetY, spriteWidth, spriteHeight, anchorX = 0.5, anchorY = 1.0) => {
    return {
      x: targetX - (spriteWidth * anchorX),
      y: targetY - (spriteHeight * anchorY),
    };
  };

  // Helper function to get progress within a time range
  const getTimeProgress = (startTime, duration) => {
    // This now correctly uses the scene-relative time
    if (currentTime < startTime) return 0;
    if (currentTime > startTime + duration) return 1;
    return (currentTime - startTime) / duration;
  };

  // --- ANIMATION LOGIC ---

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
  const distanceBetweenPlayers = baseMessiX - baseRonaldoX;
  const ronaldoReachDistance = distanceBetweenPlayers - config.positions.collisionThreshold;

  let messiPushBackMovement = 0;
  if (ronaldoPushMovement > ronaldoReachDistance) {
    messiPushBackMovement = (ronaldoPushMovement - ronaldoReachDistance) * 0.8;
  }

  // --- NEW LOGIC START ---
  // A new variable to check if Ronaldo has physically made contact with Messi.
  // This is true only when Messi starts being pushed back.
  const hasRonaldoMadeContact = messiPushBackMovement > 0;
  // --- NEW LOGIC END ---

  // Calculate Messi's counter-push movement
  const messiCounterPushMovement = messiPushProgress * config.positions.pushDistance * 2; // Messi pushes back harder

  // Final positions
  const ronaldoFinalX = baseRonaldoX + ronaldoPushMovement - messiCounterPushMovement;
  const messiFinalX = baseMessiX + messiPushBackMovement - messiCounterPushMovement;

  // Ronaldo fall animation
  const fallProgress = getTimeProgress(
    config.timing.ronaldoFall.start,
    config.timing.ronaldoFall.duration
  );
  const ronaldoFallY = playerAnchorY + fallProgress * fallProgress * 2000;
  const ronaldoFallRotation = fallProgress * config.positions.fallRotation;

  // Determine current phase and visibility
  const getCurrentPhase = () => {
    // This now correctly uses the scene-relative time
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
  const ronaldoAngryPos = getAnchoredPosition(
    ronaldoAnchorX, ronaldoAnchorY,
    config.sprites.ronaldo.angry.width, config.sprites.ronaldo.angry.height,
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
  const messiAngryPos = getAnchoredPosition(
    messiAnchorX, messiAnchorY,
    config.sprites.messi.angry.width, config.sprites.messi.angry.height,
    config.positions.spriteAnchor.x, config.positions.spriteAnchor.y
  );

  // Z-index management
  const ronaldoZIndex = currentPhase === 'ronaldo-falling' ? 100 : currentPhase === 'messi-pushing' ? 102 : 103;
  const messiZIndex = currentPhase === 'messi-pushing' ? 104 : 103;
  const buildingZIndex = 101;

  // Visibility conditions now use the scene-relative time
  const isSceneActive = currentTime >= config.timing.buildingEntry.start;
  const isRonaldoFalling = currentPhase === 'ronaldo-falling';

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: 'transparent',
        zIndex: 10e2
      }}
    >
      {/* Background Cityscape */}
      <img
        src={staticFile(config.sprites.background.src)}
        style={{
          // FIX: Ensure the background image covers the full screen.
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: bgOpacity,
          zIndex: 0,
        }}
      />

      {/* Building */}
      {isSceneActive && (
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
      {isSceneActive && currentPhase === 'initial' && (
        <img
          src={staticFile(config.sprites.ronaldo.standing.src)}
          id="ronaldo"
          style={{
            position: 'absolute',
            left: ronaldoStandingPos.x,
            top: ronaldoStandingPos.y,
            width: config.sprites.ronaldo.standing.width,
            height: config.sprites.ronaldo.standing.height,
            zIndex: ronaldoZIndex,
            transform: 'none',
            transformOrigin: 'bottom center',
          }}
        />
      )}

      {/* Ronaldo (Angry) */}
      {isSceneActive && (currentPhase === 'messi-pushing' || currentPhase === 'ronaldo-falling') && (
        <img
          src={staticFile(config.sprites.ronaldo.angry.src)}
          id="messi"
          style={{
            position: 'absolute',
            left: ronaldoAngryPos.x,
            top: ronaldoAngryPos.y,
            width: config.sprites.ronaldo.angry.width,
            height: config.sprites.ronaldo.angry.height,
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
          id="ronaldo"
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
      {/* --- MODIFIED LOGIC START --- */}
      {/* Messi remains standing until Ronaldo makes physical contact. */}
      {isSceneActive &&
        (currentPhase === 'initial' ||
          currentPhase === 'ronaldo-falling' ||
          (currentPhase === 'ronaldo-pushing' && !hasRonaldoMadeContact)) && (
        <img
          src={staticFile(config.sprites.messi.standing.src)}
          id="messi"
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
      {/* --- MODIFIED LOGIC END --- */}

      {/* Messi (Angry) */}
      {/* --- MODIFIED LOGIC START --- */}
      {/* Messi gets angry ONLY when Ronaldo has made contact and started pushing him. */}
      {isSceneActive &&
        currentPhase === 'ronaldo-pushing' &&
        hasRonaldoMadeContact && (
        <img
          src={staticFile(config.sprites.messi.angry.src)}
          id="messi" // Fixed a bug here, was "ronaldo"
          style={{
            position: 'absolute',
            left: messiAngryPos.x,
            top: messiAngryPos.y,
            width: config.sprites.messi.angry.width,
            height: config.sprites.messi.angry.height,
            zIndex: messiZIndex,
          }}
        />
      )}
      {/* --- MODIFIED LOGIC END --- */}


      {/* Messi (Pushing) */}
      {isSceneActive && currentPhase === 'messi-pushing' && (
        <img
          src={staticFile(config.sprites.messi.pushing.src)}
          id="messi"
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

    </AbsoluteFill>
  );
};

export default RooftopScene;