import { GeneratorGraph } from "../../../lib/utils"
import { Ruins0, Ruins1, Ruins2, Ruins3, Ruins4, Ruins5, Nile0, Nile1, Nile2, Nile3, Nile4, Nile5, Nile6 } from "./generators"

const graph = new GeneratorGraph()

graph.addNodes([ Nile0, Nile1, Nile2, Nile3, Nile4, Nile5, Nile6])


graph.addEdge(Nile0, Nile1)
graph.addEdge(Nile1, Nile2)
graph.addEdge(Nile2, Nile3)
graph.addEdge(Nile3, Nile4)
graph.addEdge(Nile4, Nile5)
graph.addEdge(Nile5, Nile6)

export default graph // exporting singleton since it makes sense here