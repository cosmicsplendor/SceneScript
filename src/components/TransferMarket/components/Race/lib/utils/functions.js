export const interpolate = (y1, y2, x1, x2, x) => {
    const t = (x - x1) / (x2 - x1)
    return y1 + t * (y2 - y1)
}