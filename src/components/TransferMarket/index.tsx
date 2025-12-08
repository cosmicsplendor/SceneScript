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
import no1 from "./assets/lottie/no1.json"
import marker1 from "./assets/lottie/marker1.json"
import party3 from "./assets/lottie/party3.json"
import { StandaloneLottie } from './components/StandaloneLottie';
import Captioned from "../Captioned";
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={0}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  <StandaloneLottie animationData={no1} startFrame={240} durationInSeconds={0.75} loop={true} fadeInSeconds={0.2} cycleDuration={0.85} fadeOutSeconds={0.2} target="Army1" width={400} offsetX={-0.5} offsetY={-0.4} filter="brightness(1.2)" />
  <StandaloneLottie animationData= {alert} startFrame={1975} loop={false} durationInSeconds={1} cycleDuration={1} fadeInSeconds={0.2} target="backup1" width={300} offsetX={0.525} offsetY={-0.45}  fadeOutSeconds={0.4} filter="brightness(2) contrast(10)"/>
  <StandaloneLottie animationData= {party3} startFrame={2127} loop={true} durationInSeconds={2.6} cycleDuration={1.3} fadeInSeconds={0.2} target="stubbysargent" width={1600} offsetX={0.5} offsetY={-0.2}  fadeOutSeconds={0.4} />
  <StandaloneLottie animationData= {marker1} startFrame={10} loop={false} durationInSeconds={0.75} cycleDuration={0.5} fadeInSeconds={0} target="soldier1" width={800} offsetX={0} offsetY={-0.36}  fadeOutSeconds={0.25} filter="contrast(10)"/>
  <Captioned />

  <SpeechBubbleOverlay bubbles={bubbles}/>
</AbsoluteFill>;