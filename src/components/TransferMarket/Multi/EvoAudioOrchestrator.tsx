import React from 'react';
import { useMemo } from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { DataEvolution } from '.'; // Adjust path if needed

// --- Main Timing Constants ---
const DURATION = 1000;
const WINNER_ANIMATION_DURATION_IN_FRAMES = 210;
const SCORE_TALLY_ANIMATION_DURATION_IN_SECONDS = 1.5;
const FLOAT_ANIMATION_START_DELAY_IN_SECONDS = 2;

// --- Audio-Specific Constants ---
const NUMBER_OF_TALLY_SOUNDS = 15; // Total ticks to play
const ACTUAL_POINT_SOUND_DURATION_IN_FRAMES = 30;
const ONE_UP_SOUND_DURATION_IN_FRAMES = 90;

// Your pre-pitched sound files in ascending order
const pointIncrementSounds = [
    'assets/sfx/blip17.mp3', // Pitch 1
    'assets/sfx/blip18.mp3', // Pitch 2
    'assets/sfx/blip19.mp3', // Pitch 3
    'assets/sfx/blip2.wav',  // Pitch 4 (Highest)
];
const pitchVariations = pointIncrementSounds.length;

type AudioSequence = {
    key: string;
    src: string;
    startFrame: number;
    durationInFrames: number;
    volume: number;
};

interface EvolutionAudioOrchestratorProps {
    evolutions: DataEvolution[];
}

export const EvolutionAudioOrchestrator: React.FC<EvolutionAudioOrchestratorProps> = ({ evolutions }) => {
    const { fps } = useVideoConfig();

    const allAudioSequences = useMemo<AudioSequence[]>(() => {
        const sequences: AudioSequence[] = [];
        let currentTimelineFrame = 0;

        evolutions.forEach((evolution, index) => {
            // (Steps 1 & 2 are unchanged)
            const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
            const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
            const chartAnimationFrames = Math.ceil(SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT);
            const winnerAnimationStartFrame = currentTimelineFrame + chartAnimationFrames;
            const floatSoundStartFrame = winnerAnimationStartFrame + (FLOAT_ANIMATION_START_DELAY_IN_SECONDS * fps);
            sequences.push({
                key: `one-up-${index}`,
                src: 'assets/sfx/one_up.mp3',
                startFrame: Math.round(floatSoundStartFrame),
                durationInFrames: ONE_UP_SOUND_DURATION_IN_FRAMES,
                volume: 0.5,
            });

            // --- Step 3: THE STEPPED PITCH PROGRESSION LOGIC ---
            const totalTallyFrames = SCORE_TALLY_ANIMATION_DURATION_IN_SECONDS * fps;
            const framesBetweenSounds = totalTallyFrames / NUMBER_OF_TALLY_SOUNDS;

            // Calculate how many sounds will play for each pitch level (quarter)
            const soundsPerPitch = NUMBER_OF_TALLY_SOUNDS / pitchVariations; // 20 / 4 = 5

            for (let i = 0; i < NUMBER_OF_TALLY_SOUNDS; i++) {
                const pointSoundStart = winnerAnimationStartFrame + (i * framesBetweenSounds);

                // THE FIX: Use integer division to determine the pitch "quarter"
                // Math.floor(0/5)=0, Math.floor(1/5)=0, ..., Math.floor(4/5)=0
                // Math.floor(5/5)=1, Math.floor(6/5)=1, ...
                const pitchIndex = Math.floor(i / soundsPerPitch);

                // This ensures we don't go out of bounds if the numbers aren't perfect
                const safePitchIndex = Math.min(pitchIndex, pitchVariations - 1);
                
                const soundToPlay = pointIncrementSounds[safePitchIndex];

                sequences.push({
                    key: `point-inc-${index}-${i}`,
                    src: soundToPlay,
                    startFrame: Math.round(pointSoundStart),
                    durationInFrames: ACTUAL_POINT_SOUND_DURATION_IN_FRAMES,
                    volume: 0.4,
                });
            }

            // Step 4: Advance the timeline
            currentTimelineFrame += chartAnimationFrames + WINNER_ANIMATION_DURATION_IN_FRAMES;
        });

        return sequences;
    }, [evolutions, fps]);

    return (
        <>
            {allAudioSequences.map((seq) => (
                <Sequence
                    key={seq.key}
                    from={seq.startFrame}
                    durationInFrames={seq.durationInFrames}
                >
                    <Audio src={staticFile(seq.src)} volume={seq.volume} />
                </Sequence>
            ))}
        </>
    );
};