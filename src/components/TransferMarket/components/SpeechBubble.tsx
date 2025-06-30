import React, { useState, useRef, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Sequence, Audio, staticFile } from 'remotion';
import { raceSceneObjectRegistry } from './Race/persistent';

// --- Interfaces ---
interface SpeechBubbleData {
  text: string;
  start: number;
  duration: number;
  x?: number; // Now optional
  y?: number; // Now optional
  target?: string; // e.g., "Bayern Munich"
  offsetX?: number; // Optional offsets
  offsetY?: number;
  type?: 'message' | 'thought';
  arrowDir?: 'up' | 'down' | 'left' | 'right';
  style?: 'minimal' | 'colorful' | 'comic';
  fontSize?: number;
  fontFamily?: string;
  audioFile?: string;
  volume?: number;
  maxWidth?: number; // Prop to override the default max-width
}

interface SpeechBubbleProps {
  bubble: SpeechBubbleData;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ bubble }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const textRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const {
    start,
    duration,
    text,
    x: staticX,
    y: staticY,
    target,
    offsetX = 0,
    offsetY = 0,
    type = 'message',
    arrowDir = 'down',
    style = 'minimal',
    fontSize = 36,
    fontFamily = 'Segoe UI, sans-serif',
    maxWidth = 280, // A sensible default max-width
  } = bubble;

  useLayoutEffect(() => {
    if (textRef.current) {
      setDimensions({
        width: textRef.current.offsetWidth,
        height: textRef.current.offsetHeight,
      });
    }
  }, [text, fontSize, fontFamily, maxWidth]);

  // Calculate position based on target or use static coordinates
  const getPosition = (): { x: number; y: number } => {
    if (target && raceSceneObjectRegistry.players.has(target)) {
      const transform = raceSceneObjectRegistry.players.get(target)!;
      
      let x = transform.pos.x;
      let y = transform.pos.y;
      
      // Calculate position based on arrow direction
      switch (arrowDir) {
        case 'up':
          // Place bubble below the target (arrow points up to target)
          x += transform.width / 2;
          y += transform.height; // 20px gap
          break;
        case 'down':
          // Place bubble above the target (arrow points down to target)
          x += transform.width / 2;
          y -= transform.height / 2; // 20px gap above
          break;
        case 'left':
          // Place bubble to the right of target (arrow points left to target)
          x += transform.width * 1.5; // 20px gap to the right
          y += transform.height / 2;
          break;
        case 'right':
          // Place bubble to the left of target (arrow points right to target)
          x -= transform.width * 0.5 + 20; // 20px gap to the left
          y += transform.height / 2;
          break;
      }
      
      // Apply additional offsets
      x += offsetX;
      y += offsetY;
      
      return { x, y };
    }
    
    // Fallback to static coordinates (with validation)
    if (staticX !== undefined && staticY !== undefined) {
      return { x: staticX + offsetX, y: staticY + offsetY };
    }
    
    // Default to center if no position data available
    return { x: offsetX, y: offsetY };
  };

  const { x, y } = getPosition();

  // ... (animations and style config remain the same) ...
  const startFrame = start * fps;
  const endFrame = startFrame + duration * fps;
  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeInDuration = 0.15;
  const fadeOutStart = 0.85;
  const scale = interpolate(progress, [0, fadeInDuration], [0.2, 1], { easing: Easing.out(Easing.back(1.5)), extrapolateRight: 'clamp' });
  const opacity = interpolate(progress, [0, fadeInDuration, fadeOutStart, 1], [0, 1, 1, 0]);
  
  const getStyleConfig = () => {
    switch (style) {
      case 'colorful': return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)', shadow: 'drop-shadow(0 10px 20px rgba(102, 126, 234, 0.4))', font: fontFamily };
      case 'comic': return { background: '#ffffff', textColor: '#000000', borderColor: '#000000', shadow: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))', font: 'Bangers, cursive' };
      default: return { background: '#ffffff', textColor: '#1f2937', borderColor: 'rgba(0, 0, 0, 0.15)', shadow: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))', font: fontFamily };
    }
  };
  const styleConfig = getStyleConfig();
  const isComic = style === 'comic';
  const borderSize = isComic ? 2 : 1;

  const getSvgPathAndDimensions = (bubbleWidth: number, bubbleHeight: number) => {
    // This function remains the same, as its logic is sound.
    // ... (full SVG path generation logic) ...
    const radius = 20; const arrowHeight = 16; const arrowWidth = 28; const halfBorder = borderSize / 2; let path = '', viewBoxWidth = bubbleWidth, viewBoxHeight = bubbleHeight, foreignObjectX = 0, foreignObjectY = 0; switch (arrowDir) { case 'up': viewBoxHeight = bubbleHeight + arrowHeight; foreignObjectY = arrowHeight; path = `M${halfBorder},${arrowHeight + radius} A${radius},${radius} 0 0 1 ${radius},${arrowHeight + halfBorder} L${bubbleWidth / 2 - arrowWidth / 2},${arrowHeight + halfBorder} L${bubbleWidth / 2},${halfBorder} L${bubbleWidth / 2 + arrowWidth / 2},${arrowHeight + halfBorder} L${bubbleWidth - radius},${arrowHeight + halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${arrowHeight + radius} L${bubbleWidth - halfBorder},${bubbleHeight + arrowHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight + arrowHeight - halfBorder} L${radius},${bubbleHeight + arrowHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight + arrowHeight - radius} Z`; break; case 'left': viewBoxWidth = bubbleWidth + arrowHeight; foreignObjectX = arrowHeight; path = `M${arrowHeight + halfBorder},${radius} A${radius},${radius} 0 0 1 ${arrowHeight + radius},${halfBorder} L${arrowHeight + bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${arrowHeight + bubbleWidth - halfBorder},${radius} L${arrowHeight + bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${arrowHeight + bubbleWidth - radius},${bubbleHeight - halfBorder} L${arrowHeight + radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${arrowHeight + halfBorder},${bubbleHeight - radius} L${arrowHeight + halfBorder},${bubbleHeight / 2 + arrowWidth / 2} L${halfBorder},${bubbleHeight / 2} L${arrowHeight + halfBorder},${bubbleHeight / 2 - arrowWidth / 2} Z`; break; case 'right': viewBoxWidth = bubbleWidth + arrowHeight; path = `M${halfBorder},${radius} A${radius},${radius} 0 0 1 ${radius},${halfBorder} L${bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${radius} L${bubbleWidth - halfBorder},${bubbleHeight / 2 - arrowWidth / 2} L${bubbleWidth + arrowHeight - halfBorder},${bubbleHeight / 2} L${bubbleWidth - halfBorder},${bubbleHeight / 2 + arrowWidth / 2} L${bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight - halfBorder} L${radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight - radius} Z`; break; default: viewBoxHeight = bubbleHeight + arrowHeight; path = `M${halfBorder},${radius} A${radius},${radius} 0 0 1 ${radius},${halfBorder} L${bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${radius} L${bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight - halfBorder} L${bubbleWidth / 2 + arrowWidth / 2},${bubbleHeight - halfBorder} L${bubbleWidth / 2},${bubbleHeight + arrowHeight - halfBorder} L${bubbleWidth / 2 - arrowWidth / 2},${bubbleHeight - halfBorder} L${radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight - radius} Z`; break; } return { path, viewBoxWidth, viewBoxHeight, foreignObjectX, foreignObjectY, bubbleWidth, bubbleHeight };
  };

  const renderBubble = () => {
    if (type === 'thought') {
      return (
        <div style={{ position: 'relative' }}>
          {/* Main thought bubble now a dynamic cloud shape */}
          <div
            style={{
              background: styleConfig.background,
              border: `${isComic ? 2 : 1}px solid ${styleConfig.borderColor}`,
              boxShadow: styleConfig.shadow,
              padding: '25px 30px',
              textAlign: 'center',
              borderRadius: '63% 37% 54% 46% / 55% 48% 52% 45%',
            }}
          >
            <div
              style={{
                color: styleConfig.textColor,
                fontSize: `${fontSize}px`,
                fontWeight: '600',
                fontFamily: styleConfig.font,
                lineHeight: '1.3',
                wordBreak: 'break-word',
              }}
            >
              {text}
            </div>
          </div>
          {/* Smaller thought circles */}
          <div
            style={{
              position: 'absolute',
              bottom: -25,
              left: '20%',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: styleConfig.background,
              border: `${isComic ? 2 : 1}px solid ${styleConfig.borderColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: '15%',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: styleConfig.background,
              border: `${isComic ? 2 : 1}px solid ${styleConfig.borderColor}`,
            }}
          />
        </div>
      );
    }

    if (!dimensions) return null;

    // These values now represent the *entire* padding.
    const paddingX = 40;
    const paddingY = 32;
    const finalWidth = dimensions.width + paddingX;
    const finalHeight = dimensions.height + paddingY;

    const { path, viewBoxWidth, viewBoxHeight, foreignObjectX, foreignObjectY, bubbleWidth, bubbleHeight } = getSvgPathAndDimensions(finalWidth, finalHeight);

    return (
      <svg width={viewBoxWidth} height={viewBoxHeight} viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={{ filter: styleConfig.shadow }}>
        <defs> <linearGradient id="colorful-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#667eea' }} /><stop offset="100%" style={{ stopColor: '#764ba2' }} /></linearGradient> </defs> <path d={path} fill={style === 'colorful' ? 'url(#colorful-gradient)' : styleConfig.background} stroke={styleConfig.borderColor} strokeWidth={borderSize} /> <foreignObject x={foreignObjectX} y={foreignObjectY} width={bubbleWidth} height={bubbleHeight}> <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}> <div style={{ color: styleConfig.textColor, fontSize: `${fontSize}px`, fontWeight: '600', fontFamily: styleConfig.font, lineHeight: '1.4', textAlign: 'center' }}>{text}</div> </div> </foreignObject>
      </svg>
    );
  };

  return (
    <>
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: -10000, left: -10000 }}>
        <div
          ref={textRef}
          style={{
            // FIX: No padding here! This div should only reflect the raw text size.
            display: 'inline-block',
            fontSize: `${fontSize}px`,
            fontWeight: '600',
            fontFamily: styleConfig.font,
            lineHeight: '1.4',
            textAlign: 'center',
            maxWidth: `${maxWidth}px`,
          }}
        >
          {text}
        </div>
      </div>

      {/* The visible component */}
      <AbsoluteFill style={{ display: frame >= startFrame && frame <= endFrame ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, zIndex: 1000 }}>
          {renderBubble()}
        </div>
      </AbsoluteFill>
    </>
  );
};

// The SpeechBubbleOverlay component remains the same and correct.
interface SpeechBubbleOverlayProps {
  bubbles: SpeechBubbleData[];
}
export const SpeechBubbleOverlay: React.FC<SpeechBubbleOverlayProps> = ({ bubbles }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {bubbles.map((bubble, index) => (
        <React.Fragment key={`${bubble.text}-${index}`}>
          <SpeechBubble bubble={bubble} />
          <Sequence from={Math.floor((bubble.start + 0.05) * fps)} durationInFrames={Infinity}>
            <Audio src={staticFile(`assets/sfx/${bubble.audioFile || 'point_inc.mp3'}`)} volume={bubble.volume === undefined ? 0.7 : bubble.volume} playFrom={0} />
          </Sequence>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};