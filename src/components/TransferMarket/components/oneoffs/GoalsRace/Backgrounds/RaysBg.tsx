import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { z } from 'zod';

// Zod schema updated for Remotion-native animation control
export const raysSchema = z.object({
	rayCount: z.number().min(0).default(15),
	rayColor: z.string().default('rgba(255, 255, 255, 0.25)'),
	rayWidth: z.number().min(0.1).default(4),
	rayBlur: z.number().min(0).default(50),
	// New Prop: How many frames it takes for a ray to complete one full rotation
	loopDurationInFrames: z.number().min(1).default(300), // 10 seconds at 30fps
});

type RaysBackgroundProps = z.infer<typeof raysSchema>;

// A single ray component. It now takes `frame` as a prop to drive its animation.
const Ray: React.FC<{
	frame: number;
	color: string;
	width: number;
	loopDurationInFrames: number;
	delayInFrames: number;
	rotationOffset: number;
}> = ({
	frame,
	color,
	width,
	loopDurationInFrames,
	delayInFrames,
	rotationOffset,
}) => {
		// --- THE REMOTION-NATIVE ANIMATION LOGIC ---
		// 1. Create a seamless loop using the modulo operator.
		// The `delayInFrames` offsets each ray's animation cycle.
		const effectiveFrame = (frame + delayInFrames) % loopDurationInFrames;

		// 2. Map the current frame in the loop to a rotation value from 0 to 360 degrees.
		const rotation = interpolate(
			effectiveFrame,
			[0, loopDurationInFrames],
			[0, 360]
		);

		const rayStyle: React.CSSProperties = {
			// The gradient is static...
			background: `conic-gradient(from ${rotationOffset}deg, transparent 0deg, ${color} ${width}deg, transparent ${width + 0.1
				}deg)`,
			// ...but the transform is now dynamically calculated on every frame!
			transform: `rotate(${rotation}deg)`,
		};

		return <AbsoluteFill style={rayStyle} />;
	};

// The main component that orchestrates the layers
export const RaysBackground: React.FC<RaysBackgroundProps> = ({
	rayCount,
	rayColor,
	rayWidth,
	rayBlur,
	loopDurationInFrames,
}) => {
	// Get the current frame from the Remotion context
	const frame = useCurrentFrame();

	const rays = useMemo(() => {
		return Array.from({ length: rayCount }).map((_, i) => {
			const pseudoRandom = (seed: number) => {
				let x = Math.sin(seed) * 10000;
				return x - Math.floor(x);
			};

			// The delay is now calculated in frames, not seconds.
			// This scatters the start of each ray's loop across the timeline.
			const delayInFrames = pseudoRandom(i + 1) * loopDurationInFrames;
			const rotationOffset = pseudoRandom(i + 2) * 360;

			return { id: i, delayInFrames, rotationOffset };
		});
	}, [rayCount, loopDurationInFrames]);

	const backgroundStyle: React.CSSProperties = {
		background: `
		radial-gradient(circle at 95% 40%, rgba(210, 225, 255, 0.45) 0%, rgba(180, 200, 240, 0.25) 50%, rgba(160, 180, 220, 0.2) 100%),
		linear-gradient(to bottom left, #f5f8ff 0%, #e3ecff 50%, #d6e4fa 100%)
		`,
	};

	const raysContainerStyle: React.CSSProperties = {
		filter: `blur(${rayBlur}px)`,
		mixBlendMode: 'screen',
		transform: 'scale(1.5)',
	};

	return (
		<AbsoluteFill>
			{/* The <style> tag with @keyframes is now completely gone! */}

			{/* Layer 1: The Base Gradient */}
			<AbsoluteFill style={backgroundStyle} />

			{/* Layer 2: The Rays Container */}
			<AbsoluteFill style={raysContainerStyle}>
				{rays.map((ray) => (
					<Ray
						key={ray.id}
						// Pass the current frame down to each ray
						frame={frame}
						color={rayColor}
						width={rayWidth}
						loopDurationInFrames={loopDurationInFrames}
						delayInFrames={ray.delayInFrames}
						rotationOffset={ray.rotationOffset}
					/>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};