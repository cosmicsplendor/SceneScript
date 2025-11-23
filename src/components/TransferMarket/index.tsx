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
import fistBump from "./assets/lottie/fistBump.json"
import peeingDog from "./assets/lottie/peeingDog.json"
import thuglasses from "./assets/lottie/thuglasses.json"
import batteryLow from "./assets/lottie/batteryLow.json"
import alert from "./assets/lottie/alert.json"
import shockwave from "./assets/lottie/shockwave.json"
import { StandaloneLottie } from './components/StandaloneLottie';
import Captioned from "../Captioned";
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={60}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  <StandaloneLottie animationData={shockwave} startFrame={340} loop={false} durationInSeconds={1.25} target="Oldman1" width={600} offsetX={0.25} offsetY={0.1} filter="brightness(1.2)" fadeOutSeconds={0.5} />
  <StandaloneLottie animationData={alert} startFrame={522} loop={false} durationInSeconds={1} target="agressiveWolf" width={500} offsetX={0.4} offsetY={-0.6} filter="brightness(1.2)" />
  <StandaloneLottie animationData= {thuglasses} startFrame={1463} loop={false} durationInSeconds={1.5} target="convertible" width={200} offsetX={-0.2} offsetY={-0.4} filter="brightness(1.2)" />
  <StandaloneLottie animationData= {peeingDog} startFrame={470} loop={false} durationInSeconds={0.9} fadeInSeconds={0.5} target="IceHut" width={400} offsetX={-0.6} offsetY={0.2} filter="contrast(1.6) brightness(1)" />
  <StandaloneLottie animationData= {fistBump} startFrame={786} loop={false} durationInSeconds={0.9} target="GOOD_WOLF" width={800} offsetX={0.45} offsetY={-0.2} filter="contrast(1.6) brightness(1)" startOffset={0.5} fadeOutSeconds={0.4}/>
  <Captioned />

  {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
</AbsoluteFill>;