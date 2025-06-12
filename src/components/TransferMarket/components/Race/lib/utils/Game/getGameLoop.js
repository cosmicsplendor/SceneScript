import { Node } from "../../index"
const getGameLoop = ({ renderer, fps = 60 }) => {
    const dt = 1 / fps
    return function runLoop(ts) {
        renderer.scene.update && renderer.scene.update(dt, ts)
        Node.updateRecursively(renderer.scene, dt, ts, renderer.scene)
        renderer.renderRecursively()
    }
}

export default getGameLoop