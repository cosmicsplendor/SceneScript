// src/Root.jsx
import './tailwind.css';
import { Composition } from 'remotion';
import React from 'react';
import './fonts.css';

const RES = {
  r1080p: { width: 1920, height: 1080 },
  r4k: { width: 3840, height: 2160 },
  r720p: { width: 1280, height: 720 },
  shorts: { width: 1296 * 0.9, height: 2250 * 0.9 },
  shorts_alt: { width: 720, height: 1280 },
  shorts_split: { width: 1140, height: 1140 },
}

import { TRANSFER_LIFESPAN, TransferMarket } from './components/TransferMarket';
import { TRANSFER_LIFESPAN as MULTI_TRANSFER_LIFESPAN, MultiTransferMarket } from './components/TransferMarket/multi';
const _res = RES.r1080p
const res = {
  width: Math.floor(_res.width / 2) * 2,
  height: Math.floor(_res.height / 2) * 2
};

const FPS = 60
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Multi"
        component={MultiTransferMarket as React.FC<any>}
        durationInFrames={FPS * MULTI_TRANSFER_LIFESPAN}
        fps={FPS}
        width={res.width}
        height={res.height}
        defaultProps={{
        }}
      />
      <Composition
        id="TransferMarket"
        component={TransferMarket as React.FC<any>}
        durationInFrames={FPS * TRANSFER_LIFESPAN}
        fps={FPS}
        width={res.width}
        height={res.height}
        defaultProps={{
        }}
      />
    </>
  )
};
