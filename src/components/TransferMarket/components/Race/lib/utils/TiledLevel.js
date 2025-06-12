import { Node } from "@lib"
import TexRegion from "@lib/entities/TexRegion"
import { colRectsId, objLayerId } from "@lib/constants"

class TiledLevel extends  Node {
    resetRecursively(node = this) {
        node.reset && node.reset()
        if (!node.children) return
        for (let child of node.children) {
            this.resetRecursively(child)
        }
    }
    constructor({ player, data, factories={}, ...nodeProps }) {
        super({ ...nodeProps })
        const colRects = new Node({ id: colRectsId }) // collision rects are invisible, so wherever in the scene graph they go doesn't matter
        const objNode = new Node({ id: objLayerId }) // node for entities created via factories; it goes between world layer and foreground
        const mgObjNode = new Node() // midground tile-group that lies behind the world layer
        const fgObjNode = new Node()
        const objNodeMap = {
            mg: mgObjNode,
            world: objNode,
            fg: fgObjNode
        }
        const getGroup = function(id) { // all the collision groups in particular node should go to it's respective objLayer
            const g = Node.get(id)
            if (!g) { // if g isn't there, create a new one, add it to the objNode and return it
                const newG = new Node({ id })
                this.add(newG)
                return newG
            }
            return g
        } 
        objNode.getGroup = getGroup
        mgObjNode.getGroup = getGroup
        fgObjNode.getGroup = getGroup
        const addTiles = (tiles, layer) => {
            const objNode = objNodeMap[layer]
            const addTile = ({ name, x, y, groupId, ...props }) => {
                const factory = factories[name]
                if (factory) { // in case there exists a factory for creating the tile with this particular name, give that a precedence
                    const parentNode = !!groupId ? objNode.getGroup(groupId): objNode
                    parentNode.add(factory(x, y, props, player))
                    return
                }
                const region = new TexRegion({ frame: name, pos: { x: x, y: y }})
                const parentNode = groupId ? objNode.getGroup(groupId): this
                parentNode.add(region)
            }
            tiles.forEach(addTile)
        }
        
        const addSpawnPoint = ({ name, x, y, groupId, layer = "w", ...props }) => {
            const factory = factories[name]
            if (!factory) {
                throw new Error(`no factory method provided for ${name}`)
            }
            const node = layer === "mg" ? mgObjNode:
                         layer === "fg" ? fgObjNode:
                         objNode
            const parentNode = !!groupId ? node.getGroup(groupId): node
            parentNode.add(factory(x, y, props, player))
        }
        const addColRect = ({ x, y, width, height, ...props }) => {
            const colRect = new Node({ pos: { x, y } })
            colRect.width = width
            colRect.height = height
            Object.assign(colRect, props)
            colRects.add(colRect)
        }

        // adding col-rects to objNode (after world tiles and before world spawn points)
        data.collisionRects.forEach(addColRect)
        objNode.add(colRects)

        // followed by midground tiles and mgObjNode
        addTiles(data.mgTiles, "mg")
        this.add(mgObjNode)

        // then, world-layer tiles, objNode and spawnPoints (all of which lie on world layer)
        addTiles(data.tiles, "world")
        this.add(objNode)
        data.spawnPoints.forEach(addSpawnPoint)

        // and finally foreground tiles and fgObjNode
        addTiles(data.fgTiles, "fg")
        this.add(fgObjNode)

        this.width = data.width
        this.height = data.height
    }
}

export default TiledLevel