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
import feelingDizzy from "./assets/lottie/feelingDizzy.json"
import { StandaloneLottie } from './components/StandaloneLottie';
import Captioned from "../Captioned";
import { EyelineTemplate } from "../EyelineTemplate";
const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  <Sequence from={0}>
    <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
  </Sequence>
  <StandaloneLottie animationData={feelingDizzy} startFrame={70} loop={false} startOffset={.1} cycleDuration={1} durationInSeconds={1.2} target={"thief1"} width={400} offsetX={-0.15} offsetY={-0.25} fadeInSeconds={0} fadeOutSeconds={0.25} filter="contrast(4) brightness(4)"/>
  <Captioned startSequenceFrame={startSequenceFrame} isStatic={true} />
  {/* <EyelineTemplate /> */}
  <SpeechBubbleOverlay bubbles={bubbles} />
</AbsoluteFill>;