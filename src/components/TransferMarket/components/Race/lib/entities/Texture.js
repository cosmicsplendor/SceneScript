import Node from "./Node"
import { texture } from "./types"

export default class Texture extends Node {
    static _assetsCache = null
    static injectAssetsCache(val) {
        this._assetsCache = val
    }
    constructor({ imgId, ...nodeProps }) {
        super({ ...nodeProps })
        this.img = Texture._assetsCache.get(imgId)
        if (!this.img) {
            throw new Error(`Image with imgId ${imgId} can't be found in the assets cache`)
        }
        this.type = texture
    }
}