import Observable from "../utils/Observable"

class Viewport extends Observable {
    x = 0
    y = 0
    _dom = { x: 0, y: 0, width: 0, height: 0 }
    dom() {
        return this
    }
    constructor({ width, height, sWidth = width, sHeight = height }) {
        super(["change"], { width, height, sWidth, sHeight})
        this.invWidth = 1 / this.sWidth
        this.invHeight = 1 / this.sHeight
    }
    updateViewport({ width, height, sWidth = width, sHeight = height }) {
        Object.assign(this, { width, height, sWidth, sHeight })
        this.invWidth = 1 / this.sWidth
        this.invHeight = 1 / this.sHeight
        this.emit("change", this)
    }
}

export default Viewport