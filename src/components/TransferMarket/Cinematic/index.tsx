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
  // Liverpool FC Incomings
  {
    name: "Jeremie Frimpong",
    price: "$29.5M",
    from: "Bayer Leverkusen",
    to: "Liverpool",
    start: 2,
    duration: 4,
    x: 350,
    y: 400,
  },
  {
    name: "Armin Pecsi",
    price: "$1.5M",
    from: "Puskas AFC",
    to: "Liverpool",
    start: 21,
    duration: 3,
    x: 360,
    y: 410,
  },
  {
    name: "Milos Kerkez",
    price: "$60M",
    from: "Bournemouth",
    to: "Liverpool",
    start: 21,
    duration: 5,
    x: 370,
    y: 420,
  },
  {
    name: "Florian Wirtz",
    price: "$133M",
    from: "Bayer Leverkusen",
    to: "Liverpool",
    start: 22,
    duration: 5,
    x: 380,
    y: 430,
  },
  // Manchester City Incomings
  {
    name: "Rayan Ait-Nouri",
    price: "$31M",
    from: "Wolves",
    to: "Man City",
    start: 24,
    duration: 4,
    x: 390,
    y: 440,
  },
  {
    name: "Rayan Cherki",
    price: "$34M",
    from: "Lyon",
    to: "Man City",
    start: 21,
    duration: 4,
    x: 400,
    y: 450,
  },
  {
    name: "Tijjani Reijnders",
    price: "$46.6M",
    from: "AC Milan",
    to: "Man City",
    start: 26,
    duration: 4,
    x: 410,
    y: 460,
  },
  {
    name: "Marcus Bettinelli",
    price: "$0.4M",
    from: "Chelsea",
    to: "Man City",
    start: 33,
    duration: 1,
    x: 420,
    y: 470,
  },
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