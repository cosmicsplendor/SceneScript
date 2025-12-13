import * as types from "../../entities/types"
import TextureRenderer from "./TextureRenderer"
import QuadRenderer from "./QuadRenderer"
import { WEBGL } from "../apis"
import BackgroundTransition from "./BackgroundTransition"
class Webgl2Renderer {
    api = WEBGL
    TEX_BATCH = 1024
    QUAD_BATCH = 3000
    constructor({ canvas, scene, background = "#ffffff", clearColor = [0, 0, 0, 0], viewport }) {
        this.canvas = canvas
        this.scene = scene
        const gl = canvas.getContext("webgl2")
        this.gl = gl

        this.textureRenderer = new TextureRenderer(gl, this.TEX_BATCH)
        this.quadRenderer = new QuadRenderer(gl, this.QUAD_BATCH)
        this.bgTransition = new BackgroundTransition(this.canvas)
        this.clearColor = clearColor
        this.initViewport(viewport)
    }
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    resize({ sWidth, sHeight, width, height }) {
        this.canvas.setAttribute("width", sWidth);
        this.canvas.setAttribute("height", sHeight);
        this.gl.viewport(0, 0, sWidth, sHeight);
        this.textureRenderer.setViewport(sWidth, sHeight)
        this.quadRenderer.setViewport(sWidth, sHeight)
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
    initViewport(viewport) {
        this.resize(viewport);
        this.viewport = viewport
        viewport.on("change", this.resize.bind(this));
    }
    set clearColor(arr) {
        this.gl.clearColor(...arr);
    }
    changeBackground(newBackground, progress) {
        this.bgTransition.changeBackground(newBackground, progress ?? 1)
    }
    setTexatlas(img, meta) {
        this.textureRenderer.setImage(img)
        this.meta = meta
    }
    set fog(fog) {
        this.textureRenderer.fog = fog
        this.quadRenderer.fog = fog
    }
    renderWorld3D(node) {
        const { baseSegment, drawDistance, dLayers, segments, road, firstSegmentIndex, prlx, lprlx } = node
        const { viewport } = this
        // if (prlx && prlx.delay < 0 && Array.isArray(prlx.o)) {
        //     for (const ob of prlx.o) {
        //         const frame = this.meta[ob.f]
        //         console.log(ob.f)
        //         this.drawImage(frame.x, frame.y, frame.width, frame.height, ob.x - frame.width * 0.5, ob.y - frame.height, frame.width, frame.height, 0, ob.alpha)
        //     }
        // }
        if (lprlx && lprlx.alpha > 0 && Array.isArray(lprlx.o)) { // last parallax
            for (const ob of lprlx.o) {
                const frame = this.meta[ob.f]
                this.drawImage(frame.x, frame.y, frame.width, frame.height, ob.x - frame.width * 0.5, ob.y - frame.height, frame.width, frame.height, 0, ob.alpha)
            }
        }
        this.textureRenderer.flush()
        road.render(this)
        this.quadRenderer.flush()
        for (let i = drawDistance - 1; i > -1; i--) {
            const segmentIndex = (baseSegment - firstSegmentIndex) + i
            const dLayer = dLayers.segments[i]
            let currentNode = dLayer.o.head

            while (currentNode) {
                const frame = this.meta[currentNode.frame]
                // Only cull if the entire object is off screen

                if (currentNode.noCull === false && currentNode.destY < -currentNode.destH) {
                    currentNode = currentNode.__next
                    continue
                }
                if (currentNode.noCull === false && currentNode.destY > viewport.sHeight) {
                    currentNode = currentNode.__next
                    continue
                }

                if (currentNode.noCull) {
                    // don't cull
                } else if (currentNode.flip) {
                    if ((currentNode.destX) < 0 ||
                        currentNode.destX + currentNode.destW > viewport.sWidth) {
                        currentNode = currentNode.__next
                        continue
                    }
                } else {
                    if ((currentNode.destX + currentNode.destW) < 0 ||
                        currentNode.destX > viewport.sWidth) {
                        currentNode = currentNode.__next
                        continue
                    }
                }

                this.drawImage(
                    frame.x, frame.y,
                    frame.width, currentNode.srcH ? currentNode.srcH : frame.height,
                    currentNode.destX,
                    currentNode.destY,
                    currentNode.destW, currentNode.destH, currentNode.fogF, currentNode.alpha, currentNode.rotation, currentNode.anchor, currentNode.blendMode
                );
                currentNode = currentNode.__next
            }

            const segmentData = segments[segmentIndex]
            if (segmentData && Array.isArray(segmentData.o)) {
                for (const ob of segmentData.o) {
                    const frame = this.meta[ob.f]
                    if (!frame) console.log(ob.f, ob, this.meta)
                    if (ob.destX < -ob.destW || ob.destX > viewport.sWidth || ob.destY < -ob.destH) {
                        continue
                    }

                    if (ob.flip) {
                        this.drawImage(frame.x, frame.y, frame.width, ob.srcH, ob.destX + ob.destW, ob.destY, -ob.destW, ob.destH, ob.fogF, ob.alpha, ob.r, undefined, ob.blendMode)
                        continue
                    }
                    this.drawImage(frame.x, frame.y, frame.width, ob.srcH, ob.destX, ob.destY, ob.destW, ob.destH, ob.fogF, ob.alpha, ob.r, undefined, ob.blendMode)
                }
            }
        }
        this.textureRenderer.flush()
    }
    drawImage(sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, fogF, alpha, rotation, anchor, blendMode) {
        this.textureRenderer.drawImage(sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, fogF, alpha, rotation, anchor, blendMode)
    }
    renderChildren(node) {
        if (!node.children) return

    }
    renderRecursively(node = this.scene) {
        if (node === this.scene) { this.clear() }
        if (node.type === types.world3D) {
            this.renderWorld3D(node)
        }
        if (!node.children) {
            return
        }
        for (let i = 0, len = node.children.length; i < len; i++) {
            this.renderRecursively(node.children[i])
        }
    }
    flush() {
        this.textureRenderer.flush()
        this.quadRenderer.flush()
    }
}

export default Webgl2Renderer