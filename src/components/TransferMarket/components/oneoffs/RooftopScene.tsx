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
        width: 820,
        height: 885,
      },
      "ronaldo": {
        "standing": {
          "src": "images/ronaldo1.png",
          "width": 171.75,
          "height": 541.5
        },
        "angry": {
          "src": "images/ronaldo3.png",
          "width": 171.75,
          "height": 541.5
        },
        "pushing": {
          "src": "images/ronaldo2.png",
          "width": 314.25,
          "height": 464.25
        },
        "falling": {
          "src": "images/ronaldo4.png",
          "width": 403.5,
          "height": 539.25
        }
      },
      "messi": {
        "standing": {
          "src": "images/messi1.png",
          "width": 196.5,
          "height": 484.5
        },
        "angry": {
          "src": "images/messi3.png",
          "width": 196.5,
          "height": 484.5
        },
        "pushing": {
          "src": "images/messi2.png",
          "width": 303,
          "height": 483.75
        }
      }
    },
    // Timing configuration (in seconds)
    timing: {
      sceneStart: 48.2, // The absolute time in the composition where this scene begins
      // --- All timings below are RELATIVE to sceneStart ---
      bgFade: { start: 0, duration: 0.3 },
      buildingEntry: { start: 0, duration: 2 },
      hold: { start: 2.0, duration: 1.5 },
      ronaldoPushStart: { start: 3.9, duration: 2 },
      messiPush: { start: 6, duration: 2.0 },
      ronaldoFall: { start: 8, duration: 2 },
      // --- NEW LOGIC START ---
      // 1. Added a fade-out timing configuration.
      //    It starts after Ronaldo's fall is complete.
      sceneFadeOut: { start: 18.0, duration: 0.5 }, // 16s (fall start) + 3s (fall duration)
      // --- NEW LOGIC END ---
    },

    // Position configuration
    positions: {
      buildingStartY: height + 200,
      buildingFinalY: height - 850,
      buildingRightEdge: width,
      playerSpacing: 300,
      pushDistance: 300,
      fallRotation: -60,
      collisionThreshold: 230,
      spriteAnchor: {
        x: 0.5,
        y: 1.0,
      },
    },
  };

  // FIX: Respect scene start time.
  // 1. Get the absolute time in the video.
  const absoluteTime = frame / fps;

  // --- NEW LOGIC START ---
  // 1. Define the total duration of the scene, including the new fade-out.
  const sceneRelativeDuration = config.timing.sceneFadeOut.start + config.timing.sceneFadeOut.duration;
  const absoluteSceneEndTime = config.timing.sceneStart + sceneRelativeDuration;

  // 2. If the absolute time is outside the scene's active window, render nothing for cleanup.
  if (absoluteTime < config.timing.sceneStart || absoluteTime > absoluteSceneEndTime) {
    return null;
  }
  // --- NEW LOGIC END ---

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

  // --- NEW LOGIC START ---
  // 1. Calculate the final scene opacity for the fade-out effect.
  const fadeOutProgress = getTimeProgress(
    config.timing.sceneFadeOut.start,
    config.timing.sceneFadeOut.duration
  );
  const sceneOpacity = interpolate(fadeOutProgress, [0, 1], [1, 0]);
  // --- NEW LOGIC END ---


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

  // A new variable to check if Ronaldo has physically made contact with Messi.
  // This is true only when Messi starts being pushed back.
  const hasRonaldoMadeContact = messiPushBackMovement > 0;

  // Calculate Messi's counter-push movement
  const messiCounterPushMovement = messiPushProgress * config.positions.pushDistance * 1.25; // Messi pushes back harder

  // Final positions
  const ronaldoFinalX = baseRonaldoX + ronaldoPushMovement - messiCounterPushMovement;
  const messiFinalX = baseMessiX + messiPushBackMovement - messiCounterPushMovement;

  // Ronaldo fall animation
  const fallProgress = getTimeProgress(
    config.timing.ronaldoFall.start,
    config.timing.ronaldoFall.duration
  );
  const ronaldoFallY = playerAnchorY + fallProgress * fallProgress * 1500;
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
  // --- NEW LOGIC START ---
  // 2. Calculate position for the new 'falling' sprite.
  const ronaldoFallingPos = getAnchoredPosition(
    ronaldoAnchorX, ronaldoAnchorY,
    config.sprites.ronaldo.falling.width, config.sprites.ronaldo.falling.height,
    config.positions.spriteAnchor.x, config.positions.spriteAnchor.y
  );
  // --- NEW LOGIC END ---
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
  const ronaldoZIndex = currentPhase === 'ronaldo-pushing' ? 110 : (currentPhase === 'ronaldo-falling' ? 100 : currentPhase === 'messi-pushing' ? 102 : 103);
  const messiZIndex = currentPhase === 'messi-pushing' ? 104 : 103;
  const buildingZIndex = 101;

  // Visibility conditions now use the scene-relative time
  const isSceneActive = currentTime >= config.timing.buildingEntry.start;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: 'transparent',
        zIndex: 10e2,
        // --- NEW LOGIC START ---
        // 1. Apply the calculated scene opacity for the fade-out effect.
        opacity: sceneOpacity,
        // --- NEW LOGIC END ---
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

      {/* --- NEW LOGIC START --- */}
      {/* 2. Split the original "Ronaldo (Angry)" block into two parts. */}
      {/* This part shows the angry sprite only when Messi is pushing back. */}
      {isSceneActive && currentPhase === 'messi-pushing' && (
        <img
          src={staticFile(config.sprites.ronaldo.angry.src)}
          id="ronaldo" // FIX: Corrected ID from "messi" to "ronaldo"
          style={{
            position: 'absolute',
            left: ronaldoAngryPos.x,
            top: ronaldoAngryPos.y,
            width: config.sprites.ronaldo.angry.width,
            height: config.sprites.ronaldo.angry.height,
            zIndex: ronaldoZIndex,
            transform: 'none',
            transformOrigin: 'bottom center',
          }}
        />
      )}

      {/* This new part shows the 'falling' sprite only when Ronaldo is in the falling phase. */}
      {isSceneActive && currentPhase === 'ronaldo-falling' && (
        <img
          src={staticFile(config.sprites.ronaldo.falling.src)}
          id="ronaldo"
          style={{
            position: 'absolute',
            left: ronaldoFallingPos.x,
            top: ronaldoFallingPos.y,
            width: config.sprites.ronaldo.falling.width,
            height: config.sprites.ronaldo.falling.height,
            zIndex: ronaldoZIndex,
            transform: `rotate(${ronaldoFallRotation}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
      )}
      {/* --- NEW LOGIC END --- */}

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

      {/* Messi (Angry) */}
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