import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

const PremierLeagueTitle = ({ 
  startFrame = 60, 
  duration = 180, 
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
  
  // Scale animation for pop-in effect
  const scale = interpolate(
    frame,
    [startFrame, startFrame + 10, fadeInEnd],
    [0.8, 1.05, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.68, -0.55, 0.265, 1.55)
    }
  );
  
  // Y-position animation for subtle entrance
  const translateY = interpolate(
    frame,
    [startFrame, fadeInEnd],
    [20, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94)
    }
  );
  
  // Don't render if completely transparent
  if (opacity === 0) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '55%',
        right: '23%',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: 10,
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        color: '#ffffff',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
        maxWidth: '420px',
        lineHeight: 1.1,
      }}
    >
      {/* Main title */}
      <div
        style={{
          fontSize: '48px',
          letterSpacing: '-0.02em',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Transfer Market
      </div>
      
      {/* Subtitle with accent */}
      <div
        style={{
          fontSize: '32px',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.6)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8))',
          }}
        >
          MOST
        </span>
        <span
          style={{
            color: '#ffffff',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8))',
          }}
        >
          Expensive Players
        </span>
      </div>
      
      {/* Decorative line */}
      <div
        style={{
          width: '90px',
          height: '4px',
          background: 'linear-gradient(90deg, #38bdf8, #06b6d4)',
          borderRadius: '2px',
          marginTop: '16px',
          opacity: interpolate(
            frame,
            [startFrame + 15, startFrame + 45],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          ),
        }}
      />
      
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-25px',
          left: '-25px',
          right: '-25px',
          bottom: '-25px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          zIndex: -1,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          opacity: interpolate(
            frame,
            [startFrame + 10, startFrame + 40],
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

export default PremierLeagueTitle;