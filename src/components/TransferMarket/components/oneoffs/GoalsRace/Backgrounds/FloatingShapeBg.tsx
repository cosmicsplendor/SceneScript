import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import React, { useMemo } from 'react';
import { z } from 'zod';

// --- Step 1: Make every property in the schema optional ---
// This tells Remotion Studio and TypeScript that these props are not required.
// The .default() values are used by the Remotion Studio UI.
export const floatingShapesSchema = z.object({
    numberOfShapes: z.number().min(1).optional().default(50),
    shapeSize: z.number().min(1).optional().default(120),
    shapeColors: z
        .array(z.string())
        .optional()
        .default(['#a2d2ff', '#bde0fe', '#ffafcc', '#ffc8dd', '#cdb4db']),
    loopDurationInFrames: z.number().min(1).optional().default(300),
});

// The inferred type now correctly shows all properties as optional
type FloatingShapesProps = z.infer<typeof floatingShapesSchema>;

// A single floating shape component (no changes needed here)
const FloatingShape: React.FC<{
    /* ... (props are the same as before) ... */
    frame: number;
    width: number;
    height: number;
    size: number;
    color: string;
    startX: number;
    offset: number;
    loopDuration: number;
    id: number;
}> = ({ frame, width, height, size, color, startX, offset, loopDuration, id }) => {
    const effectiveFrame = (frame + offset) % loopDuration;
    const yPos = interpolate(
        effectiveFrame,
        [0, loopDuration],
        [height + size, -size]
    );
    const xPos = startX + Math.sin((frame + offset) / 50 + id) * 50;

    return (
        <div
            style={{
                position: 'absolute',
                left: xPos,
                top: yPos,
                height: size,
                width: size,
                backgroundColor: color,
                borderRadius: '50%',
                filter: 'blur(30px)',
                opacity: 0.25,
            }}
        />
    );
};

// The main background component
export const FloatingShapesBackground: React.FC<FloatingShapesProps> = ({
    // --- Step 2: Provide default values directly in the function signature ---
    // This ensures the component works even if no props object is passed at all.
    // These values are used if a prop is `undefined`.
    numberOfShapes = 50,
    shapeSize = 120,
    shapeColors = ['#a2d2ff', '#bde0fe', '#0bb4e7ff', '#f5f5f5ff', '#ffcbcdff'],
    loopDurationInFrames = 1000,
}) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // The rest of the component logic remains exactly the same!
    // It's now guaranteed to receive valid values for all variables.
    const shapes = useMemo(() => {
        return Array.from({ length: numberOfShapes }).map((_, i) => {
            const pseudoRandom = (seed: number) => {
                let x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
            };
            const size = shapeSize * (0.4 + pseudoRandom(i + 1) * 0.6);
            const color = shapeColors[i % shapeColors.length];
            const startX = pseudoRandom(i + 2) * width;
            const offset = pseudoRandom(i + 3) * loopDurationInFrames;

            return { id: i, size, color, startX, offset };
        });
    }, [loopDurationInFrames, numberOfShapes, shapeColors, shapeSize, width]);

    return (
        <AbsoluteFill style={{
            backgroundImage: `
        radial-gradient(ellipse at top left, rgba(0, 122, 255, 0.4), transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(0, 225, 255, 0.3), transparent 60%),
        linear-gradient(to right, #007BFF, #00AFFF)
      `
        }}>
            {shapes.map((shape) => (
                <FloatingShape
                    key={shape.id}
                    id={shape.id}
                    frame={frame}
                    width={width}
                    height={height}
                    size={shape.size}
                    color={shape.color}
                    startX={shape.startX}
                    offset={shape.offset}
                    loopDuration={loopDurationInFrames}
                />
            ))}
        </AbsoluteFill>
    );
};