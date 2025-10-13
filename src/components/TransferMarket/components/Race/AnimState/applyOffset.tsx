export default (animationData: any, xOffset: number, zOffset: number) => {
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
                                if (key.z !== undefined) {
                                    key.z += zOffset;
                                }
                            });
                        } else if (track && track.x !== undefined) {
                            track.x += xOffset;
                            if (track.z !== undefined) {
                                track.z += zOffset;
                            }
                        } else if (track && track.z !== undefined) {
                            track.z += zOffset;
                        }
                    });
                } else if (kf && kf.x !== undefined) {
                    kf.x += xOffset;
                    if (kf.z !== undefined) {
                        kf.z += zOffset;
                    }
                } else if (kf && kf.z !== undefined) {
                    kf.z += zOffset;
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
                                    if (key.Position && key.Position.z !== undefined) {
                                        key.Position.z += zOffset;
                                    }
                                    if (key.x !== undefined) {
                                        key.x += xOffset;
                                    }
                                    if (key.z !== undefined) {
                                        key.z += zOffset;
                                    }
                                });
                            } else {
                                if (track.Position && track.Position.x !== undefined) {
                                    track.Position.x += xOffset;
                                }
                                if (track.Position && track.Position.z !== undefined) {
                                    track.Position.z += zOffset;
                                }
                                if (track.x !== undefined) {
                                    track.x += xOffset;
                                }
                                if (track.z !== undefined) {
                                    track.z += zOffset;
                                }
                            }
                        });
                    } else {
                        if (kf.Position && kf.Position.x !== undefined) {
                            kf.Position.x += xOffset;
                        }
                        if (kf.Position && kf.Position.z !== undefined) {
                            kf.Position.z += zOffset;
                        }
                        if (kf.x !== undefined) {
                            kf.x += xOffset;
                        }
                        if (kf.z !== undefined) {
                            kf.z += zOffset;
                        }
                    }
                });
            }
            if (obj.Initial?.x !== undefined) {
                obj.Initial.x += xOffset;
            }
            if (obj.Initial?.z !== undefined) {
                obj.Initial.z += zOffset;
            }
            if (obj.Initial?.pos?.x !== undefined) {
                obj.Initial.pos.x += xOffset;
            }
            if (obj.Initial?.pos?.z !== undefined) {
                obj.Initial.pos.z += zOffset;
            }
        });
    });
}