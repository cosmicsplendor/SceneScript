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

// --- INDIVIDUAL BAR COMPONENT (REVISED) ---
interface SpendingBarProps {
  clubName: string;
  logoSrc: string;
  totalSpent: number;
  animatedWidth: number;
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
  // Allocate space for the logo as requested (1.5 * bar height)
  const logoContainerWidth = barHeight * 1.5;
  // Pre-allocate a fixed width for club names to ensure bars align
  const labelWidth = 100;

  return (
    // Use a grid to perfectly align each part of the bar chart row
    <div
      style={{
        display: 'grid',
        // [Label] [Bar] [Logo]
        gridTemplateColumns: `${labelWidth}px ${maxBarWidth}px ${logoContainerWidth}px`,
        alignItems: 'center',
        gap: '12px',
        marginBottom: "12px",
        height: `${barHeight}px`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* --- Column 1: Club Name --- */}
      <div
        style={{
          fontSize: '24px',
          fontWeight: '600',
          color: textColor,
          // Right-align text within the fixed-width container
          textAlign: 'right',
          // Prevent long names from wrapping and breaking the layout
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: "1em"
        }}
      >
        {clubName}
      </div>

      {/* --- Column 2: Bar and Spending Amount --- */}
      <div
        style={{
          position: 'relative',
          width: '100%', // Fill the grid cell defined by maxBarWidth
          height: '100%',
          // Use a dark background for the unfilled part, as in the image
          backgroundColor: '#1A1A1A',
          borderRadius: '4px',
        }}
      >
        {/* The animated green bar */}
        <div
          style={{
            height: '100%',
            width: `${animatedWidth}px`,
            // Use a flat color to match the reference image
            backgroundColor: barColor,
            borderRadius: '4px',
          }}
        />
        {/* Spending amount text, positioned relative to the whole bar */}
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '22px',
            fontWeight: '600',
            color: textColor,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
            zIndex: 2,
          }}
        >
          {formatSpending(totalSpent)}
        </div>
      </div>

      {/* --- Column 3: Club Logo --- */}
      <div
        style={{
          width: '100%', // Fills the grid cell
          height: '100%',
          display: 'flex',
          // Align logo to the start of its container, right next to the bar
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingLeft: "1em"
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={clubName}
            style={{
              // Set height, and let width be auto to maintain aspect ratio
              height: `${barHeight + 4}px`, // Slightly larger than bar for visibility
              width: 'auto',
              objectFit: 'contain',
              // Don't force it into a circle
            }}
          />
        ) : (
          // Fallback for when there's no logo
          <div
            style={{
              height: `${barHeight}px`,
              width: `${barHeight}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: textColor,
            }}
          >
            {clubName.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN CHART COMPONENT ---
interface SpendingBarChartProps {
  transfers: TransferData[];
  clubLogos: Record<string, string>;
  config?: Partial<SpendingBarChartConfig>;
  nameMap?: Record<string, string>;
}

export const SpendingBarChart: React.FC<SpendingBarChartProps> = ({
  transfers,
  clubLogos,
  config: userConfig = {},
  nameMap = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSeconds = frame / fps;

  const config = { ...defaultConfig, ...userConfig };

  // Calculate the maximum possible spending at the end of the video
  const maxSpending = React.useMemo(() => {
    const spendingMap = new Map<string, number>();
    transfers.forEach((transfer) => {
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
      <div
        style={{
          position: 'absolute',
          top: '100px',
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
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h3
            style={{
              margin: '0',
              fontSize: '28px',
              fontWeight: '700',
              color: config.textColor,
              fontFamily: 'Arial, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Spending Battle
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentSpending.map((club) => {
            // The width is now smoothly interpolated by the calculation function
            const animatedWidth =
              (club.totalSpent / maxSpending) * config.maxBarWidth;

            return (
              <SpendingBar
                key={club.clubName}
                clubName={nameMap[club.clubName] ?? club.clubName}
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