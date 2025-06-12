import { clamp } from "../utils/math"

class Parallax {
  xRange = null
  yRange = null
  o = null
  z = 0 // z index
  x = 0
  y = 0
  alpha = 0
  delay = 1

  constructor(config) {
    Object.assign(this, config)
    this.exitFreq = this.exitDur ? 1 / this.exitDur : 1
    this.delay0 = 1.5

    // Save a deep-ish copy of the initial objects so we can completely reset later.
    // (Assumes the object properties are primitives.)
    this._initialObjects = this.o.map(ob => ({ ...ob }))

    // Set up each object with initial computed values.
    this.o.forEach(ob => {
      ob.x0 = ob.x || 0
      // Notice: the original code inverts y. If that’s intended, we do it here.
      ob.y = -ob.y
      ob.y0 = ob.y || 0
      ob.alpha = 0
    })
  }

  /**
   * Reset the parallax layer completely – instance variables and each object – to its original state.
   * Optionally add extra delay.
   */
  reset(delay = 0) {
    // Reset instance properties
    this.alpha = 0
    this.x = 0
    this.y = 0
    this.delay = this.delay0 + delay

    // Reinitialize the objects array completely from the saved original state.
    // This guarantees that any modifications done in update/exit are wiped clean.
    this.o = this._initialObjects.map(origOb => {
      const newOb = { ...origOb } // fresh copy
      newOb.x0 = newOb.x || 0
      newOb.y = -newOb.y
      newOb.y0 = newOb.y || 0
      newOb.alpha = 0
      return newOb
    })
  }

  update(dt, dx, dy = 0, ORIGIN_Y, viewport) {
    if (this.delay > 0) {
      this.delay -= dt
      return
    }
    if (this.alpha < 1) {
      const ease = 0.5 * (1 - Math.cos(Math.PI * this.alpha)) // trigonometric ease in/out
      this.alpha = Math.min(1, this.alpha + dt * (0.25 - ease * 0.2))
    }
    const [xMin, xMax] = this.xRange
    const originX = viewport.sWidth * 0.5
    this.x = clamp(xMin, xMax, this.x + clamp(-0.125, 0.125, dx * this.z))
    const [yMin, yMax] = this.yRange
    const originY = viewport.sHeight * ORIGIN_Y
    const slide = this.curtentry ? (1 - this.alpha) * this.curtentry : 0
    this.y = clamp(yMin, yMax, clamp(-0.25, 0.25, this.y + dy * this.z * 0.1))
    this.o.forEach(ob => {
      ob.x = ob.x0 + this.x + originX
      ob.y = ob.y0 + this.y + originY + slide
      ob.alpha = this.alpha
    })
  }

  exit(dt) {
    const ease = this.alpha * this.alpha * this.exitFreq // cubic easing out
    if (this.alpha > 0) {
      this.alpha -= dt * (0.5 - ease * 0.4)
    }
    this.o.forEach(ob => {
      ob.alpha = this.alpha
      if (!this.curtexit) return
      ob.y += dt * this.curtexit * ease * ease
    })
  }
}

export default Parallax