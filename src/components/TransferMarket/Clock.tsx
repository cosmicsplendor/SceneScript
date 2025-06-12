
import React, { useRef } from "react";


interface ClockProps {
    x: number;
    y: number;
    frame: number;
    framesPerCycle: number;
    background?: string;
    rimColor?: string;
    fontSize?: string;
    scale?: number;
    animationMode?: 'realistic' | 'continuous';
}

const Clock: React.FC<ClockProps> = ({
    x,
    y,
    frame,
    framesPerCycle,
    background = "#999",
    rimColor = "whitesmoke",
    fontSize = "16px",
    scale = 0.2,
    animationMode = 'realistic'
}) => {
    let currentHrAngle = 0;
    let currentMinAngle = 0;

    if (animationMode === 'realistic') {
        // Realistic clock: Hour hand makes 1 full rotation per cycle, minute hand makes 12
        const progress = framesPerCycle > 0 ? (frame % framesPerCycle) / framesPerCycle : 0;
        currentHrAngle = progress * 360; // 1 full rotation
        currentMinAngle = progress * 360 * 12; // 12 full rotations

    } else if (animationMode === 'continuous') {
        // Continuous rotation: Both hands keep rotating without jumping back
        currentHrAngle = framesPerCycle > 0 ? (frame * 360 * 0.4) / framesPerCycle : 0;
        currentMinAngle = framesPerCycle > 0 ? (frame * 1440 * 0.4) / framesPerCycle : 0;

    }
    const containerStyle: React.CSSProperties = {
        transform: `scale(${scale})`,
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        fontSize: fontSize,
        width: '40em',
        height: '40em',
        borderRadius: '50%',
        background: rimColor,
        boxShadow: '0 0 8px 2px #aaa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const faceStyle: React.CSSProperties = {
        width: '85%',
        height: '85%',
        boxShadow: 'inset 0 0 20px #aaa',
        borderRadius: '50%',
        background: 'white',
    };

    const hourStyle: React.CSSProperties = {
        width: '10em',
        height: '2em',
        background: background,
        borderRadius: '1em',
        position: 'absolute',
        top: 'calc(50% - 1em)',
        left: '50%',
        transformOrigin: '0 1em',
        transform: `rotate(${currentHrAngle}deg)`,
    };

    const minuteStyle: React.CSSProperties = {
        width: '14em',
        height: '2em',
        background: background,
        borderRadius: '1em',
        position: 'absolute',
        top: 'calc(50% - 1em)',
        left: '50%',
        transformOrigin: '0 1em',
        transform: `rotate(${currentMinAngle}deg)`,
    };

    const hingeStyle: React.CSSProperties = {
        width: '4em',
        height: '4em',
        borderRadius: '50%',
        background: background,
        position: 'absolute',
        top: 'calc(50% - 2em)',
        left: 'calc(50% - 2em)',
    };

    return (
        <div style={containerStyle}>
            <div style={faceStyle}>
                <div style={hourStyle}></div>
                <div style={minuteStyle}></div>
                <div style={hingeStyle}></div>
            </div>
        </div>
    );
};

export default Clock;