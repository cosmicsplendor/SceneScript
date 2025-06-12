const { DynamicObject } = require("../lib/entities/DynamicObjects")
class Obstacle extends DynamicObject {
    colOffset=60
    constructor(params, z, world) {
        super({
            frame: params.f,
            world,
            x: params.x,
            z: z
        })
        this.scale = params.s
        this.flip = params.flip
    }
    reset(params, z) {
        this.scale = params.s
        this.x = params.x
        this.z = z
        this.frame = params.f
        this.flip = params.flip
    }
}

module.exports = Obstacle