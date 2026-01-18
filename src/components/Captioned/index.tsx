import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  Video,
  useCurrentFrame,
  interpolate,
  Easing,
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
  isStatic?: boolean; 
};

// --- Sub-component for the Adaptive Phrase ---
const Phrase: React.FC<{ 
  caption: Caption; 
  style: StyleConfig; 
  isStatic: boolean 
}> = ({
  caption,
  style,
  isStatic 
}) => {
  const frame = useCurrentFrame();
  const { fontFamily, fontSize, fontWeight, stroke } = style;
  const { duration } = caption;

  let scale = 1;

  if (!isStatic) {
    // 1. DYNAMIC PEAK TIMING
    const peakFrame = Math.min(10, Math.max(2, Math.floor(duration * 0.25)));

    // 2. ADAPTIVE SCALE CURVE
    scale = interpolate(
      frame,
      [0, peakFrame, duration * 0.8], 
      [0.9, 1.1, 1], 
      {
        easing: Easing.out(Easing.quad),
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      }
    );
  }

  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    fill: caption.color || style.color,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    paintOrder: 'stroke fill',
    letterSpacing: '-2px',
    strokeLinejoin: 'round', 
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale})`,
      }}
    >
      <svg
        width="100%"
        height={fontSize * 1.6}
        style={{
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
  startSequenceFrame = 0,
  isStatic = false 
}) => {
  const [normalizedCaptions, setNormalizedCaptions] = React.useState<Caption[]>([]);

  React.useEffect(() => {
    const rawCaptions = captionsData as CaptionInput[];
    const normalized: Caption[] = [];
    let currentTime = 0;
    
    // --- OFFSET LOGIC ---
    // If dynamic, start 4 frames early so the "Pop" hits on the beat.
    // If static, stay strictly on time.
    const timingOffset = isStatic ? 0 : -4; 

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
      
      // Calculate start time relative to the sequence
      const adjustedStart = start - startSequenceFrame;
      
      // Apply the pre-roll offset here
      const finalStart = adjustedStart + timingOffset;
      const finalEnd = finalStart + caption.duration;

      // Only include captions that are actually visible
      if (finalEnd > 0) {
        normalized.push({
          text: caption.text,
          color: caption.color,
          start: finalStart, // This now includes the -4 offset
          duration: caption.duration,
        });
      }
    }
    setNormalizedCaptions(normalized);
    
    // Rerun this effect if isStatic changes
  }, [startSequenceFrame, isStatic]);

  const defaultStyle: StyleConfig = {
    fontFamily: "'Montserrat', sans-serif", 
    fontSize: 80,
    fontWeight: '900', 
    color: '#FFD700', 
    stroke: {
      width: 24, 
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
            <Phrase 
              caption={caption} 
              style={mergedStyle} 
              isStatic={isStatic} 
            />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Captioned;