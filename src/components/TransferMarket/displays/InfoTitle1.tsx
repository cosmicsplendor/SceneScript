import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

const InfoTitle1 = ({ 
  startFrame = 30, 
  duration = 210, 
  fadeInDuration = 30, 
  fadeOutDuration = 30 
}) => {
  const frame = useCurrentFrame();
  
  // Calculate animation phases
  const fadeInEnd = startFrame + fadeInDuration;
  const holdStart = fadeInEnd;
  const holdEnd = startFrame + duration - fadeOutDuration;
  const fadeOutEnd = startFrame + duration;
  
  // Opacity animation
  const opacity = interpolate(
    frame,
    [startFrame, fadeInEnd, holdEnd, fadeOutEnd],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94)
    }
  );
  
  // Scale animation for elegant entrance
  const scale = interpolate(
    frame,
    [startFrame, startFrame + 8, fadeInEnd],
    [0.9, 1.02, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1)
    }
  );
  
  // Y-position animation for smooth slide
  const translateY = interpolate(
    frame,
    [startFrame, fadeInEnd],
    [30, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94)
    }
  );
  
  // Trophy icon rotation for subtle animation
  const trophyRotation = interpolate(
    frame,
    [startFrame + 20, startFrame + 50],
    [0, 360],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.68, -0.55, 0.265, 1.55)
    }
  );
  
  // Don't render if completely transparent
  if (opacity === 0) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '7%',
        left: '8%',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: 'top right',
        zIndex: 10,
        fontFamily: '"Playfair Display", "Georgia", serif',
        color: '#ffffff',
        textShadow: '0 3px 12px rgba(0, 0, 0, 0.7)',
        maxWidth: '380px',
        lineHeight: 1.2,
        textAlign: 'right',
      }}
    >
      {/* Trophy icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '12px',
          transform: `rotate(${trophyRotation}deg)`,
          opacity: interpolate(
            frame,
            [startFrame + 15, startFrame + 35],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          ),
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            position: 'relative',
            filter: 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.4)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '22px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '20px',
              height: '8px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              borderRadius: '0 0 4px 4px',
            }}
          />
        </div>
      </div>
      
      {/* Main title */}
      <div
        style={{
          fontSize: '44px',
          fontWeight: '700',
          letterSpacing: '-0.01em',
          marginBottom: '6px',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5)) drop-shadow(0 3px 12px rgba(0, 0, 0, 0.8))',
        }}
      >
        Trophies Won
      </div>
      
      {/* Subtitle */}
      <div
        style={{
          fontSize: '28px',
          fontWeight: '400',
          letterSpacing: '0.02em',
          fontStyle: 'italic',
          color: '#e5e7eb',
          filter: 'drop-shadow(0 0 12px rgba(229, 231, 235, 0.4)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8))',
        }}
      >
        since 1992
      </div>
      
      {/* Decorative flourish */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: '16px',
          gap: '8px',
          opacity: interpolate(
            frame,
            [startFrame + 20, startFrame + 50],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          ),
        }}
      >
        <div
          style={{
            width: '40px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #fbbf24)',
            borderRadius: '1px',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            borderRadius: '50%',
            filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))',
          }}
        />
        <div
          style={{
            width: '20px',
            height: '2px',
            background: 'linear-gradient(90deg, #fbbf24, transparent)',
            borderRadius: '1px',
          }}
        />
      </div>
      
      {/* Elegant background card */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '-30px',
          right: '-20px',
          bottom: '-20px',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.85) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          backdropFilter: 'blur(12px)',
          zIndex: -1,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(251, 191, 36, 0.1)',
          opacity: interpolate(
            frame,
            [startFrame + 8, startFrame + 38],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          ),
        }}
      />
      
      {/* Subtle corner accent */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
          borderRadius: '12px 12px 0 0',
          zIndex: -1,
          opacity: interpolate(
            frame,
            [startFrame + 25, startFrame + 55],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          ),
        }}
      />
    </div>
  );
};

export default InfoTitle1;