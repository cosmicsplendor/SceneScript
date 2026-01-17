import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  Video,
  useCurrentFrame,
  interpolate,
  Easing, // Import Easing for smoother curve control
} from 'remotion';

// --- Direct Asset Imports ---
import captionsData from './captions.yaml';

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

type CaptionInput = {
  text: string;
  start?: number;
  duration: number;
  color?: string;
};

type Caption = {
  text: string;
  start: number;
  duration: number;
  color?: string;
};

type CaptionedProps = {
  style?: Partial<StyleConfig>;
  videoSource?: false | string;
  startSequenceFrame?: number;
};

// --- Sub-component for the Adaptive Phrase ---
const Phrase: React.FC<{ caption: Caption; style: StyleConfig }> = ({
  caption,
  style
}) => {
  const frame = useCurrentFrame();
  const { fontFamily, fontSize, fontWeight, stroke } = style;
  const { duration } = caption;

  // --- 1. DYNAMIC PEAK TIMING ---
  // Calculates when the "Pop" (overshoot) happens based on word duration.
  // Logic: 
  // - Short words (e.g., 5 frames) peak around frame 2 (very snappy).
  // - Long words (e.g., 60 frames) peak around frame 8 (gentler entry).
  // - We cap it at frame 10 so it doesn't feel lazy.
  const peakFrame = Math.min(10, Math.max(2, Math.floor(duration * 0.25)));

  // --- 2. ADAPTIVE SCALE CURVE ---
  const scale = interpolate(
    frame,
    [0, peakFrame, duration], 
    // Start at 0.6 (Big start), Overshoot to 1.15, Settle to 1.0 at the VERY END
    [0.7, 1.15, 1], 
    {
      easing: Easing.out(Easing.quad), // Smooths the entry pop
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    }
  );

  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    fill: caption.color || style.color,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    paintOrder: 'stroke fill',
    letterSpacing: '-2px',
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        // Pure scale, adaptive timing
        transform: `scale(${scale})`,
      }}
    >
      <svg
        width="100%"
        height={fontSize * 1.6}
        style={{
          // Solid, hard shadow for the sticker look
          filter: `drop-shadow(0px 6px 0px rgba(0, 0, 0, 0.4))`,
          overflow: 'visible',
        }}
      >
        <text
          x="50%"
          y="50%"
          dy="0.35em"
          textAnchor="middle"
          style={textStyle}
        >
          {caption.text.toUpperCase()}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// --- Main Composition Component ---
const Captioned: React.FC<CaptionedProps> = ({
  style: styleOverrides,
  videoSource = false,
  startSequenceFrame = 0
}) => {
  const [normalizedCaptions, setNormalizedCaptions] = React.useState<Caption[]>([]);

  React.useEffect(() => {
    const rawCaptions = captionsData as CaptionInput[];
    const normalized: Caption[] = [];
    let currentTime = 0;
    
    for (let i = 0; i < rawCaptions.length; i++) {
      const caption = rawCaptions[i];
      let start: number;
      
      if (caption.start !== undefined) {
        start = caption.start;
        currentTime = start;
      } else {
        start = currentTime;
      }
      
      currentTime = start + caption.duration;
      const adjustedStart = start - startSequenceFrame;
      const adjustedEnd = adjustedStart + caption.duration;
      
      if (adjustedEnd > 0) {
        const visibleStart = Math.max(0, adjustedStart);
        const visibleDuration = adjustedStart < 0 
          ? caption.duration + adjustedStart
          : caption.duration;
        
        normalized.push({
          text: caption.text,
          color: caption.color,
          start: visibleStart,
          duration: visibleDuration,
        });
      }
    }
    setNormalizedCaptions(normalized);
  }, [startSequenceFrame]);

  const defaultStyle: StyleConfig = {
    fontFamily: "'Montserrat', sans-serif", 
    fontSize: 80,
    fontWeight: '900', 
    color: '#FFD700', 
    stroke: {
      width: 15, 
      color: 'black',
    },
  };
  
  const fromBottom = '35%';
  
  const mergedStyle: StyleConfig = {
    ...defaultStyle,
    ...styleOverrides,
    stroke: {
      ...defaultStyle.stroke,
      ...styleOverrides?.stroke,
    },
  };

  return (
    <AbsoluteFill style={{}}>
      {videoSource && <Video src={staticFile(videoSource)} style={{ width: '100%', height: '100%' }} />}
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
            style={{ zIndex: index }} 
          >
            <Phrase caption={caption} style={mergedStyle} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Captioned;