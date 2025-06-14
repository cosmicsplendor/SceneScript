import React from 'react';
import { useMemo } from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { DataEvolution } from '.'; // Adjust path if needed

// --- Main Timing Constants ---
const DURATION = 1000;
const WINNER_ANIMATION_DURATION_IN_FRAMES = 210;
const SCORE_TALLY_ANIMATION_DURATION_IN_SECONDS = 1.6;
const FLOAT_ANIMATION_START_DELAY_IN_SECONDS = 2;

// --- Audio-Specific Constants ---
const NUMBER_OF_TALLY_SOUNDS = 16; // Total ticks to play
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
            const FRAMES_PER_UNIT_POINT = (fps * DURATION) / 1000;
            const SF = evolution.data.map((d) => (d.slowDown as number) ?? 1);
            const chartAnimationFrames = Math.ceil(SF.reduce((s, x) => s + x, 0) * FRAMES_PER_UNIT_POINT);
            const winnerAnimationStartFrame = currentTimelineFrame + chartAnimationFrames;
            const floatSoundStartFrame = winnerAnimationStartFrame + (FLOAT_ANIMATION_START_DELAY_IN_SECONDS * fps);

            // Calculate metric typing duration
            const framesPerCharacter = 3;
            const metricLength = evolution.metric ? evolution.metric.length : 0;
            const metricTypingDurationInFrames = metricLength * framesPerCharacter;

            // Typewriter sound is 1 second long
            const typewriterSoundDurationInFrames = fps;

            // Calculate how many typewriter sounds we need to cover the entire metric typing
            const numberOfTypewriterSounds = Math.ceil(metricTypingDurationInFrames / typewriterSoundDurationInFrames);

            // 👉 Typewriter sounds to cover metric typing
            for (let i = 0; i < numberOfTypewriterSounds; i++) {
                sequences.push({
                    key: `typewriter-${index}-${i}`,
                    src: 'assets/sfx/typewriter.wav',
                    startFrame: currentTimelineFrame + (i * typewriterSoundDurationInFrames),
                    durationInFrames: typewriterSoundDurationInFrames,
                    volume: 0.5,
                });
            }

            // 👉 One-up sound after winner animation and delay
            sequences.push({
                key: `one-up-${index}`,
                src: 'assets/sfx/one_up.mp3',
                startFrame: Math.round(floatSoundStartFrame),
                durationInFrames: ONE_UP_SOUND_DURATION_IN_FRAMES,
                volume: 0.5,
            });

            // 👉 Tally sound progression
            const totalTallyFrames = SCORE_TALLY_ANIMATION_DURATION_IN_SECONDS * fps;
            const framesBetweenSounds = totalTallyFrames / NUMBER_OF_TALLY_SOUNDS;
            const soundsPerPitch = NUMBER_OF_TALLY_SOUNDS / pitchVariations;

            for (let i = 0; i < NUMBER_OF_TALLY_SOUNDS; i++) {
                const pointSoundStart = winnerAnimationStartFrame + (i * framesBetweenSounds);
                const pitchIndex = Math.floor(i / soundsPerPitch);
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