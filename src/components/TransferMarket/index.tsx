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
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame}))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame}/>
  </Sequence>
    <StandaloneLottie animationData={shockwave} startFrame={159} loop={false} durationInSeconds={1.2} top={1050} left={250} width={400} filter="brightness(1.2)"/>

    {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
</AbsoluteFill>;