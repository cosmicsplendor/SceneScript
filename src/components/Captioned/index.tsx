import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
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

// --- Sub-component for a Static Phrase using SVG for High-Quality Stroke ---
const Phrase: React.FC<{ caption: Caption; style: StyleConfig }> = ({
  caption,
  style,
}) => {
  const { fontFamily, fontSize, fontWeight, color, stroke } = style;

  // Style for the SVG text element
  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    fill: color, // Use fill for the text color in SVG
    stroke: stroke.color, // SVG stroke color
    strokeWidth: stroke.width, // SVG stroke width
    paintOrder: 'stroke fill', // Ensures stroke is drawn behind the fill
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
      {/* 
        Using an SVG container for the text.
        The viewBox can be adjusted if text gets clipped, but for centered text
        this setup is generally robust.
      */}
      <svg
        width="100%"
        height={fontSize * 1.5} // Give SVG enough height to contain text
        style={{
          // Use a drop-shadow for a subtle, clean separation from the background
          // This is optional but looks better than a hard stroke alone.
          filter: `drop-shadow(0px 5px 10px rgba(0, 0, 0, 0.5))`,
          overflow: 'visible', // Prevent clipping
        }}
      >
        <text
          x="50%"
          y="50%"
          dy="0.35em" // Vertical alignment trick for SVG text
          textAnchor="middle" // Horizontally center the text
          style={textStyle}
        >
          {caption.text}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// --- Main Composition Component (Largely Unchanged) ---
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
    fontSize: 76,
    fontWeight: '900',
    color: 'white',
    stroke: {
      width: 10, // SVG stroke width is more precise
      color: '#111',
    },
  };
  const fromBottom = '25%';
  
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