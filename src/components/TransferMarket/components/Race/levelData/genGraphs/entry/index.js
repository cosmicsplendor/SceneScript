import { GeneratorGraph } from "../../../lib/utils"
import { Scene1, Scene2, Scene3, Scene4 } from "./generators"

const graph = new GeneratorGraph()
graph.addNodes([Scene1, Scene2, Scene3, Scene4 ])
graph.addEdge(Scene1, Scene2)
graph.addEdge(Scene2, Scene3)
graph.addEdge(Scene3, Scene4)
// graph.addEdge(HGate, Forest01)
// graph.addEdge(Bay2, BCity)


// graph.addEdge(TBound1, KScene)
// // graph.addEdge(KRock, KScene)
// graph.addEdge(Forest6, RDecor)
// graph.addEdge(Nile6, NEntry)


// graph.addEdge(Haat1, AlienGrass1)
// graph.addEdge(NL1, RFlo)
// graph.addEdge(NIsle1, LushB1)
// graph.addEdge(LushB1, Entry0)
// graph.addEdge(IsleFlank, Nile0)

graph.entry = [Scene1]
graph.regentry = [Scene1]

export default graph