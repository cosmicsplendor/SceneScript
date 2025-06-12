import React, { useRef } from "react"; // Removed useEffect as logic is now direct calculation

// Removed D3 imports
// import { select } from "d3";
// Removed D3 types
// type Pos = Record<"x" | "y", number>;
// export type Clock = ...;
// Removed ClockGenerator import

// Keeping the fixed ID for the container div as per your original structure
const CLOCK_ID = "SVGX";

interface ClockProps {
    x: number; // Position x (pixels)
    y: number; // Position y (pixels)
    lifespan: number; // Basis for calculation of max angle
    cycleDuration: number; // Basis for calculation of max angle
    frame: number; // The current frame from Remotion
    framesPerCycle: number; // The number of frames for one complete animation cycle

    // Props to control the styles previously set by D3 methods
    background?: string; // Color of clock hands and hinge (defaults to #999)
    rimColor?: string; // Color of the clock face rim (defaults to whitesmoke)
    fontSize?: string; // Font size for the container (affects 'em' units, defaults derived from D3 generator)
    scale?: number; // Scale factor for the entire clock (defaults to 0.2)
}

const Clock: React.FC<ClockProps> = ({
    x,
    y,
    lifespan,
    cycleDuration,
    frame,
    framesPerCycle,
    background = "#999", // Default from original D3 generator
    rimColor = "whitesmoke", // Default from original D3 generator
    fontSize = "16px", // Explicit default (D3 used context, 16px is common base)
    scale = 0.2 // Default from original D3 generator
}) => {
    // Ref for the container div (still useful for potential external access, though not used for D3 anymore)
    const clockContainerRef = useRef<HTMLDivElement | null>(null);

    // --- Calculation of Hand Angles based on Remotion Frame ---

    // Calculate the target values for the clock hands based on the original D3 logic call
    // clock(lifespan/cycleDuration * 360 * 0.4, (lifespan/cycleDuration) * 1440 * 0.4)
    // These are the angles the hands should reach after a 'lifespan' duration based on 'cycleDuration'
    const targetHrAngle = (lifespan / cycleDuration) * 360 * 0.4;
    const targetMinAngle = (lifespan / cycleDuration) * 1440 * 0.4;

    // Calculate the progress within the current animation cycle (from 0 to < 1)
    // If framesPerCycle is 0 or less, progress is undefined/invalid, handle this.
    const progress = framesPerCycle > 0 ? (frame % framesPerCycle) / framesPerCycle : 0;

    // Calculate the current angle for each hand based on the progress
    const currentHrAngle = progress * targetHrAngle;
    const currentMinAngle = progress * targetMinAngle;

    // --- Styles derived from the original D3 Generator's logic ---

    // Container styles (derived from container.attr("style", ...))
    const containerStyle: React.CSSProperties = {
        transform: `scale(${scale})`,
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        fontSize: fontSize, // Using the prop
        width: '40em',
        height: '40em',
        borderRadius: '50%',
        background: rimColor, // Using the prop
        boxShadow: '0 0 8px 2px #aaa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
        // No 'transition' property here!
    };

    // Face styles (derived from face.attr("style", ...))
    const faceStyle: React.CSSProperties = {
        width: '85%',
        height: '85%',
        boxShadow: 'inset 0 0 20px #aaa',
        borderRadius: '50%',
        background: 'white', // Fixed in D3 generator
        // No 'transition' property here!
    };

    // Hour hand styles (derived from hour.attr("style", ...))
    const hourStyle: React.CSSProperties = {
        width: '10em',
        height: '2em',
        background: background, // Using the prop
        borderRadius: '1em',
        position: 'absolute',
        top: 'calc(50% - 1em)',
        left: '50%',
        transformOrigin: '0 1em',
        // Setting rotation directly based on calculated angle for the current frame
        transform: `rotate(${currentHrAngle}deg)`,
        // Crucially, NO CSS TRANSITION here
    };

    // Minute hand styles (derived from minute.attr("style", ...))
    const minuteStyle: React.CSSProperties = {
        width: '14em',
        height: '2em',
        background: background, // Using the prop
        borderRadius: '1em',
        position: 'absolute',
        top: 'calc(50% - 1em)',
        left: '50%',
        transformOrigin: '0 1em',
        // Setting rotation directly based on calculated angle for the current frame
        transform: `rotate(${currentMinAngle}deg)`,
        // Crucially, NO CSS TRANSITION here
    };

    // Hinge styles (derived from hinge.attr("style", ...))
    const hingeStyle: React.CSSProperties = {
        width: '4em',
        height: '4em',
        borderRadius: '50%',
        background: background, // Using the prop
        position: 'absolute',
        top: 'calc(50% - 2em)',
        left: 'calc(50% - 2em)',
        // No 'transition' property here!
    };


    // --- Render the nested divs with calculated/derived styles ---

    return (
        <div id={CLOCK_ID} ref={clockContainerRef} style={containerStyle}>
            <div style={faceStyle}>
                <div style={hourStyle}></div>
                <div style={minuteStyle}></div>
                <div style={hingeStyle}></div>
            </div>
        </div>
    );
};

export default Clock;