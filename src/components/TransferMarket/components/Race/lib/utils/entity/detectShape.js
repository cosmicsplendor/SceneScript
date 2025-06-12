export const shapes = Object.freeze({
    RECT: "rectangle",
    CIRC: "circle",
    PLANK: "plank" // inclined-plane
})
export default entity => {
    const shape = entity.hitCirc ? shapes.CIRC: shapes.RECT
    if (shape === shapes.RECT && !entity.hitbox && !entity.width & !entity.height) {
        throw new Error(`Unable to determine entity shape: \n${JSON.stringify(entity, null, 3)}`)
    }
    return shape
}