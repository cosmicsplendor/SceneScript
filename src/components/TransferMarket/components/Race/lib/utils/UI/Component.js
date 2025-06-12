import config from "@config"
class UIComponent {
    constructor(root, props={}) {
        this.root = root
        this.elements = {}
        Object.assign(this, props)
        this.setup()
        this.bindEvents()
        this.realign(config.viewport)
    }
    setup() {
        this.root.content = this.render()
        this.cacheElements()
    }
    bindEvents() {
        config.viewport.on("change", this.realign.bind(this))
    }
    cacheElements() {
        // Override to cache UI elements
    }
    render() {
        // Override to return HTML string
    }
    realign(viewport) {
        // Override to handle positioning
    }
    destroy() {
        config.viewport.off("change", this.realign)
        this.root.clear()
    }
}
export default UIComponent