import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RaceScene } from '../components/Race';
import { TransferOverlay } from './components/TransferOverlay';
import { SpendingBarChart } from './components/SpendingChart';
import Thumbnail from '../components/Thumbanil';
import WinnerAnimation from '../Multi/WinnerAnimation';
import { useMemo } from 'react';
import { AudioOrchestrator } from './components/AudioOrchestrator';
import data from "./data/topValuedPlayers.json";
import clubLogos from "./data/clubLogos.json";
import clubNameMap from "./data/clubNameMap.json";
export const TRANSFER_LIFESPAN = 20;

// Bar chart configuration
const barChartConfig = {
  maxBarWidth: 500,
  barHeight: 50,
  maxClubs: 5,
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
  const { winnerStartFrame, finalTallies } = useMemo(() => {
    return {
      finalTallies: transferData.reduce((ft: Record<string, number>, x: any) => {
        if (!ft[x.to]) ft[x.to] = 0
        ft[x.to] += Number(parseFloat(x.price.replace("€", "").replace("M", "")))
        return ft
      }, {} as Record<string, number>),
      winnerStartFrame: transferData.reduce((start, x) => Math.max(x.start + x.duration, start), 0) * fps + 20
    }
  }, [])
  const chartOpacity = interpolate(
    frame,
    [winnerStartFrame - 60, winnerStartFrame],
    [1, 0],
    {
      // This ensures opacity stays at 0 after the animation is done
      extrapolateRight: 'clamp',
    }
  );
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <RaceScene passive={true} />
      <AbsoluteFill style={{ opacity: chartOpacity }}>
        <SpendingBarChart
          transfers={transferData}
          clubLogos={clubLogos}
          config={barChartConfig}
          nameMap={clubNameMap}
        />
      </AbsoluteFill>
      <TransferOverlay transfers={transferData} />
      <AudioOrchestrator startFrame={winnerStartFrame} sounds={sounds} />
    </AbsoluteFill>
  );
};