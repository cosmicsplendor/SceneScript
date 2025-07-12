const { DynamicObject } = require("../lib/index")

class WindBlade extends DynamicObject {
    scale=12
    constructor(params, z, world) {
        super({
            x: params.x + 0.022,
            z: z,
            world
        })
        this.yOffset = 300
        this.rotation =Math.random() * Math.PI
        this.frame = "wind_blade"
    }
    update(dt) {
       this.rotation += dt * 2
       super.update(dt)
    }
    reset(params, z) {
        this.rotation =Math.random() * Math.PI
        this.x = params.x + 0.022
        this.z = z
    }
}

module.exports = WindBlade
