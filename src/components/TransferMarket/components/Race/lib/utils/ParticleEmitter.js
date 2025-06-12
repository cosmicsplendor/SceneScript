import { Node } from "@lib"
import TexRegion from "@lib/entities/TexRegion"
import { rand, randf, pickOne, easingFns } from "@utils/math"
import Movement from "@components/Movement"

class Particle extends TexRegion {
    constructor({ imgId, metaId, frame, pos, lifetime, velX=0, velY=0, accX, accY, alpha, alphaDecayFn, rotVel, loop }) {
        super({ imgId, metaId, frame, pos })
        this.lifetime = lifetime
        this.velX0 = velX
        this.velY0 = velY
        this.alpha0 = alpha
        this.pos0 = { ...pos }
        this.alpha = alpha
        this.alphaDecayFn = alphaDecayFn
        this.elapsed = 0
        this.loop = loop
        if (rotVel) {
            this.rotVel = rotVel
            this.rotation = 0
            this.anchor = {
                x: this.w / 2,
                y: this.h / 2
            }
        }
        Movement.makeMovable(this, { velX, velY, accX, accY })
    }
    _reset() {
        this.elapsed = 0
        this.velX = this.velX0
        this.velY = this.velY0
        this.alpha = this.alpha0
        this.pos.x = this.pos0.x
        this.pos.y = this.pos0.y
        if (this.rotVel) {
            this.rotation = 0
        }
    }
    update(dt) {
        if (this.elapsed > this.lifetime) {
            if (!this.loop) { return }
            this._reset()
        }
        this.elapsed += dt
        Movement.update(this, dt)
        if (this.rotVel) {
            this.rotation += this.rotVel * dt
        }
        if (this.alphaDecayFn) {
            this.alpha = Math.max(0.01, 1 - easingFns[this.alphaDecayFn](this.elapsed / this.lifetime))
        }
    }
}



class ParticleEmitter extends Node {
    static feed(emitter, i, dt) {
        for (let j = 0; j < i; j++) {
            for (let k = 0, l = emitter.children.length; k < l; k++) {
                emitter.children[k].update(dt)
            }
        }
    }
    constructor({ size, blendMode, loop = false, randomDistribution = true, metaId, imgId, params, ...nodeProps }) {
        super({ ...nodeProps })
        this.blendMode = blendMode
        let paramIndices
        if (randomDistribution) {
            paramIndices = params.reduce((distribution, param, index) => {
                return distribution.concat(Array(param.weight || 1).fill(index))
            },[])
        } else {
            const sumOfWeights = params.reduce((prevTotal, param) => {
                return prevTotal + (param.weight || 1)
            }, 0)
            paramIndices = params.reduce((prevIndices, param, index) => {
                return prevIndices.concat(Array(Math.round(size * (param.weight || 1) / sumOfWeights)).fill(index))
            }, [])
        }
        for (let i = 0; i < size; i++) {
            const index = randomDistribution ? pickOne(paramIndices): paramIndices[i]
            const param = params[index]
            const deserializedParam = {
                metaId,
                imgId,
                frame: param.frame,
                pos: {
                    x: Array.isArray(param.offsetX) ? rand(param.offsetX[0], param.offsetX[1]): param.offsetX || 0,
                    y: Array.isArray(param.offsetY) ? rand(param.offsetY[0], param.offsetY[1]): param.offsetY || 0,
                },
                lifetime: Array.isArray(param.lifetime) ? randf(param.lifetime[0], param.lifetime[1]): param.lifetime,
                velX: Array.isArray(param.velX) ? rand(param.velX[0], param.velX[1]): param.velX,
                velY: Array.isArray(param.velY) ? rand(param.velY[0], param.velY[1]): param.velY,
                accX: Array.isArray(param.accX) ? rand(param.accX[0], param.accX[1]): param.accX,
                accY: Array.isArray(param.accY) ? rand(param.accY[0], param.accY[1]): param.accY,
                alpha: Array.isArray(param.alpha) ? randf(param.alpha[0], param.alpha[1]): param.alpha,
                rotVel:  Array.isArray(param.rotVel) ? randf(param.rotVel[0], param.rotVel[1]): param.rotVel,
                alphaDecayFn: param.alphaDecayFn,
                loop
            }
            this.add(new Particle(deserializedParam))
        }
        if (!loop) {
            this.lifetime = params.reduce((lifetime, param) => { // max possible lifetime of all particles
                return Math.max(lifetime, param.lifetime[1])
            }, 0)
            this.elapsed = 0
            this._reset = function() {
                this.remove(false)
                this.onDead && this.onDead()
                this.elapsed = 0
                for (let i = this.children.length - 1; i > -1; i--) {
                    this.children[i]._reset()
                }
            }
            this.update = function(dt) {
                this.elapsed += dt
                if (this.elapsed > this.lifetime) {
                    this._reset()
                }
            }
        }
    }
}

export default ParticleEmitter