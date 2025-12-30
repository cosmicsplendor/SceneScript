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
  import sleeping from "./assets/lottie/sleeping.json"
  import noiseLines from "./assets/lottie/noiseLines.json"
  import pointExplode from "./assets/lottie/pointExplode.json"
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
    {/* <StandaloneLottie animationData={arrow1} startFrame={410} cycleDuration={0.75} loop={true} durationInSeconds={0.7} target={"officer2"} width={250} offsetX={0.25} offsetY={-250} fadeInSeconds={0} fadeOutSeconds={0} filter="contrast(2)"/> */}
    <Captioned startSequenceFrame={startSequenceFrame} />

    {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
  </AbsoluteFill>;