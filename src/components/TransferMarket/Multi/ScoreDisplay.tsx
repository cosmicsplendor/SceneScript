import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { Team } from "./index"

const ScoreDisplay: React.FC<{
    teams: Team[];
    scores: { [teamName: string]: number };
    expandAt: number; // Frame at which expansion starts
}> = ({ teams, scores, expandAt }) => {
    const frame = useCurrentFrame();
    
    // Animation duration in frames (adjust as needed)
    const animationDuration = 60;
    
    // Calculate if we should be expanding
    const shouldExpand = frame >= expandAt;
    
    // Interpolate scale (1 to 4)
    const scale = shouldExpand 
        ? interpolate(
            frame,
            [expandAt, expandAt + animationDuration],
            [1, 4],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic)
            }
        )
        : 1;
    
    // Simple approach: translate to center and account for scale
    // This moves the element to center regardless of its original position
    const translateX = shouldExpand
        ? interpolate(
            frame,
            [expandAt, expandAt + animationDuration],
            [0, 40], // Move towards center
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic)
            }
        )
        : 0;
        
    const translateY = shouldExpand
        ? interpolate(
            frame,
            [expandAt, expandAt + animationDuration],
            [0, 20], // Move towards center
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic)
            }
        )
        : 0;

    return (
        <div
            style={{
                position: 'absolute',
                top: 20,
                left: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '10px 20px',
                borderRadius: 8,
                zIndex: 1000,
                transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                transformOrigin: 'top left', // Scale from the original position
                transition: 'none' // Disable CSS transitions to rely on Remotion interpolation
            }}
        >
            {/* Team 1: Renders as [Logo] [Text] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                    src={teams[0].logo}
                    style={{ width: 32, height: 32, marginTop: -2 }}
                    alt={teams[0].short}
                />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                    {teams[0].short}
                </span>
            </div>

            {/* Score */}
            <div style={{
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
                {scores[teams[1].name.toLowerCase()] || 0} - {scores[teams[0].name.toLowerCase()] || 0}
            </div>

            {/* Team 2: Renders as [Text] [Logo] due to row-reverse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
                <img
                    src={teams[1].logo}
                    style={{ width: 32, height: 32, marginTop: -5 }}
                    alt={teams[1].short}
                />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                    {teams[1].short}
                </span>
            </div>
        </div>
    );
};

export default ScoreDisplay;