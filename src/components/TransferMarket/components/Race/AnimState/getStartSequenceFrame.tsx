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
    console.log({ startIndex})
    // Sum durations of all events before the start sequence
    console.log(animationData.Sequence)
    for (let i = 0; i < startIndex; i++) {
        const event = animationData.Sequence[i];
        let maxTimeInEvent = 1.0;

        // Find max time in camera keyframes (times are keys in the object)
        if (event.Camera?.Keyframes) {
            for (const timeStr in event.Camera.Keyframes) {
                maxTimeInEvent = Math.max(maxTimeInEvent, parseFloat(timeStr));
                console.log({ maxTimeInEvent })
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

        // Calculate normalized duration for this event
        const normalizedDuration = maxTimeInEvent > 1.0 
            ? Math.round(event.Duration * maxTimeInEvent)
            : event.Duration;
        console.log({ normalizedDuration })
        totalFrames += normalizedDuration;
    }

    return totalFrames;
};