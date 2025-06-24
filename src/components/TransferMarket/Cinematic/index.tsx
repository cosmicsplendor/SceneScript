import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RaceScene } from '../components/Race';
import { PlayerValueOverlay } from './components/PlayerValueOverlay';
import { SpendingBarChart } from './components/SpendingChart';
import { useMemo } from 'react';
import { AudioOrchestrator } from './components/AudioOrchestrator';
import data from "./data/topValuedPlayers.json";
import clubLogos from "./data/clubLogos.json";
import clubNameMap from "./data/clubNameMap.json";
import flagMap from "./data/flagMap.json";
import { PlayerValueOverlay } from './components/PlayerValueOverlay';
export const TRANSFER_LIFESPAN = 20;
data.forEach(d => {
  d.x += 200
})
// Bar chart configuration
const barChartConfig = {
  maxBarWidth: 450,
  barHeight: 40,
  maxClubs: 4,
  barColor: '#00ff88',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  textColor: 'white',
  logoSize: 28
};

const sounds = [
]
export default () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const chartData = useMemo(() => {
    return data.map(player => {
      const { club, market_value, start, duration } = player;
      return { to: club, price: market_value, start, duration}
    })
  }, [])
//   const chartOpacity = interpolate(
//     frame,
//     [winnerStartFrame - 60, winnerStartFrame],
//     [1, 0],
//     {
//       // This ensures opacity stays at 0 after the animation is done
//       extrapolateRight: 'clamp',
//     }
//   );
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <RaceScene passive={true} />
      <AbsoluteFill style={{ opacity: 1 }}>
        <SpendingBarChart
          transfers={chartData}
          clubLogos={clubLogos}
          config={barChartConfig}
          nameMap={clubNameMap}
        />
      </AbsoluteFill>
      <PlayerValueOverlay players={data} flagMap={flagMap} />
    </AbsoluteFill>
  );
};