import { AbsoluteFill } from 'remotion';
import {RaceScene} from './components/Race';

export const TRANSFER_LIFESPAN = 20

export default () => {
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <RaceScene passive={true} />
    </AbsoluteFill>
  );
};