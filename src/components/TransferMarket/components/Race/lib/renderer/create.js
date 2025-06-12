import Webgl2Renderer from "./Webgl2"
export default function createRenderer(params) {
    let renderer
    try {
        renderer = new Webgl2Renderer(params)
    } catch(e) {
        console.log(e)
        throw new Error("Webgl 2 not supported.. resorting to Canvas2D")
    }
    return renderer
}