export default (animationData: any) => {
    if (!animationData.Sequence || !Array.isArray(animationData.Sequence)) {
        return;
    }
    const startSequenceID = animationData.StartSequence
    const startIndex = animationData.Sequence.findIndex(
        (event: any) => event.EventID === startSequenceID
    );
    if (startIndex === -1) {
        console.warn(`StartSequence "${startSequenceID}" not found in animation data`);
        return;
    }

    // Process all events before the start sequence
    for (let i = 0; i < startIndex; i++) {
        const event = animationData.Sequence[i];
        
        // Set duration to zero
        event.Duration = 0;

        // Process objects in this event
        event.Objects?.forEach((obj: any) => {
            // Accumulate final state from keyframes
            const finalState: any = {
                frame: obj.Initial?.frame,
                pos: { ...(obj.Initial?.pos || {}) },
                scale: obj.Initial?.scale,
                alpha: obj.Initial?.alpha,
                flip: obj.Initial?.flip,
                rotation: obj.Initial?.rotation,
                anchor: obj.Initial?.anchor,
            };

            if (obj.Keyframes) {
                // Flatten keyframes to handle both single track and parallel tracks
                const flattenKeyframes = (kf: any): any[] => {
                    if (!Array.isArray(kf)) {
                        return [kf];
                    }
                    // Check if it's an array of arrays (parallel tracks)
                    if (kf.length > 0 && Array.isArray(kf[0])) {
                        // Flatten all parallel tracks
                        return kf.flat();
                    }
                    return kf;
                };

                const allKeyframes = flattenKeyframes(obj.Keyframes);

                // Sort by time to process in order
                allKeyframes.sort((a: any, b: any) => (a.Time || 0) - (b.Time || 0));

                // Accumulate state changes
                allKeyframes.forEach((keyframe: any) => {
                    if (keyframe.Frame !== undefined) {
                        finalState.frame = keyframe.Frame;
                    }
                    // Ignore Clip - it's just a reference to animation definitions
                    if (keyframe.Position) {
                        if (keyframe.Position.x !== undefined) {
                            finalState.pos.x = keyframe.Position.x;
                        }
                        if (keyframe.Position.y !== undefined) {
                            finalState.pos.y = keyframe.Position.y;
                        }
                        if (keyframe.Position.z !== undefined) {
                            finalState.pos.z = keyframe.Position.z;
                        }
                    }
                    if (keyframe.Scale !== undefined) {
                        finalState.scale = keyframe.Scale;
                    }
                    if (keyframe.Alpha !== undefined) {
                        finalState.alpha = keyframe.Alpha;
                    }
                    if (keyframe.Rotation !== undefined) {
                        finalState.rotation = keyframe.Rotation;
                    }
                    if (keyframe.Flip !== undefined) {
                        finalState.flip = keyframe.Flip;
                    }
                });
            }

            // Update Initial state with accumulated values
            obj.Initial = obj.Initial || {};
            if (finalState.frame !== undefined) {
                obj.Initial.frame = finalState.frame;
            }
            if (finalState.pos && (finalState.pos.x !== undefined || finalState.pos.y !== undefined || finalState.pos.z !== undefined)) {
                obj.Initial.pos = finalState.pos;
            }
            if (finalState.scale !== undefined) {
                obj.Initial.scale = finalState.scale;
            }
            if (finalState.alpha !== undefined) {
                obj.Initial.alpha = finalState.alpha;
            }
            if (finalState.flip !== undefined) {
                obj.Initial.flip = finalState.flip;
            }
            if (finalState.rotation !== undefined) {
                obj.Initial.rotation = finalState.rotation;
            }
            if (finalState.anchor !== undefined) {
                obj.Initial.anchor = finalState.anchor;
            }

            // Remove keyframes
            delete obj.Keyframes;
        });
        // Clear camera keyframes (set to empty or remove)
        if (event.Camera?.Keyframes) {
            event.Camera.Keyframes = {};
        }
    }
}