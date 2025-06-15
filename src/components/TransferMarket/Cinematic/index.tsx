import { AbsoluteFill } from 'remotion';
import {RaceScene} from '../components/Race';
import { TransferOverlay } from './components/TransferOverlay';

export const TRANSFER_LIFESPAN = 20;

// Example transfer data - replace with your actual data
const transferData = [
  {
    name: "Cherki",
    price: "$20M",
    start: 5, // appears at 5 seconds
    duration: 3, // visible for 3 seconds
    x: 400, // centered horizontally (adjust based on your video width)
    y: 300, // positioned vertically (adjust based on your video height)
  },
  {
    name: "Mbappé",
    price: "$180M",
    start: 12,
    duration: 4,
    x: 600,
    y: 250,
  },
  {
    name: "Haaland",
    price: "$75M",
    start: 18,
    duration: 3.5,
    x: 350,
    y: 400,
  },
  // Add more transfers as needed
];

export default () => {
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <RaceScene passive={true} />
      <TransferOverlay transfers={transferData} />
    </AbsoluteFill>
  );
};