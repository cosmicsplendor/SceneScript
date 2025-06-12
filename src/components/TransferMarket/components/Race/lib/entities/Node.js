class Node {
    static __entities = { }
    static addRef(id, node) {
        this.__entities[id] = node
    }
    static removeRef(id) { 
        this.__entities[id] = null
    }
    static get(id) {
        return this.__entities[id]
    }
    static cleanupRecursively(node) {
        if (node.onRemove) { node.onRemove() }
        if (node.id) { this.removeRef(node.id) }
        if (!node.children) { return }
        for (let childNode of node.children) {
            Node.cleanupRecursively(childNode)
        }
    }
    static updateRecursively(node, dt, t) {
        node.update && node.update(dt, t)
        if (!node.children) { return }
        if (node.children.length === 0) return
        for (let i = 0, len = node.children.length; i < len; i++) {
            if (!node.children[i]) return
            Node.updateRecursively(node.children[i], dt, t)
        }
    }
    static removeChild(parentNode, childNode, cleanup = true) {
        if (!parentNode) { return }
        parentNode.children = parentNode.children.filter(n => n !== childNode)
        childNode.parent = null
        if (cleanup) this.cleanupRecursively(childNode)
    }
    constructor({ pos = { x: 0, y: 0 }, rotation, scale,  anchor, pivot, id, alpha } = {}) {
        this.pos = pos
        this._visible = true
        scale && (this.scale = scale)
        rotation && (this.rotation = rotation)
        anchor && (this.anchor = anchor)
        pivot && (this.pivot = pivot)
        alpha && (this.alpha = alpha)
        if (Boolean(id)) {
            this.id = id
            Node.addRef(id, this)
        }
    }
    add(childNode) { // presence or absense of children field indicates whether a node is a leaf node
        childNode.parent = this
        if (this.children) {
            this.children.push(childNode)
            return
        }
        this.children = [ childNode ]
    }
    remove(cleanup) {
        Node.removeChild(this.parent, this, cleanup)
    }
}

export default Node