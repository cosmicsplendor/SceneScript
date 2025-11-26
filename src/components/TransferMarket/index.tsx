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
import alert from "./assets/lottie/alert.json"
import angryFace1 from "./assets/lottie/angryFace1.json"
import feelingDizzy from "./assets/lottie/feelingDizzy.json"
import { StandaloneLottie } from './components/StandaloneLottie';
import Captioned from "../Captioned";
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={0}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  <StandaloneLottie animationData={alert} startFrame={0} loop={false} durationInSeconds={1} fadeInSeconds={0} fadeOutSeconds={0.5} target="BullHead" width={300} offsetX={-0} offsetY={-1} filter="brightness(1.2)" />
  <StandaloneLottie animationData={angryFace1} startFrame={173} durationInSeconds={1.2} loop={true} cycleDuration={0.3} fadeInSeconds={0.2} fadeOutSeconds={0.1} target="AngryFarmer1" width={200} offsetX={0} offsetY={-0.4} filter="brightness(1.2)" />
  <StandaloneLottie animationData= {feelingDizzy} startFrame={850} loop={false} durationInSeconds={0.75} fadeInSeconds={0.2} target="Cow" width={300} offsetX={-0.12} offsetY={-0.3} filter="contrast(1.6) brightness(1)" startOffset={0.5} fadeOutSeconds={0.4}/> 
  <Captioned />

  <SpeechBubbleOverlay bubbles={bubbles}/>
</AbsoluteFill>;