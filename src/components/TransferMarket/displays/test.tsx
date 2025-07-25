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

// --- (Interfaces are mostly the same, added podium) ---
interface Position3D { x: number; y?: number; z: number; }
interface Player { name:string; image: string; }
interface MetricData { [metricName: string]: number; }
interface PlayerData { name: string; metrics: MetricData; }
interface DataStep { date: string; data: PlayerData[]; }
interface MetricConfig {
  name: string;
  image: string;
  laneStartX: number[];
  laneEndX: number[];
}

interface SoccerSizeProps {
  data?: DataStep[];
  players?: Player[];
  playerPositions?: Position3D[];
  playerScales?: number[];
  metrics?: MetricConfig[];
  podiumImage?: string;
  // datePosition is now a 2D {x, y} coordinate
  datePosition?: { x: string, y: string };
  basePlayerHeight?: number;
  backgroundUrl?: string;
  horizonLine?: number;
  worldDepth?: number;
  farScale?: number;
  metricStartDepth?: number;
  metricAnimationSpeed?: number;
  popupDuration?: number; // Duration for the +N popup
  stepDuration?: number;
  metricBoxYOffset?: number;
}

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/**
 * CORRECTED: Calculates the position of the nth item in a pyramid stack.
 * @param n The 1-based index of the item.
 * @param itemSize The width/height of each item.
 * @returns {x, y} offset from the stack's center-bottom.
 */
const getStackedItemPosition = (n: number, itemSize: number) => {
    if (n <= 0) return { x: 0, y: 0 };
    // Find the row number R for item n by solving R(R+1)/2 >= n
    const row = Math.ceil((-1 + Math.sqrt(1 + 8 * n)) / 2);
    
    // Number of items in all previous rows
    const itemsInPrevRows = (row - 1) * row / 2;
    
    // 0-based index of the item within its own row
    const indexInRow = n - 1 - itemsInPrevRows;
    
    // Calculate position
    // Center the row horizontally
    const x = (indexInRow - (row - 1) / 2) * itemSize;
    // Stack rows vertically, with a slight overlap (0.8) to look natural
    const y = -(row - 1) * itemSize * 0.8; 

    return { x, y };
};


const SoccerSize: React.FC<SoccerSizeProps> = ({
  // --- UPDATED DEFAULTS TO MATCH VISUAL ---
  data = [{"date":"2020","data":[{"name":"Messi","metrics":{"goals":2}},{"name":"Ronaldo","metrics":{"goals":3}}]},{"date":"2021","data":[{"name":"Messi","metrics":{"goals":5}},{"name":"Ronaldo","metrics":{"goals":4}}]},{"date":"2022","data":[{"name":"Messi","metrics":{"goals":5}},{"name":"Ronaldo","metrics":{"goals":7}}]}],
  players = [
    { name: 'Messi', image: staticFile('images/messi_static.png') },
    { name: 'Ronaldo', image: staticFile('images/ronaldo_static.png') },
  ],
  playerPositions = [
    { x: 960 - 280, z: 150 }, // Centered then offset
    { x: 960 + 280, z: 150 },
  ],
  playerScales = [90, 90],
  metrics = [{
    name: 'goals',
    image: staticFile('images/soccer_ball.png'),
    // Lanes align with a centered ground image
    laneStartX: [960 - 350, 960 + 350],
    laneEndX: [960 - 280, 960 + 280],
  }],
  podiumImage = staticFile('images/podium.png'),
  datePosition = { x: '50%', y: '84%' },
  // --- ADJUSTED LAYOUT DEFAULTS ---
  basePlayerHeight = 20,
  backgroundUrl = staticFile('images/stadium_night_lanes.png'), // Assumes a new background
  horizonLine = 0.55,
  worldDepth = 200,
  farScale = 0.5,
  metricStartDepth = -20, // Start slightly closer to camera
  metricAnimationSpeed = 1.0,
  popupDuration = 1.5,
  stepDuration = 2.5,
  metricBoxYOffset = -460, // Brought score boxes way down
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeInSeconds = frame / fps;

  const baseScale = width / 1920; // Use width-based scaling for consistency
  const responsiveBaseHeight = basePlayerHeight * Math.min(height / 1080, 1.2);

  // --- TIME LOGIC (UNCHANGED) ---
  const mainStartTime = 0;
  const totalMainDuration = data.length * stepDuration;
  const mainEndTime = mainStartTime + totalMainDuration;
  const isMain = timeInSeconds >= mainStartTime && timeInSeconds < mainEndTime;
  
  const visualMetricValues: { [playerName: string]: MetricData } = {};
  players.forEach(p => {
    visualMetricValues[p.name] = {};
    metrics.forEach(m => {
      visualMetricValues[p.name][m.name] = 0;
    });
  });

  let currentDate = '';
  let stepUpdates: { playerIndex: number, metricName: string, increase: number, prevValue: number }[] = [];
  let stepTime = 0;
  
  if (isMain) {
    const timeEpsilon = 1 / (fps * 100);
    const mainTime = timeInSeconds - mainStartTime + timeEpsilon;
    const currentStepIndex = Math.min(Math.floor(mainTime / stepDuration), data.length - 1);

    const currentDataStep = data[currentStepIndex];
    const prevDataStep = currentStepIndex > 0 ? data[currentStepIndex - 1] : { date: '', data: [] };
    stepTime = mainTime % stepDuration;
    currentDate = currentDataStep.date;

    const getMetricValue = (step: DataStep | undefined, playerName: string, metricName: string) => 
      step?.data.find(p => p.name === playerName)?.metrics[metricName] ?? 0;

    players.forEach((player, playerIndex) => {
      metrics.forEach(metric => {
        const targetValue = getMetricValue(currentDataStep, player.name, metric.name);
        const prevValue = getMetricValue(prevDataStep, player.name, metric.name);
        const increase = targetValue - prevValue;
        if (increase > 0) {
          stepUpdates.push({ playerIndex, metricName: metric.name, increase, prevValue });
        }
        
        const hasImpactOccurred = stepTime >= metricAnimationSpeed;
        visualMetricValues[player.name][metric.name] = hasImpactOccurred ? targetValue : prevValue;
      });
    });
  } else { 
     currentDate = data[0]?.date ?? '';
     // Set initial values
     players.forEach(player => {
      metrics.forEach(metric => {
        visualMetricValues[player.name][metric.name] = data[0]?.data.find(p => p.name === player.name)?.metrics[metric.name] ?? 0;
      });
    });
  }
  
  const project2D5 = (pos: Position3D) => {
    const zProgress = Math.min(pos.z / worldDepth, 1);
    const scale = lerp(1, farScale, zProgress);
    const startY = pos.y !== undefined ? pos.y : height;
    const endY = height * horizonLine;
    const y = lerp(startY, endY, zProgress);
    return { x: width / 2 + (pos.x - width / 2) * scale, y: y, scale: scale };
  };
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#0c1021', overflow: 'hidden' }}>
      <Img src={backgroundUrl} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Date Display (2D Overlay) */}
      <div style={{
          position: 'absolute',
          left: datePosition.x,
          top: datePosition.y,
          transform: `translateX(-50%) translateY(-50%)`,
          fontSize: `${64 * baseScale}px`,
          fontWeight: '900',
          color: '#fff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          zIndex: 100,
      }}>{currentDate}</div>

      {/* Podiums */}
      {podiumImage && players.map((p, i) => {
        const podiumPos = { ...playerPositions[i], z: playerPositions[i].z + 1 }; // Place just behind player
        const proj = project2D5(podiumPos);
        return (
          <Img key={`podium-${i}`} src={podiumImage} style={{
            position: 'absolute',
            left: proj.x,
            top: proj.y,
            transform: `translateX(-50%) translateY(-100%) scale(${proj.scale * 1.5})`, // Scale podium relative to scene
            transformOrigin: 'bottom center',
            zIndex: Math.round(podiumPos.z),
          }}/>
        );
      })}

      {/* Players */}
      {players.map((p, i) => {
        const proj = project2D5(playerPositions[i]);
        const scale = playerScales[i] * baseScale;
        return (
          <div key={p.name} style={{
            position: 'absolute',
            left: proj.x,
            top: proj.y,
            transform: `translateX(-50%) translateY(-100%) scale(${scale * proj.scale})`,
            transformOrigin: 'bottom center',
            zIndex: Math.round(playerPositions[i].z),
            height: `${responsiveBaseHeight}px`,
          }}>
            <Img src={p.image} alt={p.name} style={{ display: 'block', height: '100%', width: 'auto' }} />
          </div>
        );
      })}

      {/* Metric Score Boxes */}
      {players.map((p, i) => {
        const proj = project2D5(playerPositions[i]);
        const metricToDisplay = metrics[0].name;
        const displayValue = visualMetricValues[p.name]?.[metricToDisplay] ?? 0;

        return (
          <div key={`metric-${i}`} style={{
            position: 'absolute',
            left: proj.x,
            top: proj.y + (metricBoxYOffset * baseScale),
            transform: `translateX(-50%)`,
            zIndex: Math.round(playerPositions[i].z) + 1,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: "12px",
            color: '#000',
            fontSize: `${100 * baseScale}px`,
            fontWeight: 'bold',
            fontFamily: "monospace",
            padding: `${10*baseScale}px ${50 * baseScale}px`,
            minWidth: `${100 * baseScale}px`,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            {displayValue.toString().replace(/0/g, "O")}
          </div>
        );
      })}

      {/* Flying Metric Stacks */}
      {isMain && stepUpdates.map((update, i) => {
          const progress = Math.min(stepTime / metricAnimationSpeed, 1);
          if (progress >= 1) return null;

          const metricConfig = metrics.find(m => m.name === update.metricName);
          if (!metricConfig) return null;

          const targetPos = playerPositions[update.playerIndex];
          const startX = metricConfig.laneStartX[update.playerIndex];
          const endX = metricConfig.laneEndX[update.playerIndex];

          const currentX = lerp(startX, endX, progress);
          const currentZ = lerp(metricStartDepth, targetPos.z, progress);
          const { x, y, scale } = project2D5({ x: currentX, z: currentZ });

          return (
              <div key={i} style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: `translateX(-50%) translateY(-50%) scale(${scale})`,
                  zIndex: Math.round(currentZ),
              }}>
                <div style={{ position: 'relative', width: 200 * baseScale, height: 200 * baseScale }}>
                    {Array.from({ length: update.increase }).map((_, itemIndex) => {
                        const itemN = itemIndex + 1;
                        const itemSize = 70 * baseScale; // Much larger balls
                        const pos = getStackedItemPosition(itemN, itemSize);
                        return (
                          <Img key={itemIndex} src={metricConfig.image} style={{
                              position: 'absolute',
                              width: itemSize,
                              height: itemSize,
                              bottom: `calc(50% - ${itemSize/2} + ${-pos.y}px)`,
                              left: `calc(50% + ${pos.x}px)`,
                              transform: 'translateX(-50%)',
                          }}/>
                        );
                    })}
                </div>
              </div>
          );
      })}

      {/* +N POPUP ANIMATION */}
      {isMain && stepUpdates.map((update, i) => {
        const popupProgress = Easing.out(Easing.quad)(
          interpolate(stepTime, [metricAnimationSpeed, metricAnimationSpeed + popupDuration], [0, 1], { extrapolateRight: 'clamp' })
        );
        if(popupProgress === 0 || popupProgress === 1) return null;

        const targetProj = project2D5(playerPositions[update.playerIndex]);
        const popUpScale = interpolate(popupProgress, [0, 0.3, 1], [0.5, 1.2, 1], { easing: Easing.out(Easing.back(2)) });
        const popUpOpacity = interpolate(popupProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

        return (
          <div key={`popup-${i}`} style={{
            position: 'absolute',
            left: targetProj.x,
            top: targetProj.y - (300 * baseScale),
            transform: `translateX(-50%) scale(${popUpScale})`,
            zIndex: 9999,
            color: '#2bff53',
            fontSize: `${120 * baseScale}px`,
            fontWeight: '900',
            opacity: popUpOpacity,
            textShadow: '0 0 20px #2bff53, 0 0 10px #000, 0 0 10px #000'
          }}>
            +{update.increase}
          </div>
        )
      })}
    </AbsoluteFill>
  );
};

export default SoccerSize;