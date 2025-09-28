import { decomposeColor } from "../../utils/math";

class VibeTransition {
    constructor(duration = 3, world) {
        this.duration = duration;
        this.targets = [];
        this.transitionTime = duration;
        this.currentTarget = null;
        this.decomposedColor = null; // Combined fog and fog color
        this.fogF = null;
        this.targetFogF = null;
        this.world = world;
        this.delay = 0;
    }
    get started() {
        return this.decomposedColor
    }
    add(vibe, delay = 0) {
        console.log("Adding vibe transition to", vibe.name, "with delay", delay);
        if (vibe === this.curVibe) return
        this.curVibe = vibe
        
        if (!this.decomposedColor) { // if running for the first time
            this.currentVibe = { ...vibe };
            this.decomposedColor = decomposeColor(vibe.fog);
            this.fogF = vibe.fogDensity ? vibe.fogDensity : 0;
            this.world.setVibe(vibe.sky, this.decomposedColor, this.fogF, 1);
            return;
        } else {
            // Replace any existing target with the new one
            this.targets = [{ vibe, delay }];
        }
    }
    addImmediate(vibe) {
        this.curVibe = vibe;
        this.decomposedColor = decomposeColor(vibe.fog);
        this.fogF = vibe.fogDensity ?? 0;
        this.targets = [];
        this.targetColor = null;
        this.transitionTime = this.duration;
        this.world.setVibe(vibe.sky, this.decomposedColor, this.fogF, 1);
    }
    update(dt) {
        if (this.targets.length === 0 && this.transitionTime >= this.duration) return;
       
        if (!this.targetColor) {
            const { vibe, delay } = this.targets.shift();
            this.transitionTime = 0;
            this.delay = delay;
            this.targetColor = decomposeColor(vibe.fog); // Assuming fog and fog are the same
            this.targetSky = vibe.sky
            this.targetFogF = vibe.fogDensity ?? 0;
        }
        if (this.delay > 0) {
            this.delay -= dt;
            return;
        }
   
        this.transitionTime = Math.min(this.transitionTime + dt, this.duration);
        const t = this.transitionTime / this.duration;
       
        // Ease in-out (Sine)
        const progress = 0.5 * (1 - Math.cos(Math.PI * t));
   
        // Interpolate color (both fog and fog)
        for (let i = 0; i < 3; i++) {
            this.decomposedColor[i] = this.decomposedColor[i] + (this.targetColor[i] - this.decomposedColor[i]) * progress;
        }
   
        // Interpolate fog density using fogF
        this.fogF = this.fogF + (this.targetFogF - this.fogF) * progress;
   
        this.world.setVibe(this.targetSky, this.decomposedColor, this.fogF, progress); // Pass decomposedColor for both fog and fog
   
        if (this.transitionTime >= this.duration) {
            this.targetColor = null;
        }
    }
}
export  default VibeTransition
