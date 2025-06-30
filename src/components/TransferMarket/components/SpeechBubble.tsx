import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Sequence, Audio, staticFile } from 'remotion';

interface SpeechBubbleData {
  text: string;
  start: number; // in seconds
  duration: number; // in seconds
  x: number; // absolute x position
  y: number; // absolute y position
  type?: 'cloud' | 'message' | 'thought'; // bubble type
  arrowDir?: 'up' | 'down' | 'left' | 'right'; // arrow direction
  style?: 'light' | 'dark' | 'colorful' | 'minimal'; // style mode
}

interface SpeechBubbleProps {
  bubble: SpeechBubbleData;
  frame: number;
  fps: number;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ bubble, frame, fps }) => {
  const startFrame = bubble.start * fps;
  const endFrame = startFrame + (bubble.duration * fps);

  // Check if this bubble should be visible
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const progress = (frame - startFrame) / (bubble.duration * fps);

  // Animation phases
  const fadeInDuration = 0.15;
  const fadeOutStart = 0.85;

  // Bounce animation for speech bubbles
  const scale = interpolate(
    progress,
    [0, fadeInDuration],
    [0.2, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.5))
    }
  );

  const opacity = interpolate(
    progress,
    [0, fadeInDuration, fadeOutStart, 1],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    }
  );

  // Subtle float animation
  const translateY = interpolate(
    progress,
    [0, 0.5, 1],
    [10, -2, 8],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.sin)
    }
  );

  const type = bubble.type || 'message';
  const arrowDir = bubble.arrowDir || 'down';
  const style = bubble.style || 'light';

  // Style configurations
  const getStyleConfig = () => {
    switch (style) {
      case 'dark':
        return {
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          shadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        };
      case 'colorful':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          shadow: '0 12px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)'
        };
      case 'minimal':
        return {
          background: 'rgba(255, 255, 255, 0.98)',
          textColor: '#333333',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        };
      default: // light
        return {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
          textColor: '#1f2937',
          borderColor: 'rgba(0, 0, 0, 0.15)',
          shadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        };
    }
  };

  const styleConfig = getStyleConfig();

  // Arrow positioning
  const getArrowStyles = () => {
    const arrowSize = 12;
    const offset = 20;

    switch (arrowDir) {
      case 'up':
        return {
          top: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid ${type === 'cloud' ? styleConfig.borderColor : styleConfig.background.includes('gradient') ? '#ffffff' : styleConfig.background}`,
        };
      case 'left':
        return {
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid ${type === 'cloud' ? styleConfig.borderColor : styleConfig.background.includes('gradient') ? '#ffffff' : styleConfig.background}`,
        };
      case 'right':
        return {
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid ${type === 'cloud' ? styleConfig.borderColor : styleConfig.background.includes('gradient') ? '#ffffff' : styleConfig.background}`,
        };
      default: // down
        return {
          bottom: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid ${type === 'cloud' ? styleConfig.borderColor : styleConfig.background.includes('gradient') ? '#ffffff' : styleConfig.background}`,
        };
    }
  };

  // Cloud path for SVG
  const getCloudPath = () => {
    return "M25,40 C15,40 10,30 15,25 C10,15 20,10 30,15 C35,5 50,5 55,15 C65,10 75,15 70,25 C80,30 75,40 65,40 Z";
  };

  const renderBubble = () => {
    if (type === 'cloud') {
      return (
        <div style={{ position: 'relative' }}>
          <svg
            width="200"
            height="80"
            viewBox="0 0 90 50"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            }}
          >
            <path
              d={getCloudPath()}
              fill={styleConfig.background}
              stroke={styleConfig.borderColor}
              strokeWidth="2"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: styleConfig.textColor,
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
              maxWidth: '140px',
              lineHeight: '1.3',
            }}
          >
            {bubble.text}
          </div>
        </div>
      );
    }

    if (type === 'thought') {
      return (
        <div style={{ position: 'relative' }}>
          {/* Main thought bubble */}
          <div
            style={{
              background: styleConfig.background,
              borderRadius: '50%',
              padding: '20px 25px',
              minWidth: '120px',
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${styleConfig.borderColor}`,
              boxShadow: styleConfig.shadow,
            }}
          >
            <div
              style={{
                color: styleConfig.textColor,
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                lineHeight: '1.3',
              }}
            >
              {bubble.text}
            </div>
          </div>
          
          {/* Small thought circles */}
          <div
            style={{
              position: 'absolute',
              bottom: -25,
              left: arrowDir === 'right' ? '80%' : '20%',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: styleConfig.background,
              border: `1px solid ${styleConfig.borderColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -35,
              left: arrowDir === 'right' ? '85%' : '15%',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: styleConfig.background,
              border: `1px solid ${styleConfig.borderColor}`,
            }}
          />
        </div>
      );
    }

    // Default message bubble
    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            background: styleConfig.background,
            borderRadius: '20px',
            padding: '16px 20px',
            minWidth: '80px',
            maxWidth: '250px',
            border: type === 'cloud' ? `2px solid ${styleConfig.borderColor}` : 'none',
            boxShadow: styleConfig.shadow,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              color: styleConfig.textColor,
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
              wordBreak: 'break-word',
            }}
          >
            {bubble.text}
          </div>
        </div>
        
        {/* Arrow */}
        <div
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            ...getArrowStyles(),
          }}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: bubble.x,
        top: bubble.y,
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {renderBubble()}
    </div>
  );
};

interface SpeechBubbleOverlayProps {
  bubbles: SpeechBubbleData[];
}

export const SpeechBubbleOverlay: React.FC<SpeechBubbleOverlayProps> = ({ bubbles }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {bubbles.map((bubble, index) => (
          <SpeechBubble
            key={`${bubble.text}-${index}`}
            bubble={bubble}
            frame={frame}
            fps={fps}
          />
        ))}
      </AbsoluteFill>
      <>
        {bubbles.map((bubble, index) => {
          const startFrame = Math.floor((bubble.start + 0.05) * fps);
          const durationInFrames = Math.ceil(bubble.duration * fps);

          return (
            <Sequence
              key={`${bubble.text}-${index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <Audio src={staticFile('assets/sfx/point_inc.mp3')} volume={0.7} />
            </Sequence>
          );
        })}
      </>
    </>
  );
};