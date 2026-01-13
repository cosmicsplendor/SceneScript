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
  import hourglass from "./assets/lottie/hourglass.json"
  import { StandaloneLottie } from './components/StandaloneLottie';
  import Captioned from "../Captioned";
  const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
  export const TransferMarket: React.FC = () => <AbsoluteFill>
    <RaceScene />
    <Sequence from={0}>
      <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
    </Sequence>
    {/* <StandaloneLottie animationData={pointExplode} startFrame={25} target="girl1" durationInSeconds={1.25} offsetX={1.1} offsetY={-0.25} width={400} fadeOutSeconds={0} startOffset={0.5} filter="brightness(2) contrast(2)" />
    <StandaloneLottie animationData={noiseLines} startFrame={244} target={"girl2"} offsetX={-0.7} offsetY={-0.3} durationInSeconds={0.5} width={400} fadeOutSeconds={0} filter="brightness(2) contrast(2)" rotation={-90}/> */}
    <StandaloneLottie animationData={hourglass} startFrame={1350} loop={true} startOffset={0.5} durationInSeconds={1.5} target={"waiting"} width={400} offsetX={-0.2} offsetY={-.6} fadeInSeconds={0.25} fadeOutSeconds={0.25} filter="contrast(4)"/>
    <Captioned startSequenceFrame={startSequenceFrame} />
      
    <SpeechBubbleOverlay bubbles={bubbles}/>
  </AbsoluteFill>;