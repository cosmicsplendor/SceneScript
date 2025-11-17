import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Video,
  staticFile,
} from 'remotion';

// --- Direct Asset Imports ---
import captionsData from './captions.yaml';
const videoSource = 'captionSource.mp4';

// --- Type Definitions ---
type Stroke = {
  width: number;
  color: string;
};

type StyleConfig = {
  fontFamily: string;
  fontSize: number;
  fontWeight: React.CSSProperties['fontWeight'];
  color: string;
  stroke: Stroke;
};

// Input type: start is optional
type CaptionInput = {
  text: string;
  start?: number;
  duration: number;
};

// Normalized type: start is always present
type Caption = {
  text: string;
  start: number;
  duration: number;
};

// --- Component Props ---
type CaptionedProps = {
  style?: Partial<StyleConfig>;
};

// --- Sub-component for a Static Phrase (No Animation) ---
const Phrase: React.FC<{ caption: Caption; style: StyleConfig }> = ({
  caption,
  style,
}) => {
  const textStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    paintOrder: 'stroke fill',
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
      <span style={textStyle}>{caption.text}</span>
    </AbsoluteFill>
  );
};

// --- Main Composition Component ---
const Captioned: React.FC<CaptionedProps> = ({
  style: styleOverrides,
}) => {
  // State to hold normalized captions
  const [normalizedCaptions, setNormalizedCaptions] = React.useState<Caption[]>([]);

  // Normalize captions data on mount
  React.useEffect(() => {
    const rawCaptions = captionsData as CaptionInput[];
    const normalized: Caption[] = [];
    
    for (let i = 0; i < rawCaptions.length; i++) {
      const caption = rawCaptions[i];
      let start: number;
      
      if (caption.start !== undefined) {
        // Use provided start time
        start = caption.start;
      } else if (i > 0) {
        // Calculate from previous caption's end
        const prev = normalized[i - 1];
        start = prev.start + prev.duration;
      } else {
        // First caption with no start defaults to 0
        start = 0;
      }
      
      normalized.push({
        text: caption.text,
        start,
        duration: caption.duration,
      });
    }
    
    setNormalizedCaptions(normalized);
  }, []);

  // Define the default styles directly inside the component
  const defaultStyle: StyleConfig = {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 80,
    fontWeight: '900',
    color: 'white',
    stroke: {
      width: 12,
      color: '#222222',
    },
  };
  const fromBottom = '16%';
  
  // Merge default styles with any provided overrides
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
          bottom: fromBottom,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {normalizedCaptions.map((caption, index) => (
          <Sequence
            key={`${caption.text}-${index}`}
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