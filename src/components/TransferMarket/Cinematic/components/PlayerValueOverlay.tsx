import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Sequence, Audio, staticFile } from 'remotion';

interface PlayerValueData {
  name: string;
  market_value: string;
  age: number;
  position: string;
  club: string;
  nationalities: string[];
  start: number;
  duration: number;
  x: number;
  y: number;
  rank: number;
}

interface PlayerValueCardProps {
  player: PlayerValueData;
  frame: number;
  fps: number;
  flagMap?: Record<string, string>;
  bgColor?: string;
  accentColor?: string;
  textColor?: string;
}

const PlayerValueCard: React.FC<PlayerValueCardProps> = ({ 
  player, 
  frame, 
  fps, 
  flagMap = {},
  bgColor = 'rgba(0, 0, 0, 0.9)',
  accentColor = '#00ff88',
  textColor = 'white'
}) => {
  const startFrame = player.start * fps;
  const endFrame = startFrame + (player.duration * fps);

  // Check if this player should be visible
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const progress = (frame - startFrame) / (player.duration * fps);
  
  // Animation phases
  const fadeInDuration = 0.15; // 15% for entrance
  const flipStart = 0; // Start flip at 20%
  const flipEnd = 0.3; // End flip at 45%
  const fadeOutStart = 0.85; // Start fade out at 85%

  // Scale animation - starts small, grows to full size
  const scale = interpolate(
    progress,
    [0, fadeInDuration],
    [0.4, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.5))
    }
  );

  // Opacity animation
  const opacity = interpolate(
    progress,
    [0, fadeInDuration, fadeOutStart, 1],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Card flip animation
  const flipProgress = interpolate(
    progress,
    [flipStart, flipEnd],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic)
    }
  );

  const rotateY = interpolate(flipProgress, [0, 0.5, 1], [0, 90, 180]);
  const showBack = flipProgress > 0.5;

  // Particle/shine effects
  const particleOpacity = interpolate(
    progress,
    [flipStart, flipStart + 0.1, flipEnd - 0.1, flipEnd],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Get primary nationality and flag
  const primaryNationality = player.nationalities.length > 0 ? player.nationalities[0] : '';
  const flagUrl = flagMap[primaryNationality] || '';

  // Format rank with ordinal suffix
  const getRankString = (rank: number): string => {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `th`;
    }
    
    switch (lastDigit) {
      case 1: return `st`;
      case 2: return `nd`;
      case 3: return `rd`;
      default: return `th`;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: player.x,
        top: player.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
        perspective: '1000px',
      }}
    >
      {/* Particle effects */}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${20 + i * 15}%`,
            top: `${10 + (i % 3) * 30}%`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: accentColor,
            opacity: particleOpacity * (0.4 + Math.random() * 0.6),
            boxShadow: `0 0 8px ${accentColor}`,
            transform: `translateY(${interpolate(progress, [flipStart, flipEnd], [0, -20])}px)`,
          }}
        />
      ))}

      <div
        style={{
          width: '420px',
          height: '340px',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotateY}deg)`,
          transition: 'none',
        }}
      >
        {/* Front side - Rank */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor.replace('0.9', '0.95')} 100%)`,
            borderRadius: '20px',
            border: `2px solid ${accentColor}30`,
            backdropFilter: 'blur(10px)',
            boxShadow: `
              0 15px 50px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: '900',
              color: accentColor,
              fontFamily: 'Arial, sans-serif',
              textShadow: `0 0 20px ${accentColor}40`,
              marginBottom: '10px',
            }}
          >
            {player.rank} <sup className="-ml-4">{getRankString(player.rank)}</sup>
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: `${textColor}80`,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            RANK
          </div>
        </div>

        {/* Back side - Player details */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor.replace('0.9', '0.95')} 100%)`,
            borderRadius: '20px',
            border: `2px solid ${accentColor}40`,
            backdropFilter: 'blur(10px)',
            boxShadow: `
              0 15px 50px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `,
            overflow: 'hidden',
          }}
        >
          {/* Header section with rank and club */}
          <div
            style={{
              background: `linear-gradient(90deg, ${accentColor}20, transparent)`,
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${accentColor}30`,
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: '900',
                color: accentColor,
                fontFamily: 'Arial, sans-serif',
                textShadow: `0 0 10px ${accentColor}40`,
              }}
            >
              {player.rank} <sup className="-ml-1">{getRankString(player.rank)}</sup>
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {player.club}
            </div>
          </div>

          {/* Main content area */}
          <div style={{ padding: '20px' }}>
            {/* Player name and nationality */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'Arial, sans-serif',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                    lineHeight: '1.1',
                    marginBottom: '4px',
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {primaryNationality}
                </div>
              </div>

              {/* Flag */}
              <div style={{ marginTop: '4px' }}>
                {flagUrl && (
                  <img
                    src={flagUrl}
                    alt={primaryNationality}
                    style={{
                      height: '24px',
                      width: 'auto',
                      borderRadius: '3px',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                )}
                {!flagUrl && primaryNationality && (
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'Arial, sans-serif',
                      background: `${accentColor}20`,
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {primaryNationality.slice(0, 3).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Position and Age info cards */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}30`,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'Arial, sans-serif',
                    marginBottom: '2px',
                  }}
                >
                  Position
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {player.position}
                </div>
              </div>

              <div
                style={{
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}30`,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  minWidth: '60px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'Arial, sans-serif',
                    marginBottom: '2px',
                  }}
                >
                  Age
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {player.age}
                </div>
              </div>
            </div>

            {/* Market value - prominent display */}
            <div
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                border: `2px solid ${accentColor}50`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: 'Arial, sans-serif',
                  marginBottom: '4px',
                }}
              >
                Market Value
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  color: accentColor,
                  fontFamily: 'Arial, sans-serif',
                  textShadow: `0 0 20px ${accentColor}60`,
                  letterSpacing: '-1px',
                }}
              >
                {player.market_value}
              </div>
              
              {/* Value highlight glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '60%',
                  background: `radial-gradient(ellipse, ${accentColor}15, transparent)`,
                  borderRadius: '50%',
                  zIndex: -1,
                }}
              />
            </div>
          </div>

          {/* Decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '60px',
              height: '60px',
              background: `radial-gradient(circle, ${accentColor}20, transparent)`,
              borderRadius: '50%',
              transform: 'translate(30px, -30px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '40px',
              height: '40px',
              background: `radial-gradient(circle, ${accentColor}15, transparent)`,
              borderRadius: '50%',
              transform: 'translate(-20px, 20px)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface PlayerValueOverlayProps {
  players: PlayerValueData[];
  flagMap?: Record<string, string>;
  bgColor?: string;
  accentColor?: string;
  textColor?: string;
}

export const PlayerValueOverlay: React.FC<PlayerValueOverlayProps> = ({ 
  players,
  flagMap = {},
  bgColor = 'rgba(0, 0, 0, 0.9)',
  accentColor = '#00ff88',
  textColor = 'white'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {players.map((player, index) => (
          <PlayerValueCard
            key={`${player.name}-${index}`}
            player={player}
            frame={frame}
            fps={fps}
            flagMap={flagMap}
            bgColor={bgColor}
            accentColor={accentColor}
            textColor={textColor}
          />
        ))}
      </AbsoluteFill>
      
      {/* Audio sequences */}
      <>
        {players.map((player, index) => {
          const startFrame = Math.floor((player.start + 0.1) * fps);
          const durationInFrames = Math.ceil(player.duration * fps);

          return (
            <Sequence
              key={`${player.name}-audio-${index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <Audio src={staticFile('assets/sfx/point_inc.mp3')} volume={0.8} />
            </Sequence>
          );
        })}
      </>
    </>
  );
};