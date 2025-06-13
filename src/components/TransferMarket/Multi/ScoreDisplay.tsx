import { Team } from "./index"
const ScoreDisplay: React.FC<{
    teams: Team[];
    scoresRef: React.MutableRefObject<{ [teamName: string]: number }>;
}> = ({ teams, scoresRef }) => {
    const scores = scoresRef.current;
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
                zIndex: 1000
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
                {scores[teams[0].name.toLowerCase()] || 0} - {scores[teams[1].name.toLowerCase()] || 0}
            </div>

            {/* Team 2: Renders as [Text] [Logo] due to row-reverse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
                {/* The source order is now the same as Team 1: logo, then text */}
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

export default ScoreDisplay