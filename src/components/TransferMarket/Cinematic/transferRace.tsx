import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RaceScene } from '../components/Race';
import { TransferOverlay } from './components/TransferOverlay';
import { SpendingBarChart } from './components/SpendingChart';
import Thumbnail from '../components/Thumbanil';
import WinnerAnimation from '../Multi/WinnerAnimation';
import { useMemo } from 'react';
import { AudioOrchestrator } from './components/AudioOrchestrator';

export const TRANSFER_LIFESPAN = 20;

// Club logos mapping
const clubLogos = {
  "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  // Add more club logo mappings as needed
};
const clubNameMap = {
  "Manchester City": "MCI",
  "Liverpool": "LIV"
}

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
const transferData = [
  // {
  //   "name": "Jeremie Frimpong",
  //   "price": "€35M",
  //   "from": "Leverkusen",
  //   "to": "Liverpool",
  //   "start": 1.4,
  //   "duration": 3,
  //   "x": 1115,
  //   "y": 780
  // },
  // {
  //   "name": "Rayan Ait-Nouri",
  //   "price": "€36M",
  //   "from": "Wolves",
  //   "to": "Manchester City",
  //   "start": 4.5,
  //   "duration": 3.25,
  //   "x": 780,
  //   "y": 780
  // },
  // {
  //   "name": "Tijjani Reijnders",
  //   "price": "€46M",
  //   "from": "AC Milan",
  //   "to": "Manchester City",
  //   "start": 7.5,
  //   "duration": 3.7,
  //   "x": 780,
  //   "y": 760
  // },
  // {
  //   "name": "Rayan Cherki",
  //   "price": "€36M",
  //   "from": "Lyon",
  //   "to": "Manchester City",
  //   "start": 11,
  //   "duration": 3.25,
  //   "x": 798,
  //   "y": 775
  // },
  // {
  //   "name": "Florian Wirtz",
  //   "price": "€150M",
  //   "from": "Leverkusen",
  //   "to": "Liverpool",
  //   "start": 14.5,
  //   "duration": 3.5,
  //   "x": 1110,
  //   "y": 780
  // },
  // {
  //   "name": "Milos Kerkez",
  //   "price": "€53.2M",
  //   "from": "Bournemouth",
  //   "to": "Liverpool",
  //   "start": 17.5,
  //   "duration": 3.25,
  //   "x": 1118,
  //   "y": 785
  // }
]

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