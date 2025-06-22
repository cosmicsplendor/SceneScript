import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RaceScene } from '../components/Race';
import { AudioOrchestrator } from '../Cinematic/components/AudioOrchestrator';
import { useMemo } from 'react';

export const TRANSFER_LIFESPAN = 20;

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
    "name": "Real Madrid", "value": 1330,

  },
  {
    "name": "Manchester City", "value": 1180,

  },
  {
    "name": "Paris Saint-Germain", "value": 1050,

  },
  {
    "name": "Chelsea", "value": 972,

  },
  {
    "name": "Bayern Munich", "value": 843,

  },
  {
    "name": "Inter Milan", "value": 703,

  },
  {
    "name": "Juventus", "value": 632,

  },
  {
    "name": "Atlético Madrid", "value": 506,

  },
  {
    "name": "Borussia Dortmund", "value": 456,

  },
  {
    "name": "Benfica", "value": 364,

  }
]
transferData.forEach(d => {
  d.start += 6.2
})
const sounds = [
  {
    src: "cin1.wav",
    start: 30,
  },
  {
    src: "sword.mp3",
    start: 15,
  },
  // {
  //   src: "the_urban_groove.mp3",
  //   start: 0,
  //   volume: 0.5

  // },
  {
    src: "cin2.wav",
    start: 462
  },
  {
    src: "cin3.wav",
    start: 653
  },
  {
    src: "cin4.wav",
    start: 814
  },
  {
    src: "cin5.wav",
    start: 1030
  },
  {
    src: "cin6.wav",
    start: 1228
  },
  {
    src: "cin7.wav",
    start: 1423
  },
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

      </AbsoluteFill>
      <AudioOrchestrator startFrame={winnerStartFrame} sounds={sounds} />
    </AbsoluteFill>
  );
};