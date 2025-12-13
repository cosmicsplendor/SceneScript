import Observable from "../utils/Observable"
const ROAD_X_OFFSET = 0;

class DynamicObject {
    static SCALE = 125
    i = 0
    j = 0
    dy = 0
    lastNormY = 0
    static _meta = null
    static _viewport = null
    static injectAtlasMeta(val) {
        this._meta = val
    }
    static injectViewport(val) {
        this._viewport = val
    }
    constructor({ frame, world, x = 0, y = 0, z = 0, yOffset = 0, flip = false, scale = 1, alpha = 1, anchor, noCull = false, blendMode = 'Normal', mask }) {
        this.scale = scale
        this.world = world
        this.frame = frame
        this.yOffset = yOffset
        this.pos = { x: 0, y: 0 }
        // transform in world model
        this.x = x // normalized with road width
        this.y = y
        this.z = z
        this.noCull = noCull
        // linked list item props
        this.prev = null
        this.next = null
        this.alpha = alpha
        this.flip = flip
        if (anchor) {
            this.anchor = anchor
        }
        this.blendMode = blendMode
        if (mask) {
            this.maskFrame = mask.frame
            this.maskDest = mask.dest
        }
    }
    syncSegmentPos() {
        if (this.parent.segments[this.i]) {
            this.parent.segments[this.i].o.remove(this)
        }
        const segmentFloat = this.world.findSegmentFloat(this.z)
        const segment = Math.floor(segmentFloat)
        const i = segment - this.world.baseSegment
        this.i = i
        if (!this.parent.segments[this.i]) {
            this.i = null
            return
        }
        this.j = segmentFloat - segment // sort order relative to other objects in the same segment
        this.parent.segments[this.i].o.insert(this)
    }
    updateTransforms() {
        const { roadWidth, lastZOffset, yScale, cameraDepth, ORIGIN_Y, subject } = this.world;
        const { _viewport: viewport } = DynamicObject;

        const focusPos = this.world.getCameraFocusPosition();

        const { x, y, z } = this;
        const { clipY, xOffset = 0, fogF } = this.parent.segments[this.i];
        this.fogF = this.noFog ? 0 : fogF;
        let cameraX;

        cameraX = xOffset + ((x - focusPos.x) * roadWidth * 2 * viewport.invWidth);

        const cameraY = (y - this.world.y) * yScale * viewport.invHeight;

        const cameraZ = z - (focusPos.z + lastZOffset);

        this._visible = cameraZ > 0;
        if (!this._visible) return;
        const scalingFactor = cameraDepth / cameraZ;

        const projectionX = scalingFactor * cameraX;
        const projectionY = scalingFactor * cameraY;

        // Compute screen-space coordinates
        // CHANGED: Added ROAD_X_OFFSET to the final screenX calculation.
        const screenX = (1 + projectionX) * viewport.sWidth * 0.5 + ROAD_X_OFFSET;
        const screenY = (1 - projectionY) * viewport.sHeight * ORIGIN_Y;

        // Get the texture frame and scaling
        const frame = DynamicObject._meta[this.frame];
        const scale = this.scale ? this.scale * DynamicObject.SCALE : DynamicObject.SCALE;
        const sx = this.scaleX || 1;
        const scaleX = scalingFactor * scale * sx;
        const scaleY = scalingFactor * scale;
        if (!frame) alert(this.frame);
        // Compute the destination width and height
        const destW = frame.width * scaleX;
        const destH = frame.height * scaleY;

        // Compute the X position (centered regardless of flip)
        this.destX = screenX + destW * (this.flip ? 0.5 : -0.5);
        this.destY = screenY - destH;

        // Compute source clipping if needed
        this.srcH = Math.max(clipY < screenY ? frame.height - (screenY - clipY) / scaleY : frame.height, 0);
        this.destH = this.srcH * scaleY;
        this.destW = this.flip ? -destW : destW;

        // for collision detection
        this.pos.x = screenX - destW * 0.5;
        this.pos.y = this.destY;
        this.width = destW;
        this.height = this.destH;
    }

    syncY() {
        const { baseSegment, segments, firstSegmentIndex, segmentLength } = this.world
        const idx = baseSegment - firstSegmentIndex + this.i
        if (!segments[idx] || !segments[idx + 1]) {
            return
        }
        const y1 = segments[idx].h
        const y2 = segments[idx + 1].h
        this.y = y1 + (y2 - y1) * this.j
        this.dy = this.y - this.lastNormY
        this.lastNormY = this.y
        if (this.yOffset) {
            this.y += this.yOffset
            this.world.setYDir(this, y1, idx * segmentLength, this.y, (idx + 1) * segmentLength)
        } else {
            this.world.setYDir(this, y1, idx * segmentLength, y2, (idx + 1) * segmentLength)
        }
    }
    update() {
        /**
         * in the inherited class first perform the updates in world space and call super.update
         * it's capable of handling frame changes!
         */
        if (this.removed || this.toRemove) return
        this.syncSegmentPos()
        if (this.i === null) {
            return
        }
        this.syncY()
        this.updateTransforms()

    }
}

class DynamicObjects extends Observable {
    temp = []
    constructor(world) {
        super([], {
            world, segments: Array.from({ length: world.drawDistance }, (_, i) => ({ o: new NodeList(), clipY: 0 })), children: []
        })
    }
    add(child) {
        this.children.push(child)
        child.parent = this
    }
    remove(child) {
        if (child) {
            child.toRemove = true // remove in the next frame
        }
    }
    removeAll() {
        this.children.forEach(child => {
            if (child.semp) return
            child.toRemove = true
        })
    }
    removeEntry() {
        this.temp.length = 0
        this.children.forEach((child) => {
            if (!child.semp && (child.z < this.world.subject.z + this.world.zOffset || child.toRemove)) {
                child.removed = true
                if (this.segments[child.i]) {
                    this.segments[child.i].o.remove(child)
                }
                return

            }
            this.temp.push(child)
        })
        const oldArray = this.children
        this.children = this.temp
        this.temp = oldArray
        // this.temp.length = 0 - don't do this, because this is cached by renderer and supposed to be intact throughout this frame
    }
    update() {
        this.removeEntry()
    }
}

class NodeList {
    constructor() {
        this.head = null
        this.tail = null
    }
    insert(node) {
        // enforce state coherence
        if (this.head && !this.tail) {
            let current = this.head;

            while (current.__next) {
                current = current.__next;
            }
            this.tail = current;
        }

        if (!this.head) {
            this.head = this.tail = node
            return
        }
        if (node.j >= this.head.j) {
            node.__next = this.head
            this.head.__prev = node
            this.head = node
            return
        }
        if (node.j <= this.tail?.j) {
            node.__prev = this.tail
            this.tail.__next = node
            this.tail = node
            return
        }

        let current = this.head;

        while (current && node.j < current.j) {
            const prev = current
            current = current.__next
            if (!current) {
                current = prev
                break // This break seems a bit odd, let's keep it for now but investigate if logic is correct
            }
        }
        node.__next = current
        node.__prev = current.__prev
        if (current.__prev) current.__prev.__next = node
        current.__prev = node
    }
    remove(node) {
        if (node.__prev) {
            node.__prev.__next = node.__next
        } else {
            this.head = node.__next
            if (this.head) {
                this.head.__prev = null
            }
        }
        if (node.__next) {
            node.__next.__prev = node.__prev
        } else {
            this.tail = node.__prev
            if (this.tail) {
                this.tail.__next = null
            } else {
                this.head = null
            }
        }
        node.__next = node.__prev = null
    }
}
export {
    DynamicObject,
    DynamicObjects
}
export default DynamicObjects
