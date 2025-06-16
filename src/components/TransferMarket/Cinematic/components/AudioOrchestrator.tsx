import React from 'react';
import { useMemo } from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';

// --- Audio-Specific Constants ---
const NUMBER_OF_TALLY_SOUNDS = 16; // Total ticks to play
const ACTUAL_POINT_SOUND_DURATION_IN_FRAMES = 30;
const ONE_UP_SOUND_DURATION_IN_FRAMES = 90;
const SCORE_TALLY_ANIMATION_DURATION_IN_SECONDS = 1.6;
const FLOAT_ANIMATION_START_DELAY_IN_SECONDS = 2;

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
    durationInFrames?: number;
    volume: number;
};

type ManualSound = {
    start: number;
    src: string;
    volume?: number;
};

interface SimpleAudioOrchestratorProps {
    startFrame?: number; // When winning animation starts
    sounds?: ManualSound[]; // Manual sound definitions
}

export const AudioOrchestrator: React.FC<SimpleAudioOrchestratorProps> = ({ 
    startFrame, 
    sounds = [] 
}) => {
    const { fps } = useVideoConfig();

    const allAudioSequences = useMemo<AudioSequence[]>(() => {
        const sequences: AudioSequence[] = [];

        // Handle manual sounds if provided
        sounds.forEach((sound, index) => {
            sequences.push({
                key: `manual-sound-${index}`,
                src: "transferAudio/" + sound.src,
                startFrame: sound.start,
                durationInFrames: undefined, // Default duration
                volume: sound.volume ?? 1,
            });
        });

        // Handle startFrame-based sequence if provided
        if (startFrame !== undefined) {
            const floatSoundStartFrame = startFrame + (FLOAT_ANIMATION_START_DELAY_IN_SECONDS * fps);

            // 👉 One-up sound after winner animation and delay
            sequences.push({
                key: 'one-up',
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
                const pointSoundStart = startFrame + (i * framesBetweenSounds);
                const pitchIndex = Math.floor(i / soundsPerPitch);
                const safePitchIndex = Math.min(pitchIndex, pitchVariations - 1);
                const soundToPlay = pointIncrementSounds[safePitchIndex];

                sequences.push({
                    key: `point-inc-${i}`,
                    src: soundToPlay,
                    startFrame: Math.round(pointSoundStart),
                    durationInFrames: ACTUAL_POINT_SOUND_DURATION_IN_FRAMES,
                    volume: 0.4,
                });
            }
        }

        return sequences;
    }, [startFrame, sounds, fps]);

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