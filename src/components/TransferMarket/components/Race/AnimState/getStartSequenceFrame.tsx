export default (animationData: any): number => {
    if (!animationData.Sequence || !Array.isArray(animationData.Sequence)) {
        return 0;
    }
    
    const startSequenceID = animationData.StartSequence;
    
    if (!startSequenceID) {
        return 0;
    }

    const startIndex = animationData.Sequence.findIndex(
        (event: any) => event.EventID === startSequenceID
    );

    if (startIndex === -1) {
        return 0;
    }

    let totalFrames = 0;

    // Helper to check if keyframes are parallel tracks
    const isParallelTrack = (kf: any): boolean => {
        return Array.isArray(kf) && kf.length > 0 && Array.isArray(kf[0]);
    };

    console.log({ startIndex });

    // Sum durations of all events before the start sequence
    for (let i = 0; i < startIndex; i++) {
        const event = animationData.Sequence[i];
        
        // Only process normalization if the event is flagged for it
        if (!event.Normalize) {
            totalFrames += event.Duration;
            continue;
        }
        
        let maxTimeInEvent = 0.0;
        
        // Find max time in camera keyframes (times are keys in the object)
        if (event.Camera?.Keyframes) {
            for (const timeStr in event.Camera.Keyframes) {
                maxTimeInEvent = Math.max(maxTimeInEvent, parseFloat(timeStr));
            }
        }

        // Find max time in object keyframes (times are in Time property)
        if (event.Objects) {
            for (const objDef of event.Objects) {
                if (!objDef.Keyframes) continue;
                
                const tracks = isParallelTrack(objDef.Keyframes)
                    ? objDef.Keyframes
                    : [objDef.Keyframes];
                
                for (const track of tracks) {
                    for (const kf of track) {
                        if (kf.Time !== undefined) {
                            maxTimeInEvent = Math.max(maxTimeInEvent, kf.Time);
                        }
                    }
                }
            }
        }

        // If there's no animation, use the original duration
        if (maxTimeInEvent <= 0) {
            totalFrames += event.Duration;
            continue;
        }

        // UNIFIED DURATION LOGIC: Always scale the original duration by maxTimeInEvent
        const normalizedDuration = Math.round(event.Duration * maxTimeInEvent);
        console.log({ maxTimeInEvent, normalizedDuration });
        totalFrames += normalizedDuration;
    }
    return totalFrames;
};