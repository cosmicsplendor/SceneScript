import { AbsoluteFill } from 'remotion';
import { RaceScene } from '../components/Race';
import { TransferOverlay } from './components/TransferOverlay';
import { SpendingBarChart } from './components/SpendingChart';

export const TRANSFER_LIFESPAN = 20;

// Club logos mapping
const clubLogos = {
  "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  // Add more club logo mappings as needed
};
const clubNameMap = {
  "Manchester City": "Man City"
}


// Bar chart configuration
const barChartConfig = {
  maxBarWidth: 500,
  barHeight: 76,
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
    from: "Leverkusen",
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
    to: "Manchester City",
    start: 4.5,
    duration: 3.25,
    x: 370,
    y: 1230,
  },
  {
    name: "Jeremie Frimpong",
    price: "€35M", // ≈$36.84M
    from: "Leverkusen",
    to: "Liverpool",
    start: 8.5,
    duration: 3.2,
    x: 705,
    y: 1240,
  },
  {
    name: "Tijjani Reijnders",
    price: "€46M", // ≈$48.42M
    from: "AC Milan",
    to: "Manchester City",
    start: 12,
    duration: 3.25,
    x: 350,
    y: 1240,
  },
  {
    name: "Milos Kerkez",
    price: "€53.2M", // ≈$56M
    from: "Bournemouth",
    to: "Liverpool",
    start: 16.5,
    duration: 3.5,
    x: 718,
    y: 1250,
  },
  {
    name: "Rayan Ait-Nouri",
    price: "€36M", // ≈$37.89M
    from: "Wolves",
    to: "Manchester City",
    start: 20.5,
    duration: 3.25,
    x: 365,
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
        nameMap={clubNameMap}
      />
      <TransferOverlay transfers={transferData} />
    </AbsoluteFill>
  );
};