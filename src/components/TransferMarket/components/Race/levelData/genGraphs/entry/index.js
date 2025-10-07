import { GeneratorGraph } from "../../../lib/utils"
import { IceAge, IceAge2, IceAge3, IceAge4 } from "./generators"

const graph = new GeneratorGraph()
graph.addNodes([IceAge, IceAge2, IceAge3, IceAge4 ])
graph.addEdge(IceAge, IceAge2)
graph.addEdge(IceAge2, IceAge3)
graph.addEdge(IceAge3, IceAge4)
// graph.addEdge(HGate, Forest01)
// graph.addEdge(Bay2, BCity)


// graph.addEdge(TBound1, KIceAge)
// // graph.addEdge(KRock, KIceAge)
// graph.addEdge(Forest6, RDecor)
// graph.addEdge(Nile6, NEntry)


// graph.addEdge(Haat1, AlienGrass1)
// graph.addEdge(NL1, RFlo)
// graph.addEdge(NIsle1, LushB1)
// graph.addEdge(LushB1, Entry0)
// graph.addEdge(IsleFlank, Nile0)

graph.entry = [IceAge]
graph.regentry = [IceAge]

export default graph