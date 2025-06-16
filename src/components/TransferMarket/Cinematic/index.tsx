import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { RaceScene } from '../components/Race';
import { TransferOverlay } from './components/TransferOverlay';
import { SpendingBarChart } from './components/SpendingChart';
import Thumbnail from '../components/Thumbanil';
import WinnerAnimation from '../Multi/WinnerAnimation';
import { useMemo } from 'react';

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
  logoSize: 28,
};
const transferData = [
  {
    "name": "Jeremie Frimpong",
    "price": "€35M",
    "from": "Leverkusen",
    "to": "Liverpool",
    "start": 1.4,
    "duration": 2.75,
    "x": 1115,
    "y": 780
  },
  {
    "name": "Rayan Ait-Nouri",
    "price": "€36M",
    "from": "Wolves",
    "to": "Manchester City",
    "start": 4.5,
    "duration": 3.25,
    "x": 780,
    "y": 780
  },
  {
    "name": "Tijjani Reijnders",
    "price": "€46M",
    "from": "AC Milan",
    "to": "Manchester City",
    "start": 8.5,
    "duration": 3.2,
    "x": 780,
    "y": 760
  },
  {
    "name": "Rayan Cherki",
    "price": "€36M",
    "from": "Lyon",
    "to": "Manchester City",
    "start": 12,
    "duration": 3.25,
    "x": 798,
    "y": 775
  },
  {
    "name": "Florian Wirtz",
    "price": "€150M",
    "from": "Leverkusen",
    "to": "Liverpool",
    "start": 16.5,
    "duration": 3.5,
    "x": 1110,
    "y": 780
  },
  {
    "name": "Milos Kerkez",
    "price": "€53.2M",
    "from": "Bournemouth",
    "to": "Liverpool",
    "start": 20.5,
    "duration": 3.25,
    "x": 1118,
    "y": 785
  }
]
export default () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const winnerStartFrame = useMemo(() => {
    return transferData.reduce((start, x) => Math.max(x.start + x.duration, start), 0) * fps
  }, [])
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {/* <Thumbnail /> */}
      <RaceScene passive={true} />
      <SpendingBarChart
        transfers={transferData}
        clubLogos={clubLogos}
        config={barChartConfig}
        nameMap={clubNameMap}
      />
      <TransferOverlay transfers={transferData} />
      {
        frame < winnerStartFrame ? null :
          <WinnerAnimation
            finalTallies={transferData.reduce((ft, x) => {
              ft[x.to] = Number(x.price.replace("M", ""))
              return ft
            }, {} as Record<string, number>)}
            frame={frame}
            startFrame={winnerStartFrame}
            teams={Object.entries(clubLogos).map(([name, logo]: [string, string]) => {
              return { name, logo, short: clubNameMap[name] }
            })}
            winner={{ name: "Liverpool", "short": "LIV", logo: clubLogos.Liverpool }}
            onComplete={() => { }}
          />
      }
    </AbsoluteFill>
  );
};