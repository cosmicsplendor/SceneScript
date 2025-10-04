export default (animationData: any, xOffset: number) => {
    animationData.Sequence?.forEach((event: any) => {
        // Camera keyframes
        if (event.Camera?.Keyframes) {
            Object.values(event.Camera.Keyframes).forEach((kf: any) => {
                // Handle multi-track (array of arrays) or single keyframe
                if (Array.isArray(kf)) {
                    kf.forEach((track: any) => {
                        if (Array.isArray(track)) {
                            track.forEach((key: any) => {
                                if (key.x !== undefined) {
                                    key.x += xOffset;
                                }
                            });
                        } else if (track && track.x !== undefined) {
                            track.x += xOffset;
                        }
                    });
                } else if (kf && kf.x !== undefined) {
                    kf.x += xOffset;
                }
            });
        }
        // Object keyframes
        event.Objects?.forEach((obj: any) => {
            if (obj.Keyframes) {
                obj.Keyframes.forEach((kf: any) => {
                    // Handle multi-track (array of arrays) or single keyframe
                    if (Array.isArray(kf)) {
                        kf.forEach((track: any) => {
                            if (Array.isArray(track)) {
                                track.forEach((key: any) => {
                                    if (key.Position && key.Position.x !== undefined) {
                                        key.Position.x += xOffset;
                                    }
                                    if (key.x !== undefined) {
                                        key.x += xOffset;
                                    }
                                });
                            } else {
                                if (track.Position && track.Position.x !== undefined) {
                                    track.Position.x += xOffset;
                                }
                                if (track.x !== undefined) {
                                    track.x += xOffset;
                                }
                            }
                        });
                    } else {
                        if (kf.Position && kf.Position.x !== undefined) {
                            kf.Position.x += xOffset;
                        }
                        if (kf.x !== undefined) {
                            kf.x += xOffset;
                        }
                    }
                });
            }
            if (obj.Initial?.x !== undefined) {
                obj.Initial.x += xOffset;
            }
            if (obj.Initial?.pos?.x !== undefined) {
                obj.Initial.pos.x += xOffset;
            }
        });
    });
}