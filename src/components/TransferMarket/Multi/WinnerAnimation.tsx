import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Team } from ".";
import { useEffect } from "react";

const WinnerAnimation: React.FC<{
  winner: Team;
  teams: Team[];
  finalTallies: { [teamName: string]: number };
  onComplete: () => void;
  frame: number;
  startFrame: number;
  prefix?: string;
  suffix?: string;
}> = ({ winner, teams, finalTallies, onComplete, frame, startFrame, prefix="", suffix="" }) => {
  const animationFrame = frame - startFrame;
  const { fps } = useVideoConfig();
  
  // --- All animations are unchanged ---
  const logoScale = spring({
    frame: animationFrame,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
  });

  const tallyProgress = interpolate(
    animationFrame,
    [0, fps * 2],
    [0, 1],
    { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' }
  );
  
  const scoreFloatProgress = interpolate(
    animationFrame,
    [fps * 2, fps * 3],
    [0, 1],
    { easing: Easing.out(Easing.cubic) }
  );

  const DURATION_BEFORE_FADE = fps * 3;
  const TOTAL_DURATION = fps * 3.5;

  const winTextOpacity = interpolate(
    animationFrame,
    [fps * 1.8, fps * 2.2, DURATION_BEFORE_FADE, TOTAL_DURATION],
    [0, 1, 1, 0],
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const logoGroupY = interpolate(
    animationFrame,
    [fps * 1.8, fps * 2.2, DURATION_BEFORE_FADE, TOTAL_DURATION],
    [0, -60, -60, 0],
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  useEffect(() => {
    if (animationFrame > TOTAL_DURATION) {
      onComplete();
    }
  }, [animationFrame, onComplete, TOTAL_DURATION]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 100,
          alignItems: 'flex-start', // Use flex-start to prevent vertical jumps
          marginBottom: 50,
          transform: `translateY(${logoGroupY}px)`,
        }}
      >
        {teams.map((team) => {
          const isWinner = team.name === winner.name;
          const currentTally = Math.floor(
            finalTallies[team.name] * tallyProgress
          );

          return (
            <div
              key={team.name}
              style={{
                // --- THE DEFINITIVE FIX ---
                // 1. Create a rigid column that CANNOT resize. This stops all animation shifting.
                width: 120, 
                // 2. Use Flexbox to robustly center all items vertically.
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // --- END FIX ---
                
                // Animations
                transform: isWinner ? `scale(${logoScale})` : 'scale(1)',
                opacity: isWinner ? 1 : 0.6,
              }}
            >
              <img
                src={team.logo}
                style={{
                  width: 80,
                  height: 80,
                  marginBottom: 20,
                  filter: isWinner ? 'drop-shadow(0 0 20px gold)' : 'none',
                }}
                alt={team.short}
              />
              <div style={{ fontSize: 48, fontWeight: 'bold', color: 'white', marginBottom: 10 }}>
                {team.short}
              </div>
              <div style={{
                  fontSize: 36,
                  color: isWinner ? 'gold' : 'white',
                  fontWeight: 'bold',
                  // Keeps numbers themselves from "wobbling" as they change
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {prefix}{currentTally}{suffix}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: 'gold',
          textAlign: 'center',
          opacity: winTextOpacity,
        }}
      >
        🏆 {winner.short} WINS! 🏆
      </div>

      {scoreFloatProgress > 0 && (
        <div
          style={{
            position: 'absolute',
            fontSize: 64,
            fontWeight: 'bold',
            color: 'gold',
            transform: `translate(-50%, ${-scoreFloatProgress * 200}px)`,
            opacity: 1 - scoreFloatProgress,
            left: '50%',
            top: '50%',
          }}
        >
          +1
        </div>
      )}
    </div>
  );
};

export default WinnerAnimation;