import { RaceScene } from "./components/Race";
import {
  AbsoluteFill,
  Audio
} from 'remotion';
import React from 'react';
import speechBubbleData from "./assets/speechBubbleData.json"
import { SpeechBubbleOverlay } from './components/SpeechBubble';
import subscribeLottie from "./EffectsManager/effects/Lottie/anims/subscribe.json"
import { StandaloneLottie } from './components/StandaloneLottie';
export const TransferMarket: React.FC = () => <AbsoluteFill>
  <RaceScene />
  {/* <Sequence from={0}>
    <Audio src={staticFile('narration.wav')} />
    </Sequence> */}
    {/* 
      <StandaloneLottie animationData={dribblingLottie} startFrame={0} loop={false} durationInSeconds={1.5} top={530} left={250} width={700}/>
      <SpeechBubbleOverlay bubbles={speechBubbleData}/> 
    */}
</AbsoluteFill>;