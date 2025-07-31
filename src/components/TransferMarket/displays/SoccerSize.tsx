import React, { useCallback, useMemo } from 'react';
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
  player1TrophyLaneX1?: number;
  player1TrophyLaneX2?: number;
  player2TrophyLaneX1?: number;
  player2TrophyLaneX2?: number;
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
  endScreenAnimationDuration?: number;
  spriteChangeMode?: 'score' | 'step';
}

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

const SoccerSize: React.FC<SoccerSizeProps> = ({
  data = [{ "date": "2006", "data": [{ "name": "Messi", "value": 1 }, { "name": "Ronaldo", "value": 0 }] }, { "date": "2008", "data": [{ "name": "Messi", "value": 1 }, { "name": "Ronaldo", "value": 1 }] }, { "date": "2009", "data": [{ "name": "Messi", "value": 2 }, { "name": "Ronaldo", "value": 1 }] }, { "date": "2011", "data": [{ "name": "Messi", "value": 3 }, { "name": "Ronaldo", "value": 1 }] }, { "date": "2014", "data": [{ "name": "Messi", "value": 3 }, { "name": "Ronaldo", "value": 2 }] }, { "date": "2015", "data": [{ "name": "Messi", "value": 4 }, { "name": "Ronaldo", "value": 2 }] }, { "date": "2016", "data": [{ "name": "Messi", "value": 4 }, { "name": "Ronaldo", "value": 3 }] }, { "date": "2017", "data": [{ "name": "Messi", "value": 4 }, { "name": "Ronaldo", "value": 4 }] }, { "date": "2018", "data": [{ "name": "Messi", "value": 4 }, { "name": "Ronaldo", "value": 5 }] }],
  player1Name = 'Messi',
  player2Name = 'Ronaldo',
  player1Position = { x: 130, z: 100},
  player2Position = { x: 845, z: 100},
  player1Scale = 100,
  player2Scale = 100,
  basePlayerHeight = 20,
  imageMappers = {
    "Messi": (value: number) => {
      const values = [1, 2, 3, 3, 4, 4, 4]
      return staticFile(`images/usc_mess${values[value]}.png`)
    },
    "Ronaldo": (value: number) => {
      const values = [1, 1, 1, 2, 2, 3, 4 ]
      return staticFile(`images/usc_ron${values[value]}.png`)
    },
  },
  imageGrowthFactors = {
    "Messi": Array(100).fill(0).map((_, i) => 1),
    "Ronaldo": Array(100).fill(0).map((_, i) => {
      return 1
    }),
  },
  backgroundUrl = staticFile('images/stadium_bg.png'),
  horizonLine = 0.6,
  worldDepth = 200,
  farScale = 0.5,
  player1TrophyLaneX1 = 200, // Start X for player 1's trophy
  player1TrophyLaneX2 = 60, // End X for player 1's trophy (defaults to their position)
  player2TrophyLaneX1 = 800, // Start X for player 2's trophy
  player2TrophyLaneX2 = 925,
  trophyStartDepth = 0,
  trophySpeed = 1,
  celebrationDuration = 0.5,
  // breathingRate = (value: number) => 0.8 + value * 0.05,
  breathingRate = (value: number) => 0,
  // breathingAmplitude = (value: number) => 0.015 + value * 0.0015,
  breathingAmplitude = (value: number) => 0,
  titleText = "UEFA Super Cups",
  titleCardDuration = 8,
  hookDuration = 0.1,
  stepDuration = 1.5,
  trophyImage = staticFile('images/supercup_trohpy.png'),
  useParticles = true,
  particleCount = 30,
  metricBoxYOffset = -960,
  fadeDuration = 0.75,
  resetDuration = 0.6,
  endScreenAnimationDuration = 1.0,
  spriteChangeMode = 'step',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  const baseScale = Math.min(width / 1920, height / 1080);
  const responsivePlayerScale1 = player1Scale * baseScale;
  const responsivePlayerScale2 = player2Scale * baseScale;
  const responsiveBaseHeight = basePlayerHeight * Math.min(height / 1080, 1.2);

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
  const isHook = timeInSeconds <= hookEndTime;
  const isReset = timeInSeconds > hookEndTime && timeInSeconds < resetEndTime;
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
    spriteIndex1 = spriteChangeMode === 'score' ? Math.floor(syncValue) : 0;
    spriteIndex2 = spriteChangeMode === 'score' ? Math.floor(syncValue) : 0;
    currentDate = 'Fast Forward...';
  } else if (isReset) {
    const syncValue = interpolate(timeInSeconds, [hookEndTime, resetEndTime], [hookTargetValue, UNIFIED_START_VALUE], {
      easing: Easing.inOut(Easing.quad),
    });
    visualPlayer1Value = syncValue;
    visualPlayer2Value = syncValue;
    spriteIndex1 = UNIFIED_START_VALUE;
    spriteIndex2 = UNIFIED_START_VALUE;
    displayPlayer1Value = 0;
    displayPlayer2Value = 0;
  } else if (isMain) {
    // ---- START: ROBUST LOGIC BLOCK ----

    // A small epsilon prevents floating-point errors at the exact boundary of a step, fixing the glitch.
    const timeEpsilon = 1 / (fps * 100);
    const mainTime = timeInSeconds - mainStartTime + timeEpsilon;
    const currentStepIndex = Math.min(Math.floor(mainTime / stepDuration), data.length - 1);

    const currentDataStep = data[currentStepIndex];
    const prevDataStep = currentStepIndex > 0 ? data[currentStepIndex - 1] : undefined;
    stepTime = mainTime % stepDuration;
    currentDate = currentDataStep.date;

    const getPlayerValue = (step: DataStep | undefined, playerName: string) =>
      step?.data.find((p) => p.name === playerName)?.value ?? UNIFIED_START_VALUE;

    const targetPlayer1Value = getPlayerValue(currentDataStep, player1Name);
    const targetPlayer2Value = getPlayerValue(currentDataStep, player2Name);
    const prevPlayer1Value = getPlayerValue(prevDataStep, player1Name);
    const prevPlayer2Value = getPlayerValue(prevDataStep, player2Name);

    if (targetPlayer1Value > prevPlayer1Value) activePlayer = player1Name;
    else if (targetPlayer2Value > prevPlayer2Value) activePlayer = player2Name;
    isPlayerTurn = activePlayer !== null;

    const hasImpactOccurred = !isPlayerTurn || stepTime >= trophySpeed;

    // This logic is common for both modes: determine the visual and displayed score.
    visualPlayer1Value = hasImpactOccurred ? targetPlayer1Value : prevPlayer1Value;
    visualPlayer2Value = hasImpactOccurred ? targetPlayer2Value : prevPlayer2Value;
    displayPlayer1Value = visualPlayer1Value;
    displayPlayer2Value = visualPlayer2Value;

    // --- LOGIC FORK: Distinguish between sprite modes ---
    if (spriteChangeMode === 'step') {
      // 'step' mode: The sprite is tied to the timeline's progression.
      // This assumes the `imageMaps` array is a chronological sequence of sprites
      // corresponding to each step in the data array.
      // Before impact, we use the sprite for the current step's "before" state.
      // After impact, we use the sprite for the "after" state.
      const spriteStateIndex = hasImpactOccurred ? currentStepIndex + 1 : currentStepIndex;
      spriteIndex1 = spriteStateIndex;
      spriteIndex2 = spriteStateIndex;

    } else { // 'score' mode (default)
      // 'score' mode: The sprite is directly tied to the player's numerical score.
      // This is the most direct mapping: if the score is 4, use the sprite for 4.
      spriteIndex1 = visualPlayer1Value;
      spriteIndex2 = visualPlayer2Value;
    }
    // ---- END: ROBUST LOGIC BLOCK ----
  } else { // isEndCard
    visualPlayer1Value = finalDataStep.data.find((p) => p.name === player1Name)?.value || 0;
    visualPlayer2Value = finalDataStep.data.find((p) => p.name === player2Name)?.value || 0;
    displayPlayer1Value = visualPlayer1Value;
    displayPlayer2Value = visualPlayer2Value;
    if (spriteChangeMode === 'step') {
      // At the end, the sprite index should reflect all completed steps.
      spriteIndex1 = data.length;
      spriteIndex2 = data.length;
    } else {
      spriteIndex1 = displayPlayer1Value;
      spriteIndex2 = displayPlayer2Value;
    }
    currentDate = "FOLLOW ME 🚀🚀🚀";
  }

  // --- (The rest of your code from here down is unchanged) ---
  const endCardStartTime = mainEndTime;
  const endScreenAnimationEndTime = endCardStartTime + endScreenAnimationDuration;
  const endScreenProgress = isEndCard
    ? Math.min((timeInSeconds - endCardStartTime) / endScreenAnimationDuration, 1)
    : 0;
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
    { proj: player1Proj, name: player1Name, visualValue: visualPlayer1Value, displayValue: displayPlayer1Value, spriteIndex: spriteIndex1, scale: responsivePlayerScale1, pos: player1Position },
    { proj: player2Proj, name: player2Name, visualValue: visualPlayer2Value, displayValue: displayPlayer2Value, spriteIndex: spriteIndex2, scale: responsivePlayerScale2, pos: player2Position },
  ];
  const trophyAnim = (() => {
    if (!isPlayerTurn || !activePlayer) return null;

    const trophyProgress = Math.min(stepTime / trophySpeed, 1);
    if (trophyProgress >= 1) return null;

    const targetPos = activePlayer === player1Name ? player1Position : player2Position;

    // 1. Determine the start and end X lanes for the active player
    const startLaneX = activePlayer === player1Name ? player1TrophyLaneX1 : player2TrophyLaneX1;
    const endLaneX = activePlayer === player1Name ? player1TrophyLaneX2 : player2TrophyLaneX2;

    // 2. Interpolate the X and Z positions based on trophyProgress
    const currentTrophyX = lerp(startLaneX, endLaneX, trophyProgress);
    const currentTrophyZ = lerp(trophyStartDepth, targetPos.z, trophyProgress);

    // 3. Project the new 3D (X, Z) coordinates to the 2D screen
    const trophyProj = project2D5(currentTrophyX, currentTrophyZ);

    return {
      x: trophyProj.x,
      y: trophyProj.y,
      scale: trophyProj.scale * 8 * baseScale,
      progress: trophyProgress
    };
  })();
  const generateParticles = useCallback(() => {
    const getParticles = ((pool = Array.from({ length: 300 }, () => ({})), i = 0) => () => (
      (i = (i + 1) % 300), Object.assign(pool[i], { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, delay: Math.random() * 0.4 })
    ))();
    return Array.from({ length: particleCount }, getParticles);
  }, [particleCount]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <Img src={backgroundUrl} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

      <AbsoluteFill style={{ alignItems: 'center', zIndex: 10, opacity: titleOpacity }}>
        <div style={{
          marginTop: '10%',
          fontSize: `56px`,
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: `${height * 0.01}px ${width * 0.03}px`,
          borderRadius: '15px',
          textAlign: 'center',
          maxWidth: '90%'
        }}>
          {titleText}
        </div>
      </AbsoluteFill>

      {(isHook || isEndCard) && (
        <AbsoluteFill style={{
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          opacity: isHook ? fastForwardOpacity : interpolate(endScreenProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) })
        }}>
          <div style={{
            position: 'absolute',
            top: isHook ? '12%' : "6%",
            fontSize: `64px`,
            fontWeight: '900',
            textAlign: "center",
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            transform: isEndCard ? `translateY(${interpolate(endScreenProgress, [0, 0.3], [30, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2)) })}px)` : 'translateY(0px)',
            maxWidth: '90%'
          }}>
            {currentDate}
          </div>
        </AbsoluteFill>
      )}
      {players.map((p, i) => {
        const growthFactor = getInterpolatedGrowthFactor(p.name, p.visualValue);
        const breathingScale = getBreathingScale(p.visualValue);
        const totalScale = p.scale * p.proj.scale * growthFactor * breathingScale;
        const baseHeight = responsiveBaseHeight;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: p.proj.x,
            top: p.proj.y,
            transform: `translateX(-50%) translateY(-100%) scale(${totalScale})`,
            transformOrigin: 'bottom center',
            zIndex: Math.round(p.pos.z),
            height: `${baseHeight}px`,
          }}>
            <Img src={imageMappers[p.name](p.spriteIndex)} alt={p.name} style={{
              display: 'block',
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              filter: activePlayer === p.name ? 'drop-shadow(0 0 2px #0fdefaff)' : 'none',
            }} />
          </div>
        );
      })}

      {!isEndCard && players.map((p, i) => (
        <div key={`metric-${i}`} style={{
          position: 'absolute',
          left: p.proj.x + (i * 2 * 340 * baseScale) - (270 * baseScale),
          top: p.proj.y + (metricBoxYOffset * Math.min(height / 1080, 1.2)),
          transform: `translateX(-50%)`,
          zIndex: Math.round(p.pos.z) + 1,
          backgroundColor: 'white',
          borderRadius: "12px",
          opacity: scoreOpacity,
          display: 'flex',
          color: '#000',
          fontSize: `${160 * baseScale}px`,
          fontWeight: 'bold',
          fontFamily: "monospace",
          padding: `0 ${100 * baseScale}px`,
        }}>
          {p.displayValue.toString().replace(/0/g, "O")}
        </div>
      ))}

      {trophyAnim && (
        <div style={{
          position: 'absolute',
          left: trophyAnim.x,
          top: trophyAnim.y,
          transform: `translateX(-50%) translateY(-50%) scale(${trophyAnim.scale})`,
          zIndex: 9999,
          filter: `brightness(${0.75 + trophyAnim.progress * 0.75}) drop-shadow(0 0 ${30 * trophyAnim.progress}px gold)`
        }}>
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '0px',
            fontSize: `${64 * baseScale}px`,
            fontWeight: '900',
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            WebkitTextStroke: `${4 * baseScale}px rgba(0, 0, 0, 0.9)`,
            textStroke: `${4 * baseScale}px rgba(0, 0, 0, 0.9)`,
          }}>
            {currentDate}
          </div>
          <Img src={trophyImage} style={{ width: `${8 * baseScale}vh`, height: 'auto' }} />
          {useParticles && generateParticles().map((particle, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${6 * baseScale}px`,
              height: `${6 * baseScale}px`,
              backgroundColor: '#ffd700',
              backgroundColor: '#fff',
              borderRadius: '50%',
              opacity: Math.max(0, 1 - trophyAnim.progress - particle.delay),
              transform: `translate(${particle.x * baseScale}px, ${particle.y * baseScale}px) scale(${1.5 - trophyAnim.progress})`,
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
            position: 'absolute',
            left: targetProj.x,
            top: targetProj.y - (180 * baseScale),
            transform: `translateX(-50%) translateY(${-popupProgress * 100}px) scale(${popUpScale})`,
            fontSize: `${20 * baseScale}vh`,
            fontWeight: 'bold',
            color: '#00ff00',
            textShadow: '3px 3px 0px #000, 0 0 20px #00ff00',
            opacity: 1 - popupProgress,
            zIndex: 9999,
          }}>
            +1
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

export default SoccerSize;