  import { RaceScene, startSequenceFrame } from "./components/Race";
  console.log({startSequenceFrame})
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
  import boost1 from "./assets/lottie/boost1.json"
  import shockwave from "./assets/lottie/shockwave.json"
  import { StandaloneLottie } from './components/StandaloneLottie';
  import Captioned from "../Captioned";
  const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
  export const TransferMarket: React.FC = () => <AbsoluteFill>
    <RaceScene />
    <Sequence from={0}>
      <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
    </Sequence>
    {/* <StandaloneLottie animationData={shockwave} startFrame={180} target="granny" durationInSeconds={1} offsetY={-0.15} width={500} fadeOutSeconds={0}/> */}
    {/* <StandaloneLottie animationData={boost1} startFrame={10} target={"girl"} offsetY={-0.25} durationInSeconds={0.8} width={400} fadeOutSeconds={0} filter="brightness(2) contrast(2)"/> */}
    {/* <StandaloneLottie animationData={arrow1} startFrame={410} cycleDuration={0.75} loop={true} durationInSeconds={0.7} target={"officer2"} width={250} offsetX={0.25} offsetY={-250} fadeInSeconds={0} fadeOutSeconds={0} filter="contrast(2)"/> */}
    <Captioned startSequenceFrame={startSequenceFrame} />

    {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
  </AbsoluteFill>;