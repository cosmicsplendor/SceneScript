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
  import what from "./assets/lottie/what.json"
  import marker1 from "./assets/lottie/marker1.json"
  import boost1 from "./assets/lottie/boost1.json"
  import idea from "./assets/lottie/idea.json"
  import arrow1 from "./assets/lottie/arrow1.json"
  import failure from "./assets/lottie/failure.json"
  import { StandaloneLottie } from './components/StandaloneLottie';
  import Captioned from "../Captioned";
  const bubbles = speechBubbleData.map(d => ({ ...d, start: d.start - startSequenceFrame }))
  export const TransferMarket: React.FC = () => <AbsoluteFill>
    <RaceScene />
    <Sequence from={0}>
      <Audio src={staticFile('narration.wav')} startFrom={startSequenceFrame} />
    </Sequence>
    <StandaloneLottie animationData= {sleeping} startFrame={539}  durationInSeconds={1.4} cycleDuration={1} fadeInSeconds={0}  width={300} top={950} left={50}  fadeOutSeconds={0.1} filter="contrast(10)"/>
    <StandaloneLottie animationData= {boost1} startFrame={20} loop={false} durationInSeconds={0.9} fadeInSeconds={0.1}  width={400} target={"soldierapproachingshadow"}  offsetX={0.4} offsetY={0}  fadeOutSeconds={0.25}  filter="contrast(10)" rotation={15}/>
    <StandaloneLottie animationData= {marker1} startFrame={0} loop={false} durationInSeconds={0.5} cycleDuration={0.4} fadeInSeconds={0}  width={1200} target={"soldierapproachingshadow"} flip offsetY={-0.276} fadeOutSeconds={0.25} offsetX={-0.025}  filter="contrast(10)" rotation={90}/>
    <StandaloneLottie animationData={idea} target="baboonCrouching" startFrame={714} offsetX={-200} offsetY={-450} loop={false} durationInSeconds={0.75} width={500} fadeOutSeconds={0}/>
    {/* <StandaloneLottie animationData={arrow1} startFrame={410} cycleDuration={0.75} loop={true} durationInSeconds={0.7} target={"officer2"} width={250} offsetX={0.25} offsetY={-250} fadeInSeconds={0} fadeOutSeconds={0} filter="contrast(2)"/> */}
    <Captioned />

    <SpeechBubbleOverlay bubbles={bubbles}/>
  </AbsoluteFill>;