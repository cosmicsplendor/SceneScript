import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

interface TransferData {
  name: string;
  price: string;
  from: string;
  to: string;
  start: number;
  duration: number;
  x: number;
  y: number;
}

interface ClubSpending {
  clubName: string;
  totalSpent: number;
  logoSrc: string;
}

interface SpendingBarChartConfig {
  maxBarWidth: number;
  barHeight: number;
  maxClubs: number;
  barColor: string;
  backgroundColor: string;
  textColor: string;
  logoSize: number;
}

const defaultConfig: SpendingBarChartConfig = {
  maxBarWidth: 200,
  barHeight: 30,
  maxClubs: 5,
  barColor: '#00ff88',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  textColor: 'white',
  logoSize: 24,
};

interface SpendingBarChartProps {
  transfers: TransferData[];
  clubLogos: Record<string, string>; // clubName -> logoSrc mapping
  config?: Partial<SpendingBarChartConfig>;
}

// Helper function to parse price string to number
const parsePriceToNumber = (priceStr: string): number => {
  const numStr = priceStr.replace(/[$€£,M]/g, '');
  const num = parseFloat(numStr);
  if (priceStr.includes('M')) return num * 1000000;
  if (priceStr.includes('K')) return num * 1000;
  return num;
};

// Calculate spending up to a specific time
const calculateSpendingAtTime = (transfers: TransferData[], currentTimeSeconds: number): ClubSpending[] => {
  const spendingMap = new Map<string, number>();
  
  transfers.forEach(transfer => {
    if (transfer.start <= currentTimeSeconds) {
      const amount = parsePriceToNumber(transfer.price);
      const current = spendingMap.get(transfer.to) || 0;
      spendingMap.set(transfer.to, current + amount);
    }
  });
  
  return Array.from(spendingMap.entries())
    .map(([clubName, totalSpent]) => ({
      clubName,
      totalSpent,
      logoSrc: '', // Will be filled by parent component
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

// Calculate final spending for max values
const calculateFinalSpending = (transfers: TransferData[]): ClubSpending[] => {
  const spendingMap = new Map<string, number>();
  
  transfers.forEach(transfer => {
    const amount = parsePriceToNumber(transfer.price);
    const current = spendingMap.get(transfer.to) || 0;
    spendingMap.set(transfer.to, current + amount);
  });
  
  return Array.from(spendingMap.entries())
    .map(([clubName, totalSpent]) => ({
      clubName,
      totalSpent,
      logoSrc: '',
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

const formatSpending = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

export const SpendingBarChart: React.FC<SpendingBarChartProps> = ({ 
  transfers, 
  clubLogos, 
  config: userConfig = {} 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSeconds = frame / fps;
  
  const config = { ...defaultConfig, ...userConfig };
  const finalSpending = calculateFinalSpending(transfers);
  const maxSpending = finalSpending[0]?.totalSpent || 1;
  
  const currentSpending = calculateSpendingAtTime(transfers, currentTimeSeconds)
    .slice(0, config.maxClubs)
    .map(club => ({
      ...club,
      logoSrc: clubLogos[club.clubName] || '',
    }));

  if (currentSpending.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: config.backgroundColor,
          borderRadius: '16px',
          padding: '20px 24px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          minWidth: '400px',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              margin: '0',
              fontSize: '16px',
              fontWeight: '700',
              color: config.textColor,
              fontFamily: 'Arial, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Top Spending Clubs
          </h3>
        </div>

        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentSpending.map((club, index) => {
            const barWidth = (club.totalSpent / maxSpending) * config.maxBarWidth;
            const animatedWidth = interpolate(
              frame,
              [0, frame + 30], // Smooth animation over 30 frames
              [0, barWidth],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.quad),
              }
            );

            return (
              <div
                key={club.clubName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  height: `${config.barHeight}px`,
                }}
              >
                {/* Club Name */}
                <div
                  style={{
                    minWidth: '80px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: config.textColor,
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'right',
                  }}
                >
                  {club.clubName}
                </div>

                {/* Bar Container */}
                <div
                  style={{
                    position: 'relative',
                    width: `${config.maxBarWidth}px`,
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Animated Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${Math.max(0, animatedWidth)}px`,
                      background: `linear-gradient(90deg, ${config.barColor}, ${config.barColor}dd)`,
                      borderRadius: '4px',
                      boxShadow: `0 0 8px ${config.barColor}40`,
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                  
                  {/* Spending Amount */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: config.textColor,
                      fontFamily: 'Arial, sans-serif',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                      zIndex: 2,
                    }}
                  >
                    {formatSpending(club.totalSpent)}
                  </div>
                </div>

                {/* Club Logo */}
                <div
                  style={{
                    width: `${config.logoSize}px`,
                    height: `${config.logoSize}px`,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {club.logoSrc ? (
                    <img
                      src={club.logoSrc}
                      alt={club.clubName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: config.textColor,
                        fontFamily: 'Arial, sans-serif',
                      }}
                    >
                      {club.clubName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};