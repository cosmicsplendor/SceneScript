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
}> = ({ winner, teams, finalTallies, onComplete, frame, startFrame }) => {
  const animationFrame = frame - startFrame;
  const { fps } = useVideoConfig();
  // --- All original animations are preserved ---
  const logoScale = spring({
    frame: animationFrame,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
  });

  const tallyProgress = interpolate(
  animationFrame,
  [0, fps * 2], // Animate over the first 2 seconds
  [0, 1],       // From 0% to 100% of the final score
  {
    easing: Easing.out(Easing.quad),
    // This is the critical fix:
    // After 2 seconds, CLAMP the progress at 1. Do not let it change.
    extrapolateRight: 'clamp',
  }
);
  const scoreFloatProgress = interpolate(
    animationFrame,
    [fps * 2, fps * 3],
    [0, 1],
    { easing: Easing.out(Easing.cubic) }
  );

  // The original animation was 3.5 seconds long. We'll work within that.
  const DURATION_BEFORE_FADE = fps * 3;
  const TOTAL_DURATION = fps * 3.5;

  // Animate the "WINS!" text opacity.
  const winTextOpacity = interpolate(
    animationFrame,
    [fps * 1.8, fps * 2.2, DURATION_BEFORE_FADE, TOTAL_DURATION],
    [0, 1, 1, 0],
    {
      easing: Easing.inOut(Easing.cubic),
      // --- THIS IS THE FIX ---
      // This tells Remotion: "Before the animation starts, clamp the opacity to the first value (0)".
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  // Animate the vertical position of the logo group.
  const logoGroupY = interpolate(
    animationFrame,
    [fps * 1.8, fps * 2.2, DURATION_BEFORE_FADE, TOTAL_DURATION],
    [0, -60, -60, 0],
    {
      easing: Easing.inOut(Easing.cubic),
      // --- THIS IS THE FIX ---
      // This tells Remotion: "Before the animation starts, clamp the Y position to the first value (0)".
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Your original useEffect for onComplete is preserved.
  useEffect(() => {
    if (animationFrame > TOTAL_DURATION) {
      onComplete();
    }
  }, [animationFrame, onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          alignItems: 'center',
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
                textAlign: 'center',
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
              <div style={{ fontSize: 36, color: isWinner ? 'gold' : 'white', fontWeight: 'bold' }}>
                {currentTally}
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

export default WinnerAnimation