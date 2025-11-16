import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  interpolate,
  staticFile, // Import staticFile to reference assets in /public
} from 'remotion';

// --- Direct Asset Imports ---
// This is the core of the new pattern. The component fetches its own data.
import captionsData from './captions.yaml';
const videoSource = 'captionSource.mp4'; // Assuming your video is here

// --- Type Definitions ---
// Co-locating types here makes the component fully self-contained.
type Stroke = {
  width: number;
  color: string;
};

type StyleConfig = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  stroke: Stroke;
};

type Caption = {
  text: string;
  start: number;
  duration: number;
};

// --- Component Props ---
// The only prop needed now is for optional style overrides.
type CaptionedProps = {
  style?: Partial<StyleConfig>;
};

// --- Sub-component for a Single Animating Phrase (Unchanged) ---
const Phrase: React.FC<{ caption: Caption; style: StyleConfig }> = ({
  caption,
  style,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, 15], [25, 0], {
    extrapolateRight: 'clamp',
  });

  const textStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    textAlign: 'center',
    WebkitTextStroke: `${style.stroke.width}px ${style.stroke.color}`,
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
        <span style={textStyle}>{caption.text}</span>
      </div>
    </AbsoluteFill>
  );
};

// --- Main Composition Component ---
const Captioned: React.FC<CaptionedProps> = ({
  style: styleOverrides,
}) => {
  // Define the default styles directly inside the component
  const defaultStyle: StyleConfig = {
    fontFamily: 'Helvetica Neue, Arial, sans-serif',
    fontSize: 90,
    fontWeight: 'bold',
    color: 'white',
    stroke: {
      width: 6,
      color: 'black',
    },
  };

  // Merge default styles with any overrides passed via props
  const mergedStyle: StyleConfig = {
    ...defaultStyle,
    ...styleOverrides,
    stroke: {
      ...defaultStyle.stroke,
      ...styleOverrides?.stroke,
    },
  };

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Layer 1: The background video using staticFile() */}
      <Video src={staticFile(videoSource)} style={{ width: '100%', height: '100%' }} />

      {/* Layer 2: The captions */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          bottom: '15%',
        }}
      >
        {(captionsData as Caption[]).map((caption) => (
          <Sequence
            key={caption.text}
            from={caption.start}
            durationInFrames={caption.duration}
            name={`"${caption.text}"`}
          >
            <Phrase caption={caption} style={mergedStyle} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Make this the default export to be used as the composition's entry point
export default Captioned;