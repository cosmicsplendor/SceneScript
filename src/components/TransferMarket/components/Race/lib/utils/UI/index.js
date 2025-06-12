class UI {
    x=0
    y=0
    static query(q, root, props) {
        return new UI(null, q, root, props)
    }
    static create(el) {
        return new UI(document.createElement(el))
    }
    _bounds = {}
    static dims(el, f=1) {
        const rect = el.domNode.getBoundingClientRect()
        el._bounds.x = 0
        el._bounds.y = 0
        el._bounds.width = rect.width * f
        el._bounds.height = rect.height * f
        return el._bounds
    }
    static bounds(el, f=1) {
        const rect = el.domNode.getBoundingClientRect()
        el._bounds.x = rect.x
        el._bounds.y = rect.y
        el._bounds.width = rect.width*f
        el._bounds.height = rect.height*f
        return el._bounds
    }
    constructor(domNode, query, root = document, props) {
        /**
         * type props = {
         *   baseAlpha?: number
         * }
         */
        this.domNode = domNode || root.querySelector(query)
        if (!this.domNode) {
            throw new Error("one or more invalid constructor parameters")
        }
        if (!this.domNode.getBoundingClientRect) {
            return
        }
        if (typeof props === "object") {
            Object.assign(this, props)
        }
        this.x = 0
        this.y = 0
        if (!!domNode) { return }
        const { width, height } = this.domNode.getBoundingClientRect()
        this.width = width
        this.height = height
    }
    remove() {
        this.domNode.remove()
    }
    get(query, props) {
        return UI.query(query, this.domNode, props)
    }
    set opacity(val) {
        this.domNode.style.opacity = val
    }
    get opacity() {
        return parseFloat(this.domNode.style.opacity)
    }
    fadeOut() {
        this.opacity = 0
    }
    fadeIn(alpha=1) {
        this.opacity = alpha
    }
    show() {
        this.opacity = 0
        this.domNode.style.display = "block"
        setTimeout(() => {
            this.opacity = typeof this.baseAlpha === "number" ? this.baseAlpha: 1
        }, 0)
    }
    hide(timeout=0) {
        if (timeout === 0) {
            this.domNode.style.display = "none" // remove from layout
            return
        }
        this.opacity = 0
        setTimeout(() => {
            this.domNode.style.display = "none" // remove from layout
        }, timeout)
    }
    get classList() {
        return this.domNode.classList
    }
    set pos({ x, y }) {
        const dpr = window.devicePixelRatio
        if (x) { 
            this.x = x
            this.domNode.style.left = `${x}px`
        }
        if (y) {
            this.y = y
            this.domNode.style.top = `${y}px`
        }
    }
    set content(html) {
        this.domNode.innerHTML = html
    }
    clear() {
        this.content = ""
    }
    on(event, callback) {
        this.domNode.addEventListener(event, callback)
    }
    off(event, callback) {
        this.domNode.removeEventListener(event, callback)
    }
    add(el) {
        this.domNode.appendChild(el.domNode || el)
        return this
    }
}

export default UI