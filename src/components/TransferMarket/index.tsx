import { RaceScene, startSequenceFrame } from "./components/Race";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile
} from 'remotion';
import React from 'react';
import speechBubbleData from "./assets/speechBubbleData.json"
import { SpeechBubbleOverlay } from './components/SpeechBubble';
import failure from "./assets/lottie/failure.json"
import idea from "./assets/lottie/idea.json"
import sleeping from "./assets/lottie/sleeping.json"
import shockwave from "./assets/lottie/shockwave.json"
import what from "./assets/lottie/what.json"
import { StandaloneLottie } from './components/StandaloneLottie';
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={60}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  <StandaloneLottie animationData={shockwave} startFrame={362} loop={false} durationInSeconds={1.5} target="Oldman1" width={500} offsetX={0.25} offsetY={0.1} filter="brightness(1.2)" fadeOutSeconds={1} />

  {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
</AbsoluteFill>;