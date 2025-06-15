import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

interface TransferData {
  name: string;
  price: string;
  from: string; // club player is coming from
  to: string; // club player is going to
  start: number; // in seconds
  duration: number; // in seconds
  x: number; // absolute x position
  y: number; // absolute y position
}

interface TransferCardProps {
  transfer: TransferData;
  frame: number;
  fps: number;
}

const TransferCard: React.FC<TransferCardProps> = ({ transfer, frame, fps }) => {
  const startFrame = transfer.start * fps;
  const endFrame = startFrame + (transfer.duration * fps);
  
  // Check if this transfer should be visible
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const progress = (frame - startFrame) / (transfer.duration * fps);
  
  // Animation phases
  const fadeInDuration = 0.2; // 20% of duration for fade in
  const fadeOutStart = 0.8; // Start fade out at 80% of duration
  
  // Scale animation - starts small, grows to full size
  const scale = interpolate(
    progress,
    [0, fadeInDuration],
    [0.3, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.2))
    }
  );

  // Opacity animation - fade in and out
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

  // Subtle slide up animation
  const translateY = interpolate(
    progress,
    [0, fadeInDuration],
    [20, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad)
    }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: transfer.x,
        top: transfer.y,
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.95) 100%)',
          borderRadius: '16px',
          padding: '20px 24px',
          minWidth: '280px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Header with transfer icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.4)',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            TRANSFER
          </span>
        </div>

        {/* Player name */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px',
            fontFamily: 'Arial, sans-serif',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
          }}
        >
          {transfer.name}
        </div>

        {/* Transfer direction with arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {transfer.from}
          </div>
          
          {/* Arrow with animation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '2px',
                background: 'linear-gradient(90deg, #00ff88, #ffffff)',
                borderRadius: '1px',
              }}
            />
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '8px solid #00ff88',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.4))',
              }}
            />
          </div>
          
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {transfer.to}
          </div>
        </div>

        {/* Price */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#00ff88',
            fontFamily: 'Arial, sans-serif',
            textShadow: '0 0 12px rgba(0, 255, 136, 0.4)',
          }}
        >
          {transfer.price}
        </div>

        {/* Subtle glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            borderRadius: '16px',
            background: 'linear-gradient(45deg, transparent, rgba(0, 255, 136, 0.05), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

interface TransferOverlayProps {
  transfers: TransferData[];
}

export const TransferOverlay: React.FC<TransferOverlayProps> = ({ transfers }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {transfers.map((transfer, index) => (
        <TransferCard
          key={`${transfer.name}-${index}`}
          transfer={transfer}
          frame={frame}
          fps={fps}
        />
      ))}
    </AbsoluteFill>
  );
};