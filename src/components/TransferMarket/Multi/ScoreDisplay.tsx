// ScoreDisplay.tsx

import { useCurrentFrame, interpolate, Easing, Sequence } from 'remotion';
// Import our NEW all-in-one celebration component
import { Celebration } from './Confetti';
import { Team } from "./index";

const ScoreDisplay: React.FC<{
    teams: Team[];
    scores: { [teamName: string]: number };
    expandAt: number;
}> = ({ teams, scores, expandAt }) => {
    const frame = useCurrentFrame();
    const animationDuration = 30;
    const shouldExpand = frame >= expandAt;

    // Decide how long the celebration should be visible
    const showCelebration = frame >= expandAt && frame < expandAt + 150; // 5 seconds

    // ... No changes to your score display animation logic ...
    const scale = shouldExpand ? interpolate(frame, [expandAt, expandAt + animationDuration], [1, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 1;
    const translateX = shouldExpand ? interpolate(frame, [expandAt, expandAt + animationDuration], [0, 40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 0;
    const translateY = shouldExpand ? interpolate(frame, [expandAt, expandAt + animationDuration], [0, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 0;

    return (
        <>
            {/* Conditionally render our single, standalone celebration component */}
            <Sequence from={expandAt} durationInFrames={150} style={{ zIndex: 9999 }}>
                <Celebration />
            </Sequence>


            {/* Your score display component remains the same */}
            <div
                style={{
                    position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 15,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: '10px 20px', borderRadius: 8, zIndex: 1000,
                    transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`, transformOrigin: 'top left',
                    transition: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={teams[0].logo} style={{ width: 32, height: 32 }} alt={teams[0].short} />
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{teams[0].short}</span>
                </div>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    {scores[teams[1].name.toLowerCase()] || 0} - {scores[teams[0].name.toLowerCase()] || 0}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
                    <img src={teams[1].logo} style={{ width: 32, height: 32 }} alt={teams[1].short} />
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{teams[1].short}</span>
                </div>
            </div>
        </>
    );
}

export default ScoreDisplay;