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
import crying from "./assets/lottie/crying.json"
import what from "./assets/lottie/what.json"
import { StandaloneLottie } from './components/StandaloneLottie';
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame}))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame}/>
  </Sequence>
    <StandaloneLottie animationData={crying} target={"babychakma"} startFrame={314} loop={false} durationInSeconds={1.7} offsetX={-280} offsetY={-120} width={200} filter="brightness(1.2)"/>
    <StandaloneLottie animationData={what} startFrame={870} loop={false} durationInSeconds={1} target={"officer2"} width={250} offsetX={-300} offsetY={-300} fadeOutSeconds={0} filter="brightness(1.2)"/>
    <StandaloneLottie animationData={failure} startFrame={1055} loop={false} durationInSeconds={0.7} top={550} left={440} width={250}/>
    <StandaloneLottie animationData={sleeping} startFrame={925} loop={false} durationInSeconds={1.35} top={1050} left={0} width={400} fadeOutSeconds={0}  filter="brightness(1.2)"/>
    <StandaloneLottie animationData={idea} target="baboonCrouching" startFrame={1100} offsetX={-200} offsetY={-450} loop={false} durationInSeconds={0.75} width={500} fadeOutSeconds={0}/>
    <SpeechBubbleOverlay bubbles={bubbles}/> 
</AbsoluteFill>;