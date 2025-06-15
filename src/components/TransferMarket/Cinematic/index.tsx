import { AbsoluteFill } from 'remotion';
import { RaceScene } from '../components/Race';
import { TransferOverlay } from './components/TransferOverlay';
import { SpendingBarChart } from './components/SpendingChart';

export const TRANSFER_LIFESPAN = 20;

// Club logos mapping
const clubLogos = {
  "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "Man City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  // Add more club logo mappings as needed
};

// Bar chart configuration
const barChartConfig = {
  maxBarWidth: 250,
  barHeight: 32,
  maxClubs: 5,
  barColor: '#00ff88',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  textColor: 'white',
  logoSize: 28,
};

// Example transfer data - replace with your actual data
const transferData = [
  {
    name: "Florian Wirtz",
    price: "€150M", // ≈$157.89M
    from: "Bayer Leverkusen",
    to: "Liverpool",
    start: 1.4,
    duration: 2.75,
    x: 685,
    y: 1240,
  },
  {
    name: "Rayan Cherki",
    price: "€36M", // ≈$37.89M
    from: "Lyon",
    to: "Man City",
    start: 4.5,
    duration: 3.25,
    x: 390,
    y: 1260,
  },
  {
    name: "Jeremie Frimpong",
    price: "€35M", // ≈$36.84M
    from: "Bayer Leverkusen",
    to: "Liverpool",
    start: 8.5,
    duration: 3.2,
    x: 700,
    y: 1260,
  },
  {
    name: "Tijjani Reijnders",
    price: "€46M", // ≈$48.42M
    from: "AC Milan",
    to: "Man City",
    start: 12,
    duration: 3.25,
    x: 400,
    y: 1240,
  },
  {
    name: "Milos Kerkez",
    price: "€53.2M", // ≈$56M
    from: "Bournemouth",
    to: "Liverpool",
    start: 16.5,
    duration: 3.5,
    x: 695,
    y: 1250,
  },
  {
    name: "Rayan Ait-Nouri",
    price: "€36M", // ≈$37.89M
    from: "Wolves",
    to: "Man City",
    start: 20.5,
    duration: 3.25,
    x: 395,
    y: 1240,
  }
];

export default () => {
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <RaceScene passive={true} />
      <SpendingBarChart
        transfers={transferData}
        clubLogos={clubLogos}
        config={barChartConfig}
      />
      <TransferOverlay transfers={transferData} />
    </AbsoluteFill>
  );
};