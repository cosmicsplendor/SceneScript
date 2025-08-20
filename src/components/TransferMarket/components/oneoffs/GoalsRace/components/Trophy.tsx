import {
	Audio,
	Easing,
	Img,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import React from 'react';

// --- Props Interface ---
interface GlowingTrophyProps {
	// We make props optional by adding '?'
	startFrame?: number;
	lifespanInFrames?: number;
}

// --- Animation Parameters ---
const ENTRANCE_DURATION = 20;
const FADE_OUT_DURATION = 25;
const GLOW_DELAY_AFTER_ENTRANCE = -10;
const GLOW_CYCLE_DURATION = 90;

// --- Component ---
export const GlowingTrophy: React.FC<GlowingTrophyProps> = ({
	// Provide default values directly in the function signature
	startFrame = 78,
	lifespanInFrames = 80,
}) => {
	const frame = useCurrentFrame();

	// 1. Entrance Animation (Scale & Fade-In)
	const entranceProgress = interpolate(
		frame,
		[startFrame, startFrame + ENTRANCE_DURATION],
		[0, 1],
		{
			extrapolateRight: 'clamp',
			easing: Easing.out(Easing.cubic),
		}
	);

	const scale = entranceProgress;
	const fadeInOpacity = entranceProgress;

	// 2. Fade-Out Logic
	const fadeOutStartFrame = startFrame + lifespanInFrames;
	const fadeOutOpacity = interpolate(
		frame,
		[fadeOutStartFrame, fadeOutStartFrame + FADE_OUT_DURATION],
		[1, 0],
		{
			extrapolateLeft: 'clamp',
            easing: Easing.out(Easing.cubic),
		}
	);

	// The final opacity is the lower of the two values, ensuring both fades work
	const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

	// 3. Single-Cycle Slow Glow Logic
	const GLOW_START_FRAME = startFrame + ENTRANCE_DURATION + GLOW_DELAY_AFTER_ENTRANCE;
	const glowPeakFrame = GLOW_START_FRAME + GLOW_CYCLE_DURATION / 2;
	const glowEndFrame = GLOW_START_FRAME + GLOW_CYCLE_DURATION;

	const glowAnimation = (base: number, peak: number) =>
		interpolate(frame, [GLOW_START_FRAME, glowPeakFrame, glowEndFrame], [base, peak, base], {
			extrapolateRight: 'clamp',
		});

	const brightness = glowAnimation(1, 1.4);
	const shadowBlur = glowAnimation(0, 18);
	const shadowOpacity = glowAnimation(0, 0.8);

	const glowFilter = `
    brightness(${brightness}) 
    drop-shadow(0 0 ${shadowBlur}px rgba(255, 215, 0, ${shadowOpacity}))
  `;
	
	// Prevent rendering at all if opacity is 0 to improve performance
	if (opacity === 0) {
		return null;
	}

	return (
		<>
			{/* BEST PRACTICE: Use a Sequence to perfectly sync audio */}
			<Sequence from={startFrame} durationInFrames={ENTRANCE_DURATION}>
				<Audio src={staticFile('assets/sfx/swoosh.wav')} volume={0.5} />
			</Sequence>

			<Img
				src={staticFile('images/world_cup.png')}
				style={{
					width: 120,
					height: 'auto',
					position: 'absolute',
					top: '4%',
					opacity,
					filter: glowFilter,
					transform: `scale(${scale})`,
				}}
			/>
		</>
	);
};