import React, { useState, useRef, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Sequence, Audio, staticFile } from 'remotion';
import { raceSceneObjectRegistry } from './Race/persistent';

// --- Interfaces (no changes) ---
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
  audio?: string;
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
  
  // NEW: State to hold the calculated position
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
    fontSize = 42,
    fontFamily = 'Segoe UI, sans-serif',
    maxWidth = 280,
  } = bubble;

  // 1. Measure the text dimensions (this part was already correct)
  useLayoutEffect(() => {
    if (textRef.current) {
        const newWidth = textRef.current.offsetWidth;
        const newHeight = textRef.current.offsetHeight;

        if (!dimensions || newWidth !== dimensions.width || newHeight !== dimensions.height) {
            setDimensions({
                width: newWidth,
                height: newHeight,
            });
        }
    }
  }, [text, fontSize, fontFamily, maxWidth, dimensions]);

  // --- THE MAIN FIX ---
  // 2. Calculate the position AFTER we know the dimensions.
  useLayoutEffect(() => {
    // For 'thought' bubbles, we still use the simpler centering logic.
    if (type === 'thought') {
        if (target && raceSceneObjectRegistry.players.has(target)) {
            const transform = raceSceneObjectRegistry.players.get(target)!;
            setPosition({
                x: transform.pos.x + transform.width / 2 + offsetX,
                y: transform.pos.y - 40 + offsetY // Position above the target's head
            });
        } else if (staticX !== undefined && staticY !== undefined) {
            setPosition({ x: staticX + offsetX, y: staticY + offsetY });
        }
        return;
    }

    // For 'message' bubbles with arrows:
    if (!dimensions) return; // Wait for dimensions

    const paddingX = 40;
    const paddingY = 32;
    const finalContentWidth = dimensions.width + paddingX;
    const finalContentHeight = dimensions.height + paddingY;
    
    // Pass arrowDir to get the correct final SVG size
    const { viewBoxWidth, viewBoxHeight } = getSvgPathAndDimensions(finalContentWidth, finalContentHeight, arrowDir);

    let newX = 0;
    let newY = 0;

    if (target && raceSceneObjectRegistry.players.has(target)) {
      const transform = raceSceneObjectRegistry.players.get(target)!;
      const gap = 12; // Gap between target and bubble

      // --- This is the robust positioning logic ---
      switch (arrowDir) {
        case 'up':
          newX = transform.pos.x + transform.width / 2 - viewBoxWidth / 2;
          newY = transform.pos.y + transform.height + gap;
          break;
        case 'left':
          newX = transform.pos.x + transform.width + gap;
          newY = transform.pos.y + transform.height / 2 - viewBoxHeight / 2;
          break;
        case 'right':
          newX = transform.pos.x - viewBoxWidth - gap;
          newY = transform.pos.y + transform.height / 2 - viewBoxHeight / 2;
          break;
        case 'down':
        default:
          newX = transform.pos.x + transform.width / 2 - viewBoxWidth / 2;
          newY = transform.pos.y - viewBoxHeight - gap;
          break;
      }
      setPosition({ x: newX + offsetX, y: newY + offsetY });
    } else if (staticX !== undefined && staticY !== undefined) {
      // Fallback to static positioning if no target
      setPosition({ x: staticX + offsetX, y: staticY + offsetY });
    }
  }, [dimensions, target, staticX, staticY, arrowDir, offsetX, offsetY, type]);


  // --- Animations & Style ---
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

  // NEW: Set transform-origin based on arrow direction for correct scaling animation
  let transformOrigin = '50% 100%'; // Default for 'down'
  if (type === 'message') {
    if (arrowDir === 'up') transformOrigin = '50% 0%';
    if (arrowDir === 'left') transformOrigin = '0% 50%';
    if (arrowDir === 'right') transformOrigin = '100% 50%';
  } else {
    transformOrigin = '50% 50%'; // Thought bubbles can scale from center
  }

  // Pass arrowDir to this function! This was also missing.
  const getSvgPathAndDimensions = (bubbleWidth: number, bubbleHeight: number, arrowDir: 'up' | 'down' | 'left' | 'right') => {
    const radius = 20; const arrowHeight = 16; const arrowWidth = 28; const halfBorder = borderSize / 2; let path = '', viewBoxWidth = bubbleWidth, viewBoxHeight = bubbleHeight, foreignObjectX = 0, foreignObjectY = 0; switch (arrowDir) { case 'up': viewBoxHeight = bubbleHeight + arrowHeight; foreignObjectY = arrowHeight; path = `M${halfBorder},${arrowHeight + radius} A${radius},${radius} 0 0 1 ${radius},${arrowHeight + halfBorder} L${bubbleWidth / 2 - arrowWidth / 2},${arrowHeight + halfBorder} L${bubbleWidth / 2},${halfBorder} L${bubbleWidth / 2 + arrowWidth / 2},${arrowHeight + halfBorder} L${bubbleWidth - radius},${arrowHeight + halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${arrowHeight + radius} L${bubbleWidth - halfBorder},${bubbleHeight + arrowHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight + arrowHeight - halfBorder} L${radius},${bubbleHeight + arrowHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight + arrowHeight - radius} Z`; break; case 'left': viewBoxWidth = bubbleWidth + arrowHeight; foreignObjectX = arrowHeight; path = `M${arrowHeight + halfBorder},${radius} A${radius},${radius} 0 0 1 ${arrowHeight + radius},${halfBorder} L${arrowHeight + bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${arrowHeight + bubbleWidth - halfBorder},${radius} L${arrowHeight + bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${arrowHeight + bubbleWidth - radius},${bubbleHeight - halfBorder} L${arrowHeight + radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${arrowHeight + halfBorder},${bubbleHeight - radius} L${arrowHeight + halfBorder},${bubbleHeight / 2 + arrowWidth / 2} L${halfBorder},${bubbleHeight / 2} L${arrowHeight + halfBorder},${bubbleHeight / 2 - arrowWidth / 2} Z`; break; case 'right': viewBoxWidth = bubbleWidth + arrowHeight; path = `M${halfBorder},${radius} A${radius},${radius} 0 0 1 ${radius},${halfBorder} L${bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${radius} L${bubbleWidth - halfBorder},${bubbleHeight / 2 - arrowWidth / 2} L${bubbleWidth + arrowHeight - halfBorder},${bubbleHeight / 2} L${bubbleWidth - halfBorder},${bubbleHeight / 2 + arrowWidth / 2} L${bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight - halfBorder} L${radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight - radius} Z`; break; default: viewBoxHeight = bubbleHeight + arrowHeight; path = `M${halfBorder},${radius} A${radius},${radius} 0 0 1 ${radius},${halfBorder} L${bubbleWidth - radius},${halfBorder} A${radius},${radius} 0 0 1 ${bubbleWidth - halfBorder},${radius} L${bubbleWidth - halfBorder},${bubbleHeight - radius} A${radius},${radius} 0 0 1 ${bubbleWidth - radius},${bubbleHeight - halfBorder} L${bubbleWidth / 2 + arrowWidth / 2},${bubbleHeight - halfBorder} L${bubbleWidth / 2},${bubbleHeight + arrowHeight - halfBorder} L${bubbleWidth / 2 - arrowWidth / 2},${bubbleHeight - halfBorder} L${radius},${bubbleHeight - halfBorder} A${radius},${radius} 0 0 1 ${halfBorder},${bubbleHeight - radius} Z`; break; } return { path, viewBoxWidth, viewBoxHeight, foreignObjectX, foreignObjectY, bubbleWidth, bubbleHeight };
  };

  const renderBubble = () => {
    // Thought bubble logic is fine
    if (type === 'thought') {
      return (
        <div style={{ position: 'relative' }}>
          <div style={{ background: styleConfig.background, border: `${isComic ? 2 : 1}px solid ${styleConfig.borderColor}`, boxShadow: styleConfig.shadow, padding: '25px 30px', textAlign: 'left', borderRadius: '63% 37% 54% 46% / 55% 48% 52% 45%' }}>
            <div style={{ color: styleConfig.textColor, fontSize: `${fontSize}px`, fontWeight: '600', fontFamily: styleConfig.font, lineHeight: '1.3', wordBreak: 'break-word', maxWidth: `${maxWidth}px` }}>
              {text}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: -25, left: '20%', width: '18px', height: '18px', borderRadius: '50%', background: styleConfig.background, border: `${isComic ? 2 : 1}px solid ${styleConfig.borderColor}` }} />
          <div style={{ position: 'absolute', bottom: -40, left: '15%', width: '12px', height: '12px', borderRadius: '50%', background: styleConfig.background, border: `${isComic ? 2 : 1}px solid ${styleConfig.borderColor}` }} />
        </div>
      );
    }
    
    if (!dimensions) return null;

    const paddingX = 40;
    const paddingY = 32;
    const finalWidth = dimensions.width + paddingX;
    const finalHeight = dimensions.height + paddingY;
    
    // IMPORTANT: Pass arrowDir here!
    const { path, viewBoxWidth, viewBoxHeight, foreignObjectX, foreignObjectY, bubbleWidth, bubbleHeight } = getSvgPathAndDimensions(finalWidth, finalHeight, arrowDir);

    return (
      <svg width={viewBoxWidth} height={viewBoxHeight} viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={{ filter: styleConfig.shadow }}>
        <defs> <linearGradient id="colorful-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#667eea' }} /><stop offset="100%" style={{ stopColor: '#764ba2' }} /></linearGradient> </defs> <path d={path} fill={style === 'colorful' ? 'url(#colorful-gradient)' : styleConfig.background} stroke={styleConfig.borderColor} strokeWidth={borderSize} />
        <foreignObject x={foreignObjectX} y={foreignObjectY} width={bubbleWidth} height={bubbleHeight}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
            <div style={{ color: styleConfig.textColor, fontSize: `${fontSize}px`, fontWeight: '600', fontFamily: styleConfig.font, lineHeight: '1.4', textAlign: 'left', maxWidth: `${maxWidth}px`}}>
              {text}
            </div>
          </div>
        </foreignObject>
      </svg>
    );
  };

  return (
    <>
      {/* Measurement component (no changes) */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: -10000, left: -10000 }}>
        <div ref={textRef} style={{ display: 'inline-block', fontSize: `${fontSize}px`, fontWeight: '600', fontFamily: styleConfig.font, lineHeight: '1.4', textAlign: 'left', maxWidth: `${maxWidth}px`, }}>
          {text}
        </div>
      </div>

      {/* The visible component (UPDATED) */}
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          // REMOVED AbsoluteFill wrapper and translate(-50%, -50%)
          // ADDED transformOrigin for correct scaling
          transform: `scale(${scale})`,
          transformOrigin: transformOrigin,
          opacity,
          zIndex: 1000,
          display: frame >= startFrame && frame <= endFrame ? 'block' : 'none',
        }}
      >
        {renderBubble()}
      </div>
    </>
  );
};

// --- Overlay Component (no changes needed) ---
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
            <Audio src={staticFile(`assets/sfx/${bubble.audio || 'point_inc.mp3'}`)} volume={bubble.volume === undefined ? 0.7 : bubble.volume} playFrom={0} />
          </Sequence>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};