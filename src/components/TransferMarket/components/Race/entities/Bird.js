import DAnim from "../lib/entities/DAnim"
import { rand, randf, skewedRand } from "../lib/utils/math";

class Bird extends DAnim {
    scale=4
    constructor(params, z, world) {
        const flip = Math.random() < 0.5
        super({
            startFrame: 0,
            framePrefix: "bird",
            frameCount: 6,
            frameStep: 0.075,
            fadeSpeed: 0.35,  // slow fade
            yVel: rand(300, 1200),
            xVel: randf(4, 10) * (flip ? -1 : 1),
            active: false,
            scale: params.s,
            x: params.x,
            z: z,
            world
        })
        this.flip = flip
        this.frame = "bird0"
        this.subject = world.subject
        this.prevSubjectX = this.subject.x
    }
    reset(params, z) {
        const flip = params.x > 0
        this.flip = flip
        this.yVel = rand(300, 400)
        this.xVel = randf(5, 7) * (flip ? -1 : 1)
        this.active = false
        this.x = params.x
        this.z = z
        this.alpha = 1
        this.yOffset = 0
        this.frame = "bird1"
        this.frameNum = 1
        this.nextIn = 0
    }
    update(dt, t) {
        // Calculate dx based on subject's movement
        const dz = this.z - this.subject.z
        if (dz < 3000 && dz > 50 && !this.active) {
            this.active = true
            // Calculate velocity transfer based on distance
            const t = Math.max(0, Math.min(1, (1500 - dz) / (1500 - 200)))
            const baseXVel = this.xVel
            this.xVel = baseXVel * (1 - t)
            this.yVel = this.yVel + Math.abs(baseXVel) * t
        }

        super.update(dt, t)
    }
}

export default Bird