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
import like from "./assets/lottie/like.json"
import sleeping from "./assets/lottie/sleeping.json"
import { StandaloneLottie } from './components/StandaloneLottie';
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame}))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame}/>
  </Sequence>
    <StandaloneLottie animationData={failure} startFrame={1055} loop={false} durationInSeconds={0.7} top={550} left={440} width={250}/>
    <StandaloneLottie animationData={like} startFrame={1620} loop={false} durationInSeconds={1} top={450} left={350} width={400}/>
    <StandaloneLottie animationData={sleeping} startFrame={900} loop={false} durationInSeconds={1.8} top={1050} left={0} width={400}/>
    <SpeechBubbleOverlay bubbles={bubbles}/> 
</AbsoluteFill>;