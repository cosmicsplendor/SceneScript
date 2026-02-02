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
import marker1 from "./assets/lottie/marker1.json"
import { StandaloneLottie } from './components/StandaloneLottie';
import Captioned from "../Captioned";
import { EyelineTemplate } from "../EyelineTemplate";
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={0}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  {/* <StandaloneLottie animationData={pointExplode} startFrame={25} target="girl1" durationInSeconds={1.25} offsetX={1.1} offsetY={-0.25} width={400} fadeOutSeconds={0} startOffset={0.5} filter="brightness(2) contrast(2)" />
    <StandaloneLottie animationData={noiseLines} startFrame={244} target={"girl2"} offsetX={-0.7} offsetY={-0.3} durationInSeconds={0.5} width={400} fadeOutSeconds={0} filter="brightness(2) contrast(2)" rotation={-90}/> */}
  {/* <StandaloneLottie animationData={marker1} startFrame={0} loop={false} startOffset={.1} cycleDuration={0.4} durationInSeconds={0.6} target={"Manwalk"} width={800} offsetX={-0} offsetY={-0.25} fadeInSeconds={0} fadeOutSeconds={0.2} filter="contrast(4) brightness(4)" rotation={90}/> */}
  <Captioned startSequenceFrame={startSequenceFrame} isStatic={true} />
  {/* <EyelineTemplate /> */}
  <SpeechBubbleOverlay bubbles={bubbles} />
</AbsoluteFill>;