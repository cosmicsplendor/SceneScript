import { useRef } from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const MetricTitle: React.FC<{
    metric: string;
    opacity?: number;
    // New prop: The number of frames each character takes to appear.
    framesPerCharacter?: number;
}> = ({
    metric,
    opacity = 1,
    // A lower number means faster typing. Default is 2 frames per character.
    framesPerCharacter = 3,
}) => {
        const frame = useCurrentFrame();
        const startFrameRef = useRef<number | null>(null);

        if (startFrameRef.current === null) {
            startFrameRef.current = frame;
        }

        const elapsedFrames = frame - (startFrameRef.current || 0);

        // --- KEY CHANGE ---
        // The total duration is now calculated dynamically based on the text length
        // and the desired speed per character.
        const totalDuration = metric.length * framesPerCharacter;

        // Interpolate now uses the dynamic totalDuration.
        // This ensures the animation speed remains constant per character.
        const charsToShow = interpolate(
            elapsedFrames,
            [0, totalDuration], // The animation timeline now scales with text length
            [0, metric.length], // The output is still the number of characters
            {
                extrapolateRight: 'clamp',
            }
        );

        const textToShow = metric.slice(0, Math.floor(charsToShow));

        const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

        return (
            <div
                style={{
                    position: 'absolute',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 36,
                    fontFamily: FONT_FAMILY,
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    opacity,
                    textShadow: '0px 2px 6px rgba(0, 0, 0, 0.7)',
                    zIndex: 100,
                }}
            >
                {textToShow}
            </div>
        );
    };

export default MetricTitle