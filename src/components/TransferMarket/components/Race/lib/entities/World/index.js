import { Node } from "../../index";
import { world3D } from "../types";
import { interpolate } from "../../utils/functions";
import { clamp } from "../../utils/math";
import Road from "../../components/Road";
import { fogFactorCache } from "./FogFactorCache";
import VibeTransition from "./VibeTransition";
import updateState from "./updateState";

const SEGEXC = 4000
const computeYDirThres = (cameraHeight, fov = 60) => {
    return -50
};

// Easing function for a more natural, non-linear transition feel
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

class World extends Node {
    type = world3D;
    rumbles = 3;
    segmentLength = 75;
    yScale = 1000
    drawDistance = 500;
    cameraHeight = 100;
    xPos = 0;

    // The _subject is the entity the player controls or the "main character".
    // It is ALWAYS the current logical subject.
    _subject = null;
    
    // --- Camera Transition State ---
    isCameraTransitioning = false;
    cameraTransitionProgress = 0;
    cameraTransitionDuration = 1.0; // Duration of the pan in seconds.
    cameraTransitionSourcePos = { x: 0, y: 0, z: 0 }; // Starting position for the pan.

    segments = null;
    road = null;
    fov = 0;
    cameraDepth = 0;
    atlasMeta = null;
    _zMap = {};
    _invZMap = {};
    curMaxima = 0
    firstSegmentIndex = 0;
    prlx = null
    lprlx = null // last prlx
    lastVibeZ = 0
    setFov(fov) {
        this.fov = fov * Math.PI / 180;
        this.cameraDepth = 1 / Math.tan(this.fov / 2);
    }
    constructor({
        renderer, segmentGenerator, fov = Math.PI / 4, cameraHeight = 50, rumbles = 3, subject, roadWidth, drawDistance = 200, subDistConfig = {},
        atlasMeta, dLayers, spriteScale = 250, segmentLength = 75, doFacs = {}, onLaneData = () => { }, viewport, ORIGIN_Y=0.6  
    }) {
        try {
            super();
            this.renderer = renderer
            this.segmentGen = segmentGenerator;
            this.segments = []
            this.firstSegmentIndex = 0;

            // This will now use the new setter to initialize the subject instantly
            this.setSubject(subject, true);

            this.cameraHeight = cameraHeight;
            this.setFov(fov)
            this.drawDistance = drawDistance;
            this.atlasMeta = atlasMeta;

            this.y = cameraHeight;

            this.baseSegment = 0;
            this.dLayers = dLayers;
            this.segmentLength = segmentLength
            this.yDirThres = computeYDirThres(cameraHeight, fov) * 2
            this.yDirUpThres = this.yDirThres * 2
            this.spriteScale = spriteScale
            this.XDIR_POS = interpolate(0.34, 0.14, 50000, 100000, roadWidth)
            this.XDIR_NEG = interpolate(-0.4, -0.16, 50000, 100000, roadWidth)

            this.subDistConfig = {
                default: subDistConfig.default || 200,
                min: subDistConfig.min || 100,
                max: subDistConfig.max || 300,
                ascThres: subDistConfig.ascThres || 10,
                descThres: subDistConfig.descThres || -10
            };

            this.subDist0 = this.subDistConfig.default;
            this.subDistMin = this.subDistConfig.min;
            this.subDistMax = this.subDistConfig.max;
            this.ascThres = this.subDistConfig.ascThres;
            this.descThres = this.subDistConfig.descThres;
            this.rumbles = rumbles
            this.subDist = this.subDist0
            this.vibeTransition = new VibeTransition(4, this);
            this.road = new Road(this.segmentGen.road, viewport);
            this.roadWidth = roadWidth
            this.add(this.road);
            this.doFacs = doFacs;
            this.onLaneData = onLaneData

            const realign = viewport => {
                this.ORIGIN_Y = ORIGIN_Y
            }
            viewport.on("change", realign)
            this.viewport=viewport
            realign(viewport)
        } catch (e) {
            console.log(e)
        }
    }
    get subject() {
        return this._subject;
    }

    set subject(s) {
        // The public setter always attempts a smooth transition
        this.setSubject(s, false);
    }

    onMaxima(fn) {
        this.onMaxima = fn
    }
    setVibe(sky, fog, fogDensity, progress) {
        if (sky) {
            this.renderer.changeBackground(sky, progress)
        }
        if (fog) {
            this.renderer.fog = fog
        }
        if (fogDensity) {
            this.fogDensity = fogDensity
        }
    }
    findSegmentFloat(z) {
        return z / this.segmentLength;
    }
    set subDist(value) {
        this._subDist = clamp(this.subDistMin, this.subDistMax, value);
        this.lastZOffset = this.zOffset || -this._subDist
        this.zOffset = -this._subDist;
    }

    get subDist() {
        return this._subDist;
    }

    incSubDist(val) {
        const prev = this.subDist;
        const cur = this.subDist + val;
        this.subDist = prev + (cur - prev) * 0.5;
    }
    
    _updateCameraFollowDistance(currentSegment, nextSegment) {
        if (this.subDistMin === this.subDistMax) return;
        if (currentSegment && nextSegment) {
            const currentSlope = nextSegment.h - currentSegment.h;
            if (currentSlope > this.ascThres) this.incSubDist(-(this.ascThres - currentSlope));
            else if (currentSlope < this.descThres) this.incSubDist(-(this.descThres - currentSlope));
            else this.subDist += (this.subDist0 - this.subDist) * 0.01;
            this.cameraHeight = clamp(30, 100, this.cameraHeight);
        }
    }

    syncCamera(currentSegment, nextSegment) {
        this._updateCameraFollowDistance(currentSegment, nextSegment);
    }

    findSegment(z) {
        return Math.floor(z / this.segmentLength);
    }
    setYDir(obj, y1, z1, y2, z2) {
        obj.yDir = -1
    }
    getXDir(objX, objZ) {
        const focusPos = this.getCameraFocusPosition();
        const dz = objZ - focusPos.z;
        if (dz > 2250) return 0
        const dx = objX - focusPos.x;
        if (dx > this.XDIR_POS) return 1
        if (dx < this.XDIR_NEG) return -1
        return 0
    }
    interpolateOffsets(prevOffset, currentOffset, factor) {
        return prevOffset * (1 - factor) + currentOffset * factor;
    }

    /**
     * Sets the active subject and initiates a smooth camera transition.
     * @param {Node} newSubject The new subject to follow.
     * @param {boolean} [isInstant=false] If true, camera snaps immediately without a transition.
     */
    setSubject(newSubject, isInstant = false) {
        if (newSubject === this._subject) return;

        const oldSubject = this._subject;
        this._subject = newSubject;

        if (oldSubject && !isInstant && newSubject) {
            this.isCameraTransitioning = true;
            this.cameraTransitionProgress = 0;
            this.cameraTransitionSourcePos.x = oldSubject.x;
            this.cameraTransitionSourcePos.y = oldSubject.y;
            this.cameraTransitionSourcePos.z = oldSubject.z;
        } else {
            this.isCameraTransitioning = false;
        }

        this.eta = (this._subject && this._subject.maxSpeed)
            ? this.segments.length * this.segmentLength / this._subject.maxSpeed
            : Infinity;
    }

    /**
     * KEY METHOD: Provides the position for the camera to look at.
     * It handles interpolation during a transition, otherwise returns the subject's position.
     * @returns {{x: number, y: number, z: number}} The position the camera should focus on.
     */
    getCameraFocusPosition() {
        if (this.isCameraTransitioning && this._subject) {
            const easeFactor = easeInOutCubic(clamp(0, 1, this.cameraTransitionProgress));
            const source = this.cameraTransitionSourcePos;
            const destination = this._subject;
            return {
                x: source.x + (destination.x - source.x) * easeFactor,
                y: source.y + (destination.y - source.y) * easeFactor,
                z: source.z + (destination.z - source.z) * easeFactor,
            };
        }
        return this._subject || { x: 0, y: 0, z: 0 };
    }

    /**
     * Updates the progress of the camera transition each frame.
     * @param {number} dt Delta time in seconds.
     */
    _updateCameraTransition(dt) {
        if (!this.isCameraTransitioning) return;
        this.cameraTransitionProgress += dt / this.cameraTransitionDuration;
        if (this.cameraTransitionProgress >= 1.0) {
            this.isCameraTransitioning = false;
        }
    }

    syncSeg() {
        const { segments, drawDistance, zOffset } = this
        const focusPos = this.getCameraFocusPosition();
        const baseSegment = this.findSegment(focusPos.z + zOffset);
        let relIndex = baseSegment - this.firstSegmentIndex;
        while (segments.length - relIndex < drawDistance) {
            let oldSeg = undefined
            if (segments.length > drawDistance + SEGEXC) {
                oldSeg = this.segments.shift()
                this.firstSegmentIndex++;
                relIndex = baseSegment - this.firstSegmentIndex;
            }
            const segment = this.segmentGen.acc(oldSeg);
            if (segment.extrema && this.curMaxima !== baseSegment) {
                this.curMaxima = baseSegment;
                const info = segment.extrema;
                if (typeof this.onMaxima === "function") this.onMaxima(info)
            }
            if (segment.bound) {
                let delay = 0
                if (this.prlx !== segment.prlx) {
                    this.lprlx = this.prlx
                    delay += this.lprlx ? this.lprlx.exitDur : 0
                    this.prlx = segment.prlx
                    this.prlx && this.prlx.reset(delay + 0.25)
                    delay += this.prlx ? this.prlx.delay0 : 0
                }
                if (delay) this.vibeTransition.add(segment.vibe, delay);
                else if (segment.vibe && !this.vibeTransition.started) this.vibeTransition.add(segment.vibe, 0);
                else if (segment.vibe) segment.pendingVibe = true;

                if (segment.laneData) this.onLaneData(segment.laneData)
                this.lastVibeZ = segment.z
            }
            if (segment.do) {
                segment.do.forEach((obj) => {
                    if (this.doFacs[obj.f]) {
                        const z = focusPos.z + zOffset + (drawDistance - (drawDistance - (segments.length - relIndex))) * this.segmentLength;
                        this.dLayers.add(this.doFacs[obj.f](obj, z, this));
                    }
                });
            }
            this.segments.push(segment);
        }
    }
    reset() {
        this.firstSegmentIndex = 0;
        this.segments.length = 0
        this.syncSeg()
        this.road.reset(this.segmentGen.road)
        this.vibeTransition.addImmediate(this.segmentGen.vibe, 0)
        this.lprlx = null
        if (this.prlx) {
            this.prlx.reset()
            this.prlx = null
        }
    }
    
    updateState(dt) {
        // First, update the internal transition state.
        this._updateCameraTransition(dt);
        // Then, call the external rendering logic, which will use getCameraFocusPosition().
        updateState(this, fogFactorCache, this.viewport, dt)
    }

    update(dt, t) {
        Node.updateRecursively(this.dLayers, dt, t);
        this.vibeTransition.update(dt);
        this.dLayers.update(dt)
    }
}
export default World;