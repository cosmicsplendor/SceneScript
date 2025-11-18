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
import bone from "./assets/lottie/bone.json"
import alert from "./assets/lottie/alert.json"
import shockwave from "./assets/lottie/shockwave.json"
import { StandaloneLottie } from './components/StandaloneLottie';
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={60}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  <StandaloneLottie animationData={shockwave} startFrame={326} loop={false} durationInSeconds={1.5} target="Oldman1" width={500} offsetX={0.25} offsetY={0.1} filter="brightness(1.2)" fadeOutSeconds={1} />
  <StandaloneLottie animationData={alert} startFrame={532} loop={false} durationInSeconds={1} target="agressiveWolf" width={500} offsetX={0.5} offsetY={-0.5} filter="brightness(1.2)" />
  <StandaloneLottie animationData= {bone} startFrame={200} loop={false} durationInSeconds={0.6} target="ICEWOLF1" width={400} offsetX={-0.25} offsetY={-0.75} filter="brightness(1.2)" />

  {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
</AbsoluteFill>;