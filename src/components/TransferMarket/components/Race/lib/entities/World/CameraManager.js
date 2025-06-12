// CameraManager.js
import { clamp, lerp } from "@lib/utils/math";

export default class CameraManager {
    // --- Public State ---
    // These are the properties `updateState` will read.
    cameraHeight = 100;
    xPos = 0;         // The camera's smoothed horizontal position.
    zOffset = 0;      // The negative of the follow distance.

    // --- Internal State & Configuration ---
    _target = null;
    _config = {};
    _followDistance = 200; // Internal 'subDist'
    
    // How fast the camera's X position catches up to the target's X.
    _horizontalFollowFactor = 0.1;

    constructor(target, config) {
        this._target = target;
        this._config = {
            // Default values matching your old World class
            cameraHeight: config.cameraHeight || 100,
            default: config.default || 200,
            min: config.min || 100,
            max: config.max || 300,
            ascThres: config.ascThres || 10,
            descThres: config.descThres || -10
        };

        this.cameraHeight = this._config.cameraHeight;
        this._followDistance = this._config.default;
        this.zOffset = -this._followDistance;

        // Initialize position to the target's starting position
        if (target) {
            this.xPos = target.x;
        }
    }

    setTarget(newTarget) {
        // For now, we'll just do an instant snap. Smooth transitions can be added later.
        this._target = newTarget;
    }

    /**
     * The main update loop for the camera, called every frame.
     * @param {number} dt Delta time.
     * @param {Segment} currentSegment The road segment the camera is currently over.
     * @param {Segment} nextSegment The next road segment.
     */
    update(dt, currentSegment, nextSegment) {
        if (!this._target) return;

        // 1. Update horizontal follow position (smoothly)
        // Note: In your old code, the camera's X was directly tied to subject.x.
        // We will keep that direct link for now to ensure it works, and introduce smoothing later.
        // The old projection formula `-(x * roadWidth * 2 * viewport.invWidth)` is complex.
        // We will let `updateState` handle that projection part. The CameraManager will just track the world X.
        this.xPos = this._target.x;
        
        // 2. Update follow distance based on slope
        if (currentSegment && nextSegment) {
            const slope = nextSegment.h - currentSegment.h;
            
            if (slope > this._config.ascThres) {
                const dh = this._config.ascThres - slope;
                this._incFollowDistance(-dh);
            } else if (slope < this._config.descThres) {
                const dh = this._config.descThres - slope;
                this._incFollowDistance(-dh);
            } else {
                // Smoothly return to the default distance
                this._followDistance += (this._config.default - this._followDistance) * 0.01;
            }
            this.cameraHeight = clamp(30, 100, this.cameraHeight);
        }

        // Clamp the final distance and update the public zOffset
        this._followDistance = clamp(this._config.min, this._config.max, this._followDistance);
        this.zOffset = -this._followDistance;
    }
    
    /**
     * Internal helper to increment the follow distance with smoothing.
     */
    _incFollowDistance(val) {
        const prev = this._followDistance;
        const cur = this._followDistance + val;
        this._followDistance = prev + (cur - prev) * 0.5;
    }
}