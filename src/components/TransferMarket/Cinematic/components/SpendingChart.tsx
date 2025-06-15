import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

// --- DATA INTERFACES ---
interface TransferData {
  name: string;
  price: string;
  from: string;
  to: string;
  start: number; // Start time in seconds
  duration: number; // Duration of the animation in seconds
  x: number;
  y: number;
}

interface ClubSpending {
  clubName: string;
  totalSpent: number;
  logoSrc: string;
}

// --- CONFIGURATION ---
interface SpendingBarChartConfig {
  maxBarWidth: number;
  barHeight: number;
  maxClubs: number;
  barColor: string;
  backgroundColor: string;
  textColor: string;
}

const defaultConfig: SpendingBarChartConfig = {
  maxBarWidth: 200,
  barHeight: 30,
  maxClubs: 5,
  barColor: '#00ff88',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  textColor: 'white',
};

// --- HELPER FUNCTIONS ---
const parsePriceToNumber = (priceStr: string): number => {
  const numStr = priceStr.replace(/[$€£,M]/g, '');
  const num = parseFloat(numStr);
  if (priceStr.includes('M')) return num * 1000000;
  if (priceStr.includes('K')) return num * 1000;
  return num;
};

// **REVISED**: Calculates spending with smooth interpolation during transfers
const calculateSpendingAtTime = (
  transfers: TransferData[],
  currentTimeSeconds: number
): ClubSpending[] => {
  const spendingMap = new Map<string, number>();

  transfers.forEach((transfer) => {
    const transferEndSeconds = transfer.start + transfer.duration;
    const fullAmount = parsePriceToNumber(transfer.price);
    let spendingContribution = 0;

    if (currentTimeSeconds >= transferEndSeconds) {
      // If the transfer animation is complete, add the full amount
      spendingContribution = fullAmount;
    } else if (currentTimeSeconds > transfer.start) {
      // If we are currently inside the transfer's animation window, interpolate the value
      spendingContribution = interpolate(
        currentTimeSeconds,
        [transfer.start, transferEndSeconds],
        [0, fullAmount],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.ease), // Makes the transition smooth
        }
      );
    }

    if (spendingContribution > 0) {
      const currentTotal = spendingMap.get(transfer.to) || 0;
      spendingMap.set(transfer.to, currentTotal + spendingContribution);
    }
  });

  // Calculate totals for clubs that haven't received a transfer yet but might have in the past
  // This ensures clubs don't disappear from the map if their current contribution is 0
  transfers.forEach((transfer) => {
    if (!spendingMap.has(transfer.to)) {
      spendingMap.set(transfer.to, 0);
    }
  });
  
  return Array.from(spendingMap.entries())
    .map(([clubName, totalSpent]) => ({
      clubName,
      totalSpent,
      logoSrc: '', // Will be filled later
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

const formatSpending = (amount: number): string => {
  const roundedAmount = Math.round(amount);
  if (roundedAmount >= 1000000) {
    return `$${(roundedAmount / 1000000).toFixed(0)}M`;
  }
  if (roundedAmount >= 1000) {
    return `$${(roundedAmount / 1000).toFixed(0)}K`;
  }
  return `$${roundedAmount}`;
};

// --- INDIVIDUAL BAR COMPONENT (SIMPLIFIED) ---
interface SpendingBarProps {
  clubName: string;
  logoSrc: string;
  totalSpent: number;
  animatedWidth: number; // Receives the already-animated width
  maxBarWidth: number;
  barHeight: number;
  barColor: string;
  textColor: string;
}

const SpendingBar: React.FC<SpendingBarProps> = ({
  clubName,
  logoSrc,
  totalSpent,
  animatedWidth,
  maxBarWidth,
  barHeight,
  barColor,
  textColor,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: `${barHeight}px`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{minWidth: '80px', fontSize: '14px', fontWeight: '600', color: textColor, textAlign: 'right',}}>
        {clubName}
      </div>

      <div style={{position: 'relative', width: `${maxBarWidth}px`, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden',}}>
        {/* The width is now set directly, no transition or spring needed here */}
        <div style={{height: '100%', width: `${animatedWidth}px`, background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`, borderRadius: '4px', boxShadow: `0 0 8px ${barColor}40`,}}/>
        <div style={{position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: '600', color: textColor, textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)', zIndex: 2,}}>
          {formatSpending(totalSpent)}
        </div>
      </div>
      
      {/* Logo without container */}
      {logoSrc ? (
        <img src={logoSrc} alt={clubName} style={{ height: `${barHeight}px`, width: 'auto', borderRadius: '50%', objectFit: 'contain'}}/>
      ) : (
        <div style={{ height: `${barHeight}px`, width: `${barHeight}px`, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: textColor,}}>
          {clubName.charAt(0)}
        </div>
      )}
    </div>
  );
};

// --- MAIN CHART COMPONENT ---
interface SpendingBarChartProps {
  transfers: TransferData[];
  clubLogos: Record<string, string>;
  config?: Partial<SpendingBarChartConfig>;
}

export const SpendingBarChart: React.FC<SpendingBarChartProps> = ({
  transfers,
  clubLogos,
  config: userConfig = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSeconds = frame / fps;

  const config = { ...defaultConfig, ...userConfig };

  // Calculate the maximum possible spending at the end of the video
  const maxSpending = React.useMemo(() => {
    const spendingMap = new Map<string, number>();
    transfers.forEach(transfer => {
      const amount = parsePriceToNumber(transfer.price);
      const current = spendingMap.get(transfer.to) || 0;
      spendingMap.set(transfer.to, current + amount);
    });
    return Math.max(...Array.from(spendingMap.values()), 1);
  }, [transfers]);

  const currentSpending = React.useMemo(
    () =>
      calculateSpendingAtTime(transfers, currentTimeSeconds)
        .slice(0, config.maxClubs)
        .map((club) => ({
          ...club,
          logoSrc: clubLogos[club.clubName] || '',
        })),
    [transfers, currentTimeSeconds, config.maxClubs, clubLogos]
  );

  if (currentSpending.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', background: config.backgroundColor, borderRadius: '16px', padding: '20px 24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', minWidth: '400px',}}>
        <div style={{textAlign: 'center', marginBottom: '16px',}}>
          <h3 style={{margin: '0', fontSize: '16px', fontWeight: '700', color: config.textColor, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px',}}>
            Top Spending Clubs
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentSpending.map((club) => {
            // The width is now smoothly interpolated by the calculation function
            const animatedWidth = (club.totalSpent / maxSpending) * config.maxBarWidth;

            return (
              <SpendingBar
                key={club.clubName}
                clubName={club.clubName}
                logoSrc={club.logoSrc}
                totalSpent={club.totalSpent}
                animatedWidth={animatedWidth} // Pass the calculated width
                maxBarWidth={config.maxBarWidth}
                barHeight={config.barHeight}
                barColor={config.barColor}
                textColor={config.textColor}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};