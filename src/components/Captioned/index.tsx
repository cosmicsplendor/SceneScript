import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  Video,
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

// Input type: start is optional
type CaptionInput = {
  text: string;
  start?: number;
  duration: number;
  color?: string;
};

// Normalized type: start is always present
type Caption = {
  text: string;
  start: number;
  duration: number;
  color?: string;
};

// --- Component Props ---
type CaptionedProps = {
  style?: Partial<StyleConfig>;
  videoSource?: false | string;
  startSequenceFrame?: number;
};

// --- Sub-component for a Static Phrase using SVG for High-Quality Stroke ---
const Phrase: React.FC<{ caption: Caption; style: StyleConfig }> = ({
  caption,
  style
}) => {
  const { fontFamily, fontSize, fontWeight, stroke } = style;
  // Style for the SVG text element
  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    fill: caption.color || style.color,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    paintOrder: 'stroke fill',
    letterSpacing: 3,
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg
        width="100%"
        height={fontSize * 1.5}
        style={{
          filter: `drop-shadow(0px 5px 10px rgba(0, 0, 0, 0.5))`,
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
          {caption.text}
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
  // State to hold normalized captions
  const [normalizedCaptions, setNormalizedCaptions] = React.useState<Caption[]>([]);

  // Normalize captions data on mount
  React.useEffect(() => {
    const rawCaptions = captionsData as CaptionInput[];
    const normalized: Caption[] = [];
    let currentTime = 0; // Track the absolute timeline position
    
    for (let i = 0; i < rawCaptions.length; i++) {
      const caption = rawCaptions[i];
      let start: number;
      
      if (caption.start !== undefined) {
        // Use provided start time
        start = caption.start;
        currentTime = start; // Update timeline position
      } else {
        // Calculate from current timeline position
        start = currentTime;
      }
      
      // Move timeline forward for next caption
      currentTime = start + caption.duration;
      
      // Adjust by startSequenceFrame offset
      const adjustedStart = start - startSequenceFrame;
      const adjustedEnd = adjustedStart + caption.duration;
      
      // Only include captions that will be visible (end after frame 0)
      if (adjustedEnd > 0) {
        // If caption starts before frame 0, clip it
        const visibleStart = Math.max(0, adjustedStart);
        const visibleDuration = adjustedStart < 0 
          ? caption.duration + adjustedStart  // Reduce duration by the clipped amount
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

  // Define the default styles directly inside the component
  const defaultStyle: StyleConfig = {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 100,
    fontWeight: '900',
    color: '#ffd000ff',
    stroke: {
      width: 40,
      // color: '#111111ff',
      color: '#000000',
    },
  };
  const fromBottom = '30%';
  
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
          >
            <Phrase caption={caption} style={mergedStyle}/>
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Captioned;