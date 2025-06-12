const { DynamicObject } = require("../lib/entities/DynamicObjects")
const { randf } = require("../lib/utils/math")
class Blimp extends DynamicObject {
    scale = 6
    constructor(params, z, world) {
        const flip = params.x > 0
        super({
            frame: "blimp1",
            world,
            x: params.x,
            z: z,
            flip
        })
        
        this.xVel =  1 * (flip ? -1 : 1)
        this.yVel = randf(100, 1)
        this.subject = world.subject
        this.yOffset = 1000
        this.alpha = 0
    }

    update(dt, t) {
        if (this.alpha < 1) {
            this.alpha += dt * 0.5
        }
        this.x += this.xVel * dt
        this.z -= 120 * dt
        this.yOffset += this.yVel * dt
        super.update(dt, t)
    }
}

module.exports = Blimp
