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
  import wrong from "./assets/lottie/wrong.json"
  import shockwave from "./assets/lottie/shockwave.json"
  import { StandaloneLottie } from './components/StandaloneLottie';
  import Captioned from "../Captioned";
  const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
  export const TransferMarket: React.FC = () => <AbsoluteFill>
    <RaceScene />
    <Sequence from={0}>
      <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
    </Sequence>
    <StandaloneLottie animationData={shockwave} startFrame={180} left={200} top={1000} durationInSeconds={0.75} width={500} fadeOutSeconds={0}/>
    <StandaloneLottie animationData={wrong} startFrame={1512} left={200} top={800} durationInSeconds={0.5} width={800} fadeOutSeconds={0} filter="contrast(2)"/>
    {/* <StandaloneLottie animationData={arrow1} startFrame={410} cycleDuration={0.75} loop={true} durationInSeconds={0.7} target={"officer2"} width={250} offsetX={0.25} offsetY={-250} fadeInSeconds={0} fadeOutSeconds={0} filter="contrast(2)"/> */}
    <Captioned />

    {/* <SpeechBubbleOverlay bubbles={bubbles}/> */}
  </AbsoluteFill>;