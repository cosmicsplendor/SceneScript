import { DynamicObject } from "./DynamicObjects"

// Two-level cache structure using objects
const frameCache = {};

function getFrame(prefix, num) {
    let frames = frameCache[prefix];
    if (!frames) {
        // Create array with length matching frameCount
        frames = [];
        frameCache[prefix] = frames;
    }

    // Arrays are 0-based, so we adjust the index
    let frameName = frames[num - 1];
    if (!frameName) {
        frameName = `${prefix}${num}`;
        frames[num - 1] = frameName;
    }

    return frameName;
}

// Preload frame names for a given prefix and range
function preloadFrames(prefix, start, count) {
    for (let i = start; i <= count; i++) {
        getFrame(prefix, i);
    }
}

class DAnim extends DynamicObject {
    constructor({
        startFrame = 1,
        framePrefix = "tile",
        frameCount = 16,
        frameStep = 0.125 / 16,
        fadeSpeed = 0,
        yVel = -200,
        xVel = 0,
        scale = 8,
        removeOnComplete = false,
        active = true,
        yOffset = 0,
        loopBack = false,
        gravity = 0,
        ...params
    }) {
        super(params);

        this.frameNum = startFrame;
        this.framePrefix = framePrefix;
        this.frameCount = frameCount;
        this.step = frameStep;
        this.nextIn = this.step;
        this.fadeSpeed = fadeSpeed;
        this.yVel = yVel;
        this.xVel = xVel;
        this.scale = scale;
        this.yOffset = yOffset;
        this.alpha = 1;
        this.active = active;
        this.removeOnComplete = removeOnComplete;
        this.loopBack = loopBack;
        this.gravity = gravity;
        this.ascending = true;
        this.flip = false;

        // Preload all frame names for this animation
        if (!frameCache[framePrefix]) preloadFrames(framePrefix, 1, frameCount);
        this.frame = getFrame(framePrefix, startFrame)
    }

    update(dt, t) {
        super.update(dt, t);

        if (!this.active) {
            return;
        }

        if (this.fadeSpeed > 0) {
            this.alpha = Math.max(0, this.alpha - this.fadeSpeed * dt);
        }

        this.x += this.xVel * dt;
        this.yVel += this.gravity * dt;
        this.yOffset += this.yVel * dt;

        if (this.nextIn > 0) {
            this.nextIn -= dt;
            return;
        }

        if (this.loopBack) {
            if (this.ascending) {
                this.frameNum++;
                if (this.frameNum >= this.frameCount) {
                    this.flip = !this.flip;
                    this.ascending = false;
                    this.frameNum = this.frameCount;
                }
            } else {
                this.frameNum--;
                if (this.frameNum <= 1) {
                    this.flip = !this.flip;
                    this.ascending = true;
                    this.frameNum = 1;
                }
            }
            this.frame = getFrame(this.framePrefix, this.frameNum);
        } else {
            this.frameNum++;
            if (this.frameNum > this.frameCount) {
                if (this.removeOnComplete) {
                    this.parent.remove(this);
                    return;
                }
                this.frameNum = 1;
            }
            this.frame = getFrame(this.framePrefix, this.frameNum);
        }

        this.nextIn = this.step;
    }
}

export default DAnim