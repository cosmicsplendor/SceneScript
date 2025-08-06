import React from 'react';
import type { ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';

// Scale constant - adjust this to uniformly scale the entire component
const SCALE = 1.2; // Change this value to scale everything (0.5 = half size, 2 = double size)

// This CSS object defines the main container that holds our animation.
// It uses flexbox to perfectly center its contents.
const containerStyle: React.CSSProperties = {
  position: 'absolute',
  right: '6%', // Adjusted positioning for this larger element
  top: '.6%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100
};

// This style is for the container that holds both the spinning circle
// and the number, ensuring the number can be centered on top.
const circleContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: `${120 * SCALE}px`, // The dimension of our circle
  height: `${120 * SCALE}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// This style is for the number in the center. It uses absolute
// positioning to sit perfectly in the middle of the parent container.
const numberStyle: React.CSSProperties = {
  position: 'absolute',
  fontFamily: 'Futura Bold, sans-serif',
  fontSize: `${3 * SCALE}rem`, // 5xl is roughly 3rem
  fontWeight: '600',
  color: '#E5E5E5', // text-neutral-200
  // Prevents the number from being selected by the user
  userSelect: 'none',
};

// This style is for the "MATCHDAY" text below the circle.
const textStyle: React.CSSProperties = {
  fontFamily: 'Segoe UI, sans-serif',
  fontSize: `${2.25 * SCALE}rem`, // 4xl is roughly 2.25rem
  fontWeight: '600',
  color: '#F5F5F5', // text-neutral-100
  marginTop: `${1 * SCALE}rem`,
  paddingBottom: `${0.5 * SCALE}rem`,
  textTransform: 'uppercase', // Makes it look more official
  letterSpacing: '0.1em',
};

const DisplayVariant2: React.FC<{ children: ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  
  // Controls the speed of the rotation. A higher multiplier means a faster spin.
  const rotation = frame * 0.5;

  // The spinner's style creates a gradient circle using conic-gradient
  const spinnerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    // Create a conic gradient that goes from transparent to white and back to transparent in a full circle
    background: `conic-gradient(from 0deg, transparent 0deg, white 90deg, transparent 180deg, transparent 360deg)`,
    // Use a mask to create the ring shape
    mask: `radial-gradient(circle, transparent ${60 * SCALE - 10 * SCALE}px, black ${60 * SCALE}px, black ${60 * SCALE + 10 * SCALE}px, transparent ${60 * SCALE + 10 * SCALE + 1}px)`,
    WebkitMask: `radial-gradient(circle, transparent ${60 * SCALE - 10 * SCALE}px, black ${60 * SCALE}px, black ${60 * SCALE + 10 * SCALE}px, transparent ${60 * SCALE + 10 * SCALE + 1}px)`,
    // The rotation is applied here, synced to the video frame.
    transform: `rotate(${rotation}deg)`,
  };

  return (
    <div style={containerStyle} id="date">
      <div style={circleContainerStyle}>
        {/* This is the visual spinner element that rotates */}
        <div style={spinnerStyle} />
        {/* This is the number, which stays static in the center */}
        <div style={numberStyle}>{children}</div>
      </div>
      {/* The text label below the animation */}
      {/* <div style={textStyle}>Matchday</div> */}
    </div>
  );
};

export default DisplayVariant2;