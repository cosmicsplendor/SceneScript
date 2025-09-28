import { GeneratorGraph } from "../../../lib/utils"
import { Entry1, Entry2 } from "./generators"

const graph = new GeneratorGraph()
graph.addNodes([Entry1, Entry2])
graph.addEdge(Entry2, Entry1)
// graph.addEdge(HGate, Forest01)
// graph.addEdge(Bay2, BCity)


// graph.addEdge(TBound1, KEntry1)
// // graph.addEdge(KRock, KEntry1)
// graph.addEdge(Forest6, RDecor)
// graph.addEdge(Nile6, NEntry)


// graph.addEdge(Haat1, AlienGrass1)
// graph.addEdge(NL1, RFlo)
// graph.addEdge(NIsle1, LushB1)
// graph.addEdge(LushB1, Entry0)
// graph.addEdge(IsleFlank, Nile0)

graph.entry = [Entry2]
graph.regentry = [Entry2]

export default graph