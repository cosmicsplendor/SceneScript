import { AnimationData, ObjectDefinition, ObjectKeyframe, CrossfadeDefinition, HighlightDefinition, Position } from ".";
import preprocessGenerators from "./preprocessGenerators";
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
    animationData = preprocessGenerators(animationData);
    if (!animationData.Sequence) return animationData;

    for (const event of animationData.Sequence) {
        if (event.Objects) {
            // Use flatMap to allow 1 object -> N objects transformation
            event.Objects = event.Objects.flatMap(originalObj => {
                // 1. Handle Initial.Clip logic (Original logic checks)
                if (originalObj.Initial?.Clip && (!originalObj.Keyframes || originalObj.Keyframes.length === 0)) {
                    originalObj.Keyframes = [
                        [{
                            Time: 0,
                            Clip: originalObj.Initial.Clip
                        }]
                    ];
                }

                if ((!originalObj.CrossFade || originalObj.CrossFade.length === 0) &&
                    (!originalObj.Highlight || originalObj.Highlight.length === 0)) {
                    return [originalObj];
                }

                const resultObjects: ObjectDefinition[] = [];
                // Sort crossfades by time
                const crossfades = originalObj.CrossFade ? [...originalObj.CrossFade].sort((a, b) => a.Time - b.Time) : [];

                // --- CROSSFADE LOGIC (Full Clones) ---
                // We generate N+1 objects: Original + 1 per Crossfade
                // They all exist for the full duration (potentially), but alpha controls visibility.
                // Offsets accumulate.

                let accumulatedOffset: Position = { x: 0, y: 0, z: 0 };

                // Loop includes the "base" state (index -1 effectively) to N
                const totalStates = crossfades.length + 1;

                for (let i = 0; i < totalStates; i++) {
                    const isBase = i === 0;
                    const prevCF = isBase ? null : crossfades[i - 1]; // The CF that transitions INTO this state
                    const nextCF = i < crossfades.length ? crossfades[i] : null; // The CF that transitions OUT of this state

                    // 1. Clone the ORIGINAL object as base to ensure we have all keyframes/data
                    const cleanObj = deepClone(originalObj);

                    // 2. Configure ID and Frame
                    if (isBase) {
                        cleanObj.ID = originalObj.ID;
                        // Frame remains Initial.frame
                    } else {
                        cleanObj.ID = `${originalObj.ID}_cf_${i}`;
                        if (prevCF && cleanObj.Initial) {
                            cleanObj.Initial.frame = prevCF.TargetFrame;
                        }
                    }

                    // 3. Clean up non-processed fields
                    delete cleanObj.CrossFade;
                    delete cleanObj.Highlight;

                    // 4. Update Accumulator and Apply Offsets
                    if (prevCF && prevCF.Offset) {
                        accumulatedOffset = applyOffsetToPosition(accumulatedOffset, prevCF.Offset);
                    }

                    // Apply offset to Initial
                    if (cleanObj.Initial && cleanObj.Initial.pos) {
                        cleanObj.Initial.pos = applyOffsetToPosition(cleanObj.Initial.pos, accumulatedOffset);
                    } else if (cleanObj.Initial && !cleanObj.Initial.pos) {
                        // If no initial pos, but we have offset, we should probably set it? 
                        // But if it relies on default (0,0,0), then yes.
                        cleanObj.Initial.pos = { ...accumulatedOffset };
                    }

                    // Apply offset to ALL Keyframes (Parallel support)
                    if (cleanObj.Keyframes) {
                        const tracks = getTracks(cleanObj);
                        for (const track of tracks) {
                            for (const kf of track) {
                                if (kf.Position) {
                                    kf.Position = applyOffsetToPosition(kf.Position, accumulatedOffset);
                                }
                            }
                        }
                        cleanObj.Keyframes = tracks;
                    }

                    // 5. Manage Visibility (Alpha) via NEW Parallel Track
                    // Determine Alpha actions
                    const alphaKeyframes: ObjectKeyframe[] = [];

                    // Initial State
                    if (isBase) {
                        // Starts visible (inherit initial alpha or 1)
                        // We MUST add a keyframe at 0 to prevent preprocessSequenceInheritance from injecting
                        // the full Initial state (including Position) into this track, which would override motion.
                        alphaKeyframes.push({ Time: 0, Alpha: originalObj.Initial?.alpha ?? 1 });
                    } else {
                        // Starts Invisible
                        if (cleanObj.Initial) cleanObj.Initial.alpha = 0;
                        alphaKeyframes.push({ Time: 0, Alpha: 0 }); // Explicit start at 0
                    }

                    // Fade IN (from Previous CF)
                    if (prevCF) {
                        const ease = prevCF.Curve === 'EaseInOut' ? 'sineInOut' : undefined;
                        // At T: Alpha 0
                        // At T+D: Alpha 1
                        alphaKeyframes.push(
                            { Time: prevCF.Time, Alpha: 0, Easing: ease ? { Alpha: ease } : undefined },
                            { Time: prevCF.Time + prevCF.Duration, Alpha: 1 }
                        );
                    }

                    // Fade OUT (to Next CF)
                    if (nextCF) {
                        const ease = nextCF.Curve === 'EaseInOut' ? 'sineInOut' : undefined;
                        // At T: Alpha 1
                        // At T+D: Alpha 0
                        alphaKeyframes.push(
                            { Time: nextCF.Time, Alpha: 1, Easing: ease ? { Alpha: ease } : undefined },
                            { Time: nextCF.Time + nextCF.Duration, Alpha: 0 }
                        );
                    }

                    // Push the alpha track if it has changes
                    if (alphaKeyframes.length > 0 && cleanObj.Keyframes) {
                        const tracks = getTracks(cleanObj);
                        tracks.push(alphaKeyframes);
                        cleanObj.Keyframes = tracks;
                    } else if (alphaKeyframes.length > 0 && !cleanObj.Keyframes) {
                        cleanObj.Keyframes = [alphaKeyframes];
                    }

                    resultObjects.push(cleanObj);
                }

                // --- HIGHLIGHT LOGIC (Full Clone Override) ---
                if (originalObj.Highlight && originalObj.Highlight.length > 0) {
                    for (const hl of originalObj.Highlight) {
                        const hlObj = deepClone(originalObj);
                        hlObj.ID = `${originalObj.ID}_hl_${hl.Time}`;
                        delete hlObj.CrossFade;
                        delete hlObj.Highlight;

                        // Set Frame
                        if (!hlObj.Initial) hlObj.Initial = {};
                        hlObj.Initial.frame = hl.Frame;
                        hlObj.Initial.alpha = 0; // Default invisible

                        const tracks = getTracks(hlObj);

                        // Alpha Sequence Track
                        const fadeInDur = Math.min(0.1, hl.Duration * 0.2);
                        const fadeOutDur = Math.min(0.1, hl.Duration * 0.2);

                        // Ensure explicit start at 0 to prevent inheritance injection
                        tracks.push([
                            { Time: 0, Alpha: 0 },
                            { Time: hl.Time, Alpha: 0 },
                            { Time: hl.Time + fadeInDur, Alpha: 1 },
                            { Time: hl.Time + hl.Duration - fadeOutDur, Alpha: 1 },
                            { Time: hl.Time + hl.Duration, Alpha: 0 }
                        ]);

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