import Node from "./Node"
import { polygons } from "./types"

class Polygons extends Node {
    constructor({ data=[], alpha, ...nodeProps }={}) {
        super({ ...nodeProps })
        this.data = data
        this.alpha = alpha
        this.type = polygons
    }
}

export default Polygons