import DAnim from "../lib/entities/DAnim"
import { rand, randf } from "../lib/utils/math"

class Gull extends DAnim {
    scale = 8
    constructor(params, z, world) {
        super({
            ...params,
            framePrefix: "gull",
            startFrame: 1,
            frameCount: 2,
            frameStep: 0.25,  // Longer animation duration
            fadeSpeed: 0.2,   // Slow fade out
            yVel: rand(600, 450),  // Slower vertical movement with range
            xVel: params.x > 0 ? -randf(4, 6) : randf(4, 6),  // Slower horizontal movement with range
            active: false,     // Activates right away
            scale: 1.5,
            x: params.x,
            z: z,
            world,
            yOffset: -400
        })
        this.subject = world.subject
    }
    reset(params, z) {
        this.yVel = rand(600, 450)  // Slower vertical movement with range
        this.xVel = params.x > 0 ? -randf(4, 6) : randf(4, 6)  // Slower horizontal movement with range
        this.active = false  // Activates right away
        this.x = params.x
        this.z = z
        this.yOffset = -400
        this.alpha = 1
    }
    update(dt, t) {
        if (this.z - this.subject.z < 9000) {
            this.active = true
        }
        
        super.update(dt, t)
    }
}

export default Gull