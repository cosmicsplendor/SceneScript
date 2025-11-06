// src/Root.jsx
import './tailwind.css';
import { Composition } from 'remotion';
import React from 'react';
import './fonts.css';

const RES = {
  r1080p: { width: 1920, height: 1080 },
  r4k: { width: 3840, height: 2160 },
  r720p: { width: 1280, height: 720 },
  shorts: { width: 1080, height: 1920 },
  shorts_alt: { width: 720, height: 1280 },
  shorts_split: { width: 1140, height: 1140 },
}

import { TransferMarket } from './components/TransferMarket';
const _res = RES.shorts
const res = {
  width: Math.floor(_res.width / 2) * 2,
  height: Math.floor(_res.height / 2) * 2
};

const FPS = 60
export const RemotionRoot = () => {
  return (
    <>
     <Composition
        id="TransferMarket"
        component={TransferMarket as React.FC<any>}
        durationInFrames={FPS * 180}
        fps={FPS}
        width={res.width}
        height={res.height}
        defaultProps={{
        }}
      />
    </>
  )
};
