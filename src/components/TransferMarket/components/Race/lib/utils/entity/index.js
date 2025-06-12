export { default as detectShape, shapes } from "./detectShape" 

export const  getReusableBounds = (() => {
    const bounds = [0, 0].map(() => ({ x: 0, y: 0, width: 0, height: 0 }))
    let lastAccessedIdx = 0
    return (x, y, width, height) => {
        lastAccessedIdx = lastAccessedIdx === 0 ? 1: 0
        bounds[lastAccessedIdx].x = x
        bounds[lastAccessedIdx].y = y
        bounds[lastAccessedIdx].width = width
        bounds[lastAccessedIdx].height = height
        return bounds[lastAccessedIdx]
    }
})()

export const  getReusableCoords = (() => {
    const coords = { x: 0, y: 0 }
    return (x, y) => {
        coords.x = x
        coords.y = y
        return coords
    }
})()

export const getReusableCirc =(() => {
    const bounds = [0, 0].map(() => ({ x: 0, y: 0, radius: 0 }))
    let lastAccessedIdx = 0
    return (x, y, radius) => {
        lastAccessedIdx = lastAccessedIdx === 0 ? 1: 0
        bounds[lastAccessedIdx].x = x
        bounds[lastAccessedIdx].y = y
        bounds[lastAccessedIdx].radius = radius
        return bounds[lastAccessedIdx]
    }
})()

export function  calcCenter(entity) {
    const { hitbox, hitcirc } = entity

    if (entity.hitbox) {
        return { x: hitbox.x + hitbox.width / 2, y: hitbox.y + hitbox.height / 2 }
    }

    if (entity.hitcirc) {
        return { x: hitcirc.x, y: hitcirc.y }
    }

    return { x: entity.width / 2, y: entity.height / 2 }
}

const sc = { // stack calcs
    il: c => { // inside-left
        return c.x
    },
    ol: (c, e) => { // outside-left
        return c.x - e.width
    },
    ir: (c, e) => { // inside-right
        return c.x + (c.width - e.width)
    },
    or: c => { // outiside-right
        return c.x + c.width
    },
    hc: (c, e) => { // horizontal center
        return c.x + (c.width - e.width) / 2
    },
    it: c => { // inside-top
        // c --> container bounds; e --> entity bounds
        return c.y
    },
    ot: (c, e) => { // outside-top
        return c.y - e.height
    },
    ib: (c, e )=> { // inside-bottom
        return c.y + (c.height - e.height)
    },
    ob: c => { // outiside-bottom
        return c.y + c.height
    },
    vc: (c, e) => { // vertical center
        return c.y + (c.height - e.height) / 2
    }
}

export function calcAligned(c, e, x, y, mX=0, mY=0) {
    const pos = getReusableCoords(mX, mY)
    switch (x) {
        case "left":
            pos.x += sc.il(c, e)
        break
        case "center":
            pos.x += sc.hc(c, e)
        break
        case "right":
            pos.x += sc.ir(c, e)
        break
        default:
            throw new Error(`Invalid x-alignment parameter: ${x}`)
    }
    switch(y) {
        case "top":
            pos.y += sc.it(c, e)
        break
        case "center":
            pos.y += sc.vc(c, e)
        break
        case "bottom":
            pos.y += sc.ib(c, e)
        break
        default:
            throw new Error(`Invalid y-alignment parameter: ${y}`)
    }
    return pos
}

export function calcCentered(c, e) {
    return {
        x: sc.hc(c, e),
        y: sc.vc(c, e)
    }
}

export function calcStacked(e1, e2, dir, mX=0, mY=0) {
    const pos = getReusableCoords(mX, mY)
    switch(dir) {
        case "top-start":
            pos.x += sc.il(e1, e2)
            pos.y += sc.ot(e1, e2)
        break
        case "top":
            pos.x += sc.hc(e1, e2)
            pos.y += sc.ot(e1, e2)
        break
        case "top-end":
            pos.x += sc.ir(e1, e2)
            pos.y += sc.ot(e1, e2)
        break
        case "right-start":
            pos.x += sc.or(e1, e2)
            pos.y += sc.it(e1, e2)
        break
        case "right":
            pos.x += sc.or(e1, e2)
            pos.y += sc.vc(e1, e2)
        break
        case "right-end":
            pos.x += sc.or(e1, e2)
            pos.y += sc.ib(e1, e2)
        break
        case "bottom-start":
            pos.x += sc.il(e1, e2)
            pos.y += sc.ob(e1, e2)
        break
        case "bottom":
            pos.x += sc.hc(e1, e2)
            pos.y += sc.ob(e1, e2)
        break
        case "bottom-end":
            pos.x += sc.ir(e1, e2)
            pos.y += sc.ob(e1, e2)
        break
        case "left-start":
            pos.x += sc.ol(e1, e2)
            pos.y += sc.it(e1, e2)
        break
        case "left":
            pos.x += sc.ol(e1, e2)
            pos.y += sc.vc(e1, e2)
        break
        case "left-end":
            pos.x += sc.ol(e1, e2)
            pos.y += sc.ib(e1, e2)
        break
        default:
            throw new Error(`Invalid stacking direction: ${dir}`)
    }
    return pos
}

export const calcComposite = entities => {
    const { x, y, width, height } = entities[0]
    const bounds = getReusableBounds(x, y, width, height )
    for (let i = 1; i < entities.length; i++) {
        const ent = entities[i]
        const rEdgX = Math.max(bounds.x + bounds.width, ent.x + ent.width)
        const bEdgY = Math.max(bounds.y + bounds.height, ent.y + ent.height)

        bounds.x = Math.min(bounds.x, ent.x)
        bounds.y = Math.min(bounds.y, ent.y)
        bounds.width = rEdgX - bounds.x
        bounds.height = bEdgY - bounds.y
    }
    return bounds
}

export const combine = (a, b, dir) => {
    switch (dir) {
        case "x":
            return {
                width: a.width + b.width,
                height: Math.max(a.height, b.height)
            }
        case "y":
            return {
                width: Math.max(a.width, b.width),
                height: Math.max(a.height, b.height)
            }
        default:
            throw new Error(`Invalid combine direction: ${dir}`)
    }
}

export function rectBounds(ent) {
    const globalPos = getGlobalPos(ent)
    if (ent.hitbox) {
        return getReusableBounds(globalPos.x + ent.hitbox.x, globalPos.y + ent.hitbox.y, ent.hitbox.width, ent.hitbox.height)
    }
    return getReusableBounds(globalPos.x, globalPos.y, ent.width, ent.height)
}

export function getHitbox(ent) {
    if (ent.hitbox) {
        return ent.hitbox
    }
    return getReusableBounds(0, 0, ent.width, ent.height)
}

export function circBounds(ent) {
    const globalPos = getGlobalPos(ent)
    return getReusableCirc(globalPos.x + ent.hitCirc.x, globalPos.y + ent.hitCirc.y, ent.hitCirc.radius)
}

export function setLocalPosX(node, globalPosX) {
    let parent = node.parent
    let localPosX
    while (parent) {
        localPosX = globalPosX - parent.pos.x
        parent = parent.parent
    }
    node.pos.x = localPosX
}
export function setLocalPosY(node, globalPosY) {
    let parent = node.parent
    let localPosY
    while (parent) {
        localPosY = globalPosY - parent.pos.y
        parent = parent.parent
    }
    node.pos.y = localPosY
}
export function getGlobalPos(node) {
    let x = node.pos.x
    let y = node.pos.y
    while (!!node.parent) {
        node = node.parent
        x += node.pos.x
        y += node.pos.y
    }
    return getReusableCoords(x, y)
}

const getWidth = node => !!node.w ? node.w: node.width
const getHeight = node => !!node.h ? node.h: node.height

export function compositeDims(node) {
    if (!node.children) {
        return { width: 0, height: 0 }
    }
    const fChild = node.children[0]
    const initialBounds = {
        minX: fChild.pos.x,
        minY: fChild.pos.y,
        maxX: fChild.pos.x + getWidth(fChild),
        maxY: fChild.pos.y + getHeight(fChild)
    }
    const bounds = node.children.reduce((acc, child) => {
        return {
            minX: Math.min(acc.minX, child.pos.x),
            minY: Math.min(acc.minY, child.pos.y),
            maxX: Math.max(acc.maxX, child.pos.x + getWidth(child)),
            maxY: Math.max(acc.maxY, child.pos.y + getHeight(child))
        }
    }, initialBounds)
    return ({
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY
    })
}