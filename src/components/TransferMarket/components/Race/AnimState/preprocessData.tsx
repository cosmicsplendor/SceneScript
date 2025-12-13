import { AnimationData, ObjectDefinition, ObjectKeyframe, CrossfadeDefinition, HighlightDefinition, Position } from ".";

// Helper to ensure keyframes are in a consistent format (Array of Arrays) for processing
function getTracks(obj: ObjectDefinition): ObjectKeyframe[][] {
    if (!obj.Keyframes) return [];
    if (obj.Keyframes.length === 0) return [];
    // Check if it's already an array of arrays (Parallel tracks)
    if (Array.isArray(obj.Keyframes[0])) {
        return obj.Keyframes as ObjectKeyframe[][];
    }
    // Single track, wrap it
    return [obj.Keyframes as ObjectKeyframe[]];
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

function applyOffsetToPosition(pos: Position | undefined, offset: Position): Position {
    if (!pos) return { ...offset };
    return {
        x: (pos.x || 0) + (offset.x || 0),
        y: (pos.y || 0) + (offset.y || 0),
        z: (pos.z || 0) + (offset.z || 0),
    };
}

export default (animationData: AnimationData): AnimationData => {
    if (!animationData.Sequence) return animationData;

    for (const event of animationData.Sequence) {
        if (event.Objects) {
            // Use flatMap to allow 1 object -> N objects transformation
            event.Objects = event.Objects.flatMap(originalObj => {
                // 1. Handle Initial.Clip logic (Original logic)
                if (originalObj.Initial?.Clip && (!originalObj.Keyframes || originalObj.Keyframes.length === 0)) {
                    originalObj.Keyframes = [
                        [{
                            Time: 0,
                            Clip: originalObj.Initial.Clip
                        }]
                    ];
                }

                // If no crossfades/highlights, return as is
                if ((!originalObj.Crossfade || originalObj.Crossfade.length === 0) &&
                    (!originalObj.Highlight || originalObj.Highlight.length === 0)) {
                    return [originalObj];
                }

                let currentObj = deepClone(originalObj);
                const resultObjects: ObjectDefinition[] = [];

                // --- CROSSFADE LOGIC ---
                if (currentObj.Crossfade && currentObj.Crossfade.length > 0) {
                    // Sort by time
                    currentObj.Crossfade.sort((a, b) => a.Time - b.Time);

                    for (const cf of currentObj.Crossfade) {
                        const nextObj = deepClone(currentObj);
                        nextObj.ID = `${currentObj.ID}_cf_${cf.Time}`;
                        nextObj.Crossfade = []; // Clear processed crossfades
                        nextObj.Highlight = []; // Highlights are presumably handled on the specific segment or original? 
                        // Let's assume highlights stay on the segments they fall into, but for simplicity, 
                        // we might clear them to avoid duplicating highlights across chained objects.
                        // Ideally, we should check if a highlight falls within this segment's time range.
                        // For now, let's clear to avoid infinite recursion or duplication issues if logic was recursive.

                        // 1. Setup Next Object (Fade In)
                        if (nextObj.Initial) {
                            nextObj.Initial.frame = cf.TargetFrame;
                            nextObj.Initial.alpha = 0; // Start invisible
                            if (cf.Offset) {
                                nextObj.Initial.pos = applyOffsetToPosition(nextObj.Initial.pos, cf.Offset);
                            }
                        }

                        // Split Keyframes
                        const currentTracks = getTracks(currentObj);
                        const nextTracks = getTracks(nextObj);

                        // Next object keeps keyframes >= cf.Time
                        nextObj.Keyframes = nextTracks.map(track => {
                            return track.map(kf => {
                                const newKf = { ...kf };
                                if (cf.Offset && newKf.Position) {
                                    newKf.Position = applyOffsetToPosition(newKf.Position, cf.Offset);
                                }
                                return newKf;
                            }).filter(kf => kf.Time >= cf.Time);
                        });

                        // Current object keeps keyframes <= cf.Time + cf.Duration
                        currentObj.Keyframes = currentTracks.map(track => {
                            return track.filter(kf => kf.Time <= cf.Time + cf.Duration);
                        });

                        // Add Alpha Transitions
                        const ease = cf.Curve === 'EaseInOut' ? 'sineInOut' : undefined;

                        // Fade Out Current
                        // We need to inject these into the tracks. Assuming Track 0 is primary for alpha.
                        if (!currentObj.Keyframes[0]) currentObj.Keyframes[0] = [];
                        (currentObj.Keyframes[0] as ObjectKeyframe[]).push(
                            { Time: cf.Time, Alpha: 1, Easing: ease ? { Alpha: ease } : undefined },
                            { Time: cf.Time + cf.Duration, Alpha: 0 }
                        );

                        // Fade In Next
                        if (!nextObj.Keyframes[0]) nextObj.Keyframes[0] = [];
                        (nextObj.Keyframes[0] as ObjectKeyframe[]).push(
                            { Time: cf.Time, Alpha: 0, Easing: ease ? { Alpha: ease } : undefined },
                            { Time: cf.Time + cf.Duration, Alpha: 1 }
                        );

                        resultObjects.push(currentObj);
                        currentObj = nextObj; // Advance chain
                    }
                }
                resultObjects.push(currentObj); // Push the final segment

                // --- HIGHLIGHT LOGIC ---
                // Highlights apply to the original object definition's timeline usually.
                // Since we split the object, we need to decide which segment the highlight belongs to 
                // OR we create independent highlight objects that span the required time.
                // Creating independent objects based on the ORIGINAL definition is safest.

                if (originalObj.Highlight && originalObj.Highlight.length > 0) {
                    for (const hl of originalObj.Highlight) {
                        const hlObj = deepClone(originalObj);
                        hlObj.ID = `${originalObj.ID}_hl_${hl.Time}`;
                        hlObj.Crossfade = [];
                        hlObj.Highlight = [];

                        // Set Frame
                        if (!hlObj.Initial) hlObj.Initial = {};
                        hlObj.Initial.frame = hl.Frame;
                        hlObj.Initial.alpha = 0; // Default invisible

                        // Keep only relevant keyframes? Or keep all for synching movement?
                        // Keep all to ensure it moves exactly with the original (shadow).

                        // Override Alpha for the flash effect
                        const tracks = getTracks(hlObj);

                        // Remove existing alpha keys to prevent interference?
                        // Yes, we want to control alpha strictly.
                        for (const track of tracks) {
                            for (const kf of track) {
                                delete kf.Alpha;
                            }
                        }

                        // Inject specific alpha sequence for highlight
                        const fadeInDur = Math.min(0.1, hl.Duration * 0.2);
                        const fadeOutDur = Math.min(0.1, hl.Duration * 0.2);

                        // Create a dedicated track for alpha if we want, or just append to track 0.
                        if (!tracks[0]) tracks[0] = [];

                        (tracks[0] as ObjectKeyframe[]).push(
                            { Time: hl.Time, Alpha: 0 },
                            { Time: hl.Time + fadeInDur, Alpha: 1 },
                            { Time: hl.Time + hl.Duration - fadeOutDur, Alpha: 1 },
                            { Time: hl.Time + hl.Duration, Alpha: 0 }
                        );

                        hlObj.Keyframes = tracks;
                        resultObjects.push(hlObj);
                    }
                }

                return resultObjects;
            });
        }
    }
    return animationData;
}