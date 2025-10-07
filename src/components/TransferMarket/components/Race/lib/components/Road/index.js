import Polygons from "../../entities/Polygons";
import { decomposeColor } from "../../utils/math";
import { createNoise2D } from 'simplex-noise'
const noise2d = createNoise2D()
import State from "./State"
const xIntersect = (x1, y1, x2, y2, y0) => {
    return x1 + (y0 - y1) * (x2 - x1) / (y2 - y1)
}
function normalizeConfig(config) {
    const normalized = { ...config };
    if (config.sidewalk) {
        normalized.leftSidewalk = normalized.rightSidewalk = config.sidewalk;
    }
    if (config.roadside) {
        normalized.leftRoadside = normalized.rightRoadside = config.roadside;
    }
    return normalized;
}

class StateCache {
    cache = {}
    get(config) {
        if (this.cache[config.name]) return this.cache[config.name]
        this.cache[config.name] = new State(normalizeConfig(config))
        return this.cache[config.name]
    }
}
const SPLASH_COLOR = "#e4e3e3"
const swWin = 10 // state watch window
class Road extends Polygons {
    watchedState = null // expecting the state to switch to over next few frames
    delta = 0
    constructor(config, viewport) {
        super()
        this.viewport = viewport
        this.splashColor = decomposeColor(SPLASH_COLOR);
        this.stateCache = new StateCache()
        this.state = this.stateCache.get(config)
    }
    syncState() {
        const newConfig = this.data[5]
        if (newConfig) {
            this.state = this.stateCache.get(newConfig)
            this.watchedState = null
        } else if (this.watchedState) {
            let missed = true
            for (let i = 0; i < swWin; i++) { // checking next swWin segments for data being watched for
                if (this.data[(i + 2) * 6 - 1]) {
                    missed = false
                    break
                }
            }
            if (missed) {
                this.state = this.watchedState
                this.watchedState = null
            }
        } else {
            for (let i = 0; i < swWin; i++) { // checking next swWin segments for data being watched for
                if (this.data[(i + 2) * 6 - 1]) {
                    this.watchedState = this.stateCache.get(this.data[(i + 2) * 6 - 1])
                }
            }
        }
    }
    reset(config) {
        this.watchedState = null
        this.state = this.stateCache.get(config)
    }
    render(ren) {
        const renderer = ren.quadRenderer
        this.delta += 0.01
        const renderData = this.data;
        const { sWidth: width, sHeight: height } = this.viewport
        this.syncState()
        let { leftBorder, rightBorder, laneMarkings, components, leftEdge, rightEdge, config } = this.state
        let raiseEdge = config.roadEdge?.raise
        let edgeStripe = config.roadEdge?.stripe

        let p1 = 0
        // cull off screen portion of  the quad
        while (renderData[p1 + 1] > height) {
            const x1 = renderData[p1]
            const y1 = renderData[p1 + 1]
            const w1 = renderData[p1 + 2]
            const x2 = renderData[p1 + 6]
            const y2 = renderData[p1 + 6 + 1]
            const w2 = renderData[p1 + 6 + 2]
            const xProj = xIntersect(x1, y1, x2, y2, height)
            const wProj = xProj - xIntersect(x1 - w1, y1, x2 - w2, y2, height)
            renderData[p1] = xProj
            renderData[p1 + 1] = height
            renderData[p1 + 2] = wProj
            p1 += 6;
        }
        for (let p1 = 0, p2 = 6; p1 < renderData.length - 6 && p2 < renderData.length; p1 += 6, p2 += 6) {
            const y1 = renderData[p1 + 1];
            const y2 = renderData[p2 + 1];
            const x1 = renderData[p1];
            const x2 = renderData[p2];
            const w1 = renderData[p1 + 2];
            const w2 = renderData[p2 + 2];
            // if (y1 > 1920) console.log({ y1, y2, x1, x2, w1, w2 })
            const colIdx = renderData[p1 + 3];
            const fogF = renderData[p1 + 4];
            const newConfig = renderData[p1 + 5];
            const normSqrt = 1 - p1 / renderData.length
            const norm = normSqrt * normSqrt
            if (newConfig) {
                const state = this.stateCache.get(newConfig)
                leftBorder = state.leftBorder
                rightBorder = state.rightBorder
                laneMarkings = state.laneMarkings
                components = state.components
                leftEdge = state.leftEdge
                rightEdge = state.rightEdge
                raiseEdge = newConfig.roadEdge?.raise
                edgeStripe = newConfig.roadEdge?.stripe
            }
            if (y1 === y2) {
                continue
            }
            components.forEach(component => {
                if (component === leftEdge && raiseEdge) {
                    // Render raised left edge
                    renderer.drawQuad(x1 + w1 * component.left, y1, x1 + w1 * component.right, y1, x2 + w2 * component.right, y2, x2 + w2 * component.left, y2, edgeStripe ? component.colors[colIdx] : component.colors[0], fogF, component.light, component.lf * norm)
                    renderer.drawQuad(x1 + w1 * component.right, y1, x1 + w1 * component.right, y1 + w1 * 0.03, x2 + w2 * component.right, y2 + w2 * 0.03, x2 + w2 * component.right, y2, edgeStripe ? component.colors[colIdx] : component.colors[1], fogF, component.light, component.lf * norm)
                } else if (component === rightEdge && raiseEdge) {
                    // Render raised right edge
                    renderer.drawQuad(x1 + w1 * component.left, y1, x1 + w1 * component.right, y1, x2 + w2 * component.right, y2, x2 + w2 * component.left, y2, edgeStripe ? component.colors[colIdx] : component.colors[0], fogF, component.light, component.lf * norm)
                    renderer.drawQuad(x1 + w1 * component.left, y1, x1 + w1 * component.left, y1 + w1 * 0.03, x2 + w2 * component.left, y2 + w2 * 0.03, x2 + w2 * component.left, y2, edgeStripe ? component.colors[colIdx] : component.colors[1], fogF, component.light, component.lf * norm)
                } else {
                    renderer.drawQuad(x1 + w1 * component.left, y1, x1 + w1 * component.right, y1, x2 + w2 * component.right, y2, x2 + w2 * component.left, y2, component.colors[colIdx], fogF, component.light, component.lf * norm)
                }
            })
            // Calculate splash effect only if needed
            let borderStart = 0;
            let splash = 0;
            if (leftBorder.sea || rightBorder.sea) {
                borderStart = (noise2d(this.delta + (p1 / 500), 0) + 1) * 0.5;
                const amplitude = (noise2d(p1 / 1000, 0) + 1) * 0.3 + 1;
                const splashNoise = noise2d(0, this.delta);
                splash = splashNoise * amplitude;
            }

            // Left border
            const leftX = x1 + w1 * (leftBorder.start + (leftBorder.sea ? borderStart : 0));
            const leftX2 = x2 + w2 * (leftBorder.start + (leftBorder.sea ? borderStart : 0));
            renderer.drawQuad(leftX, y1, 0, y1, 0, y2, leftX2, y2, leftBorder.colors[colIdx], fogF, leftBorder.light, leftBorder.lf * norm);

            if (leftBorder.sea) {
                renderer.drawQuad(leftX, y1, leftX + w1 * splash, y1, leftX2 + w2 * splash, y2, leftX2, y2, this.splashColor, fogF * 0.8);
            }

            // Right border
            const rightX = x1 + w1 * (rightBorder.start - (rightBorder.sea ? borderStart : 0));
            const rightX2 = x2 + w2 * (rightBorder.start - (rightBorder.sea ? borderStart : 0));
            renderer.drawQuad(rightX, y1, width, y1, width, y2, rightX2, y2, rightBorder.colors[colIdx], fogF, rightBorder.light, rightBorder.lf * norm);

            if (rightBorder.sea) {
                renderer.drawQuad(rightX, y1, rightX + w1 * splash, y1, rightX2 + w2 * splash, y2, rightX2, y2, this.splashColor, fogF * 0.8);
            }

            if (colIdx == 0) continue;
            // laneMarkings.forEach(m => {
            //     renderer.drawQuad(x1 + w1 * m.left, y1, x1 + w1 * m.right, y1, x2 + w2 * m.right, y2, x2 + w2 * m.left, y2, m.color, fogF, m.light, m.lf * norm)
            // })
        }
    }
}

export default Road