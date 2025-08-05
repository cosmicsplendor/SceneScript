import {
    AbsoluteFill,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
    Img,
} from 'remotion';
import React from 'react';
import { z } from 'zod';
import { easingFns } from '../../../../../../lib/d3/utils/math';
import { FloatingShapesBackground } from './Backgrounds/FloatingShapeBg';

// -- Data and Configuration -- //

const teamNames = [
    "South America",
    "Europe"
];

const teamColorMap: Record<string, string> = {
    "South America": "purple",
    "Europe": "gold"
};

const trophyImage = staticFile('images/world_cup.png');

// Zod schema for validating props
export const mySchema = z.object({
    data: z.array(
        z.object({
            date: z.string(), // Date/week label
            data: z.array(
                z.object({
                    name: z.string(), // Team name
                    value: z.number(), // Accumulated number of Golden Boot wins for this team
                    player: z.string().optional(), // Last name of the player who won it this week (if they won)
                    emoji: z.string().optional(), // Optional emoji if no winner this week
                })
            ),
        })
    ),
});

// -- Animation Constants -- //
const SCORE_RIGHT_OFFSET = 24
const PADDING_TOP = 300;
const PADDING_LEFT = 80;
const SIDEBAR_WIDTH = 250;
const WEEK_WIDTH = 400;
const FRAMES_PER_WEEK = 120;
const BOTTOM_AREA_HEIGHT = 250;
const TROPHY_SIZE = 180;
const PLAYER_OVERLAY_SIZE = 150;
const SCORE_BOX_WIDTH = 200;
const SCORE_BOX_HEIGHT = 160;
const LANE_COLOR = "rgba(256, 256, 256, 0.4)"
const GRAPH_TOP_PADDING = 100
const GRAPH_BOTTOM_PADDING = 200
const IMG_RIGHT_OFFSET = 20;

// Easing function for pop effect
const elasticOut = (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
        ? 0
        : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// -- Helper Components -- //

const GoldenBootTrophy: React.FC<{ player?: string; emoji?: string }> = ({
    player,
    emoji,
}) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const springIn = spring({
        fps,
        frame,
        config: { stiffness: 100, damping: 10 },
        durationInFrames: 30,
    });

    // If no player and no emoji, don't render anything
    // if (!player && !emoji) {
    //     return null;
    // }

    // If there's an emoji but no player (no winner this week), show emoji
    if (emoji && !player) {
        return (
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
                    fontSize: TROPHY_SIZE * 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: "row",
                    justifyContent: 'center',
                    whiteSpace: 'nowrap'
                }}
            >
                {emoji}
            </div>
        );
    }

    // If there's a player, show trophy with player overlay
        return (
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translateX(-50%) translateY(-50%) scale(${springIn})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: TROPHY_SIZE,
                    height: TROPHY_SIZE,
                }}
            >
                {/* Trophy base */}
                <Img
                    src={trophyImage}
                    style={{
                        width: TROPHY_SIZE,
                        height: "auto",
                        position: 'absolute',
                        zIndex: 1
                    }}
                />

                {/* Player overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: '15%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: "auto",
                        height: PLAYER_OVERLAY_SIZE,
                        borderRadius: '50%',
                        zIndex: 2,
                    }}
                >
                    {/* <Img
                        src={staticFile(`player-images/${player}.png`)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    /> */}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        bottom: -100,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'white',
                        fontSize: 36,
                        fontWeight: 'bold',
                        textShadow: '2px 2px 8px rgba(0,0,0,1)',
                        zIndex: 0,
                        width: 250,
                        height: 180,
                        borderRadius: "10%",
                        "display": "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        fontFamily: "Bebas Nue",
                        background: "linear-gradient(to top, #26AFFE, #26AFFE, rgba(0, 0, 0, 0))"
                    }}
                >
                    <span style={{ wordBreak: "keep-all", textWrap: "nowrap", textTransform: "uppercase", fontSize: 60, letterSpacing: 3 }}>

                        {player}
                    </span>
                </div>
                {/* <div
                    style={{
                        position: 'absolute',
                        top: -100,
                        left: '45%',
                        transform: 'translateX(-50%)',
                        color: 'white',
                        fontSize: 36,
                        fontWeight: 'bold',
                        textShadow: '2px 2px 8px rgba(0,0,0,1)',
                        zIndex: 0,
                        width: 250,
                        height: 300,
                        borderRadius: "10%",
                        "display": "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        fontFamily: "Bebas Nue",
                        background: "linear-gradient(to bottom, #26AFFE, #26AFFE, rgba(0, 0, 0, 0))"
                    }}
                >
                      <span style={{  marginTop: 20, fontSize: 46, fontWeight: 'normal', wordBreak: "keep-all", textWrap: "nowrap", opacity: 0.85 }}>
                        ⚽<span style={{fontSize:56}}>×30</span>
                    </span>
                </div> */}
            </div>
        );

    return null
};

const ScoreBox: React.FC<{
    color: string;
    progress: number;
    score: number;
    scoreChangeFrame: number;
    hasScoreChanged: boolean;
}> = ({ color, progress, score, scoreChangeFrame, hasScoreChanged }) => {
    const frame = useCurrentFrame();

    // Gentler opening animation with longer duration
    const width = easingFns.sineInOut(progress) * SCORE_BOX_WIDTH

    // Initial number scale-up animation - starts when box is about 60% open
    const numberProgress = interpolate(
        progress,
        [0.6, 1],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const initialNumberScale = elasticOut(numberProgress);

    // Pop effect triggered by actual collision timing - only if score actually changed
    const framesSinceScoreChange = frame - scoreChangeFrame;
    const isRecentScoreChange = hasScoreChanged && framesSinceScoreChange >= 0 && framesSinceScoreChange < 40;
    const popScale = isRecentScoreChange
        ? 0.5 + 0.5 * elasticOut(Math.min(framesSinceScoreChange / 40, 1))
        : 1;

    // Combine both scales - initial opening and pop effects
    const textScale = initialNumberScale * popScale;

    return (
        <div
            style={{
                backgroundColor: color,
                width: width,
                overflow: "hidden",
                height: SCORE_BOX_HEIGHT,
                borderRadius: 0,
                transformOrigin: 'left',
                display: 'flex',
                position: "relative",
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `8px 5px 25px rgba(0,0,0,0.8)`,
            }}
        >
            <div
                style={{
                    transform: `scale(${textScale})`,
                    color: 'white',
                    fontSize: 150,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 8px rgba(0,0,0,1)',
                    transition: 'none',
                    position: "absolute",
                    top: -15,
                    right: SCORE_RIGHT_OFFSET
                }}
            >
                {score}
            </div>
        </div>
    );
};

// -- Main Video Component -- //

export const GoldenBootRace: React.FC<z.infer<typeof mySchema>> = ({ data }) => {
    const { fps, width, height } = useVideoConfig();
    const frame = useCurrentFrame();
    const numTeams = teamNames.length;

    const durationInFrames = (data.length + 2) * FRAMES_PER_WEEK;

    const graphMovement = interpolate(
        frame,
        [0, durationInFrames],
        [width, width - (data.length + 1) * WEEK_WIDTH]
    );

    const graphAreaHeight = height - PADDING_TOP - BOTTOM_AREA_HEIGHT;
    const teamLaneHeight = (graphAreaHeight - GRAPH_BOTTOM_PADDING) / numTeams;

    // Process data to find when teams actually win new Golden Boots
    const processedData = data.map((weekData, weekIndex) => ({
        ...weekData,
        data: weekData.data.map((teamData) => {
            const prevWeekValue =
                weekIndex > 0
                    ? data[weekIndex - 1].data.find((t) => t.name === teamData.name)?.value ?? 0
                    : 0;
            const hasNewTrophy = teamData.value > prevWeekValue;
            return {
                ...teamData,
                hasNewTrophy,
                newTrophies: teamData.value - prevWeekValue,
            };
        }),
    }));

    return (
        <AbsoluteFill style={{
            backgroundImage: `radial-gradient(ellipse at top left, rgba(30, 58, 138, 0.4), transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.3), transparent 60%),
          linear-gradient(to right, #1E3A8A, #3B82F6)`
        }}>
            {/* --- Clipped Graph Area with different background --- */}
            {/* <FloatingShapesBackground /> */}
            {/* <FloatingShapesBackground /> */}
            <AbsoluteFill
                style={{
                    left: SIDEBAR_WIDTH + PADDING_LEFT,
                    top: PADDING_TOP,
                    width: width - (SIDEBAR_WIDTH + PADDING_LEFT),
                    height: graphAreaHeight,
                    overflow: 'hidden',
                    // background: "#00A8FF"
                }}
            >
                {/* Container for all moving elements */}
                <div
                    style={{
                        position: 'absolute',
                        left: graphMovement - (SIDEBAR_WIDTH + PADDING_LEFT),
                        top: 0,
                        height: '100%',
                    }}
                >
                    {processedData.map((week, i) => (
                        <div
                            key={week.date}
                            style={{
                                position: 'absolute',
                                left: i * WEEK_WIDTH,
                                height: '100%',
                                width: WEEK_WIDTH,
                            }}
                        >
                            {/* Bold vertical line */}
                            {
                                // week.data.find(team => team.name === teamNames[1])?.hasNewTrophy &&
                                <div style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: 85,
                                    // left: `calc('50%' + ${WEEK_WIDTH * 0.5}px)`,
                                    width: 10,
                                    height: '100%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    // "border": "2px dashed rgba(0, 0, 0, 0.5)",
                                    transform: 'translateX(-50%)',
                                    zIndex: 2,
                                }} />
                            }

                            {/* Week Label */}
                            <div style={{
                                position: 'absolute',
                                top: -10,
                                width: '100%',
                                textAlign: 'center',
                                color: 'white',
                                fontSize: 80,
                                fontWeight: 'bold',
                                textShadow: '0 4px 10px rgba(2, 8, 95, 0.8)',
                                fontFamily: 'Bebas Nue',
                            }}>
                                {week.date}
                            </div>

                            {/* Golden Boot Trophies */}
                            {week.data.map((team) => {
                                const teamIndex = teamNames.indexOf(team.name);
                                if (teamIndex === -1) return null;
                                const laneTop = teamIndex * teamLaneHeight + GRAPH_TOP_PADDING;

                                // Only show trophy if this team won a new Golden Boot this week
                                const teamWeekData = processedData[i].data.find(t => t.name === team.name);
                                const shouldShowTrophy = teamWeekData?.hasNewTrophy || team.emoji;

                                if (!shouldShowTrophy) return null;

                                return (
                                    <div
                                        key={team.name}
                                        style={{
                                            position: 'absolute',
                                            top: laneTop,
                                            height: teamLaneHeight,
                                            width: '100%',
                                            zIndex: 4
                                        }}
                                    >
                                        <GoldenBootTrophy player={team.player} emoji={team.emoji} />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </AbsoluteFill>

            {/* --- UI Overlay (Axes, Title, Team Logos, Score Boxes) --- */}
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        position: 'absolute',
                        top: PADDING_TOP - 140,
                        left: PADDING_LEFT,
                        padding: "12px 70px",
                        border: '5px solid white',
                        borderRadius: 10,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        height: 120,
                        fontSize: 62,
                        fontWeight: 800,
                        textShadow: '0 4px 10px rgba(2, 8, 95, 0.75)',
                        boxShadow: '0 4px 10px rgba(2, 8, 95, 0.5)',
                        fontFamily: 'montserrat',
                        letterSpacing: 4
                    }}
                >
                    <span>WORLD CUP</span>
                </div>

                {/* Y-axis and X-axis */}
                <div style={{
                    position: 'absolute',
                    left: SIDEBAR_WIDTH + PADDING_LEFT,
                    top: PADDING_TOP,
                    bottom: BOTTOM_AREA_HEIGHT - 4,
                    width: 12,
                    backgroundColor: 'white',
                    zIndex: 5
                }} />
                <div style={{
                    position: 'absolute',
                    left: SIDEBAR_WIDTH + PADDING_LEFT,
                    top: height - BOTTOM_AREA_HEIGHT,
                    right: 0,
                    height: 12,
                    backgroundColor: 'white',
                    zIndex: 5
                }} />

                {teamNames.map((teamName, i) => {
                    const laneTop = PADDING_TOP + GRAPH_TOP_PADDING + i * teamLaneHeight;
                    const teamImageSize = teamLaneHeight * 0.925;

                    let currentScore = 0;
                    let firstTrophyWeek = -1;
                    let lastScoreChangeFrame = -1;
                    let hasActualScoreChange = false;

                    // Calculate current accumulated score and find animation timing
                    const scoreBoxLeft = SIDEBAR_WIDTH + PADDING_LEFT + 8;
                    const collisionThreshold = scoreBoxLeft + 60;

                    for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
                        const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;

                        if (weekXPosition <= collisionThreshold) {
                            const weekScore = data[weekIdx].data.find(t => t.name === teamName)?.value ?? 0;
                            currentScore = Math.max(currentScore, weekScore);
                        }

                        if (firstTrophyWeek === -1 && (data[weekIdx].data.find(t => t.name === teamName)?.value ?? 0) > 0) {
                            firstTrophyWeek = weekIdx;
                        }
                    }

                    // Find recent score changes for pop animation
                    let previousScore = 0;
                    for (let weekIdx = 0; weekIdx < data.length; weekIdx++) {
                        const weekXPosition = graphMovement + weekIdx * WEEK_WIDTH;

                        if (weekXPosition <= collisionThreshold && weekXPosition >= collisionThreshold - 30) {
                            const weekScore = data[weekIdx].data.find(t => t.name === teamName)?.value ?? 0;
                            const teamWeekData = processedData[weekIdx].data.find(t => t.name === teamName);
                            const newTrophiesThisWeek = teamWeekData?.newTrophies ?? 0;

                            if (weekScore > previousScore && newTrophiesThisWeek > 0) {
                                const ballCenterX = weekXPosition;
                                const frameOffsetBasedOn60 =
                                    ((collisionThreshold - ballCenterX) / WEEK_WIDTH) * 60;
                                lastScoreChangeFrame = frame - frameOffsetBasedOn60;
                                hasActualScoreChange = true;
                            }
                            previousScore = Math.max(previousScore, weekScore);
                        }
                    }

                    const firstTrophyWeekXPos = graphMovement + firstTrophyWeek * WEEK_WIDTH;

                    const scoreboxProgress = interpolate(
                        firstTrophyWeekXPos,
                        [scoreBoxLeft - 100, scoreBoxLeft + 140],
                        [1, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    return (
                        <div key={teamName} style={{
                            position: 'absolute',
                            top: laneTop,
                            left: 0,
                            width: '100%',
                            height: teamLaneHeight
                        }}>
                            {/* Dotted lane line */}
                            <div style={{
                                position: 'absolute',
                                left: SIDEBAR_WIDTH + PADDING_LEFT,
                                top: '50%',
                                width: width,
                                borderTop: `12px dashed ${LANE_COLOR}`,
                                zIndex: 1
                            }} />

                            {/* Team logo */}

                            <Img
                                src={staticFile(`country-images/${teamName}.png`)}
                                style={{
                                    position: 'absolute',
                                    left: PADDING_LEFT - IMG_RIGHT_OFFSET,
                                    top: '50%',
                                    transform: 'translate(-30%, -50%) scale(0.55)',
                                    height: "auto",
                                    width: teamImageSize,
                                    filter: 'drop-shadow(0 0 12px #000000aa)',
                                }}
                            />

                            {/* Score box */}
                            <div style={{
                                position: 'absolute',
                                left: SIDEBAR_WIDTH + PADDING_LEFT + 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 5
                            }}>
                                {firstTrophyWeek !== -1 && (
                                    <ScoreBox
                                        color={teamColorMap[teamName]}
                                        progress={scoreboxProgress}
                                        score={currentScore}
                                        scoreChangeFrame={lastScoreChangeFrame}
                                        hasScoreChanged={hasActualScoreChange}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};