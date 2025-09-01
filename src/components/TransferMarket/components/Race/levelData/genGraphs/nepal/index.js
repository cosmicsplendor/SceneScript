import { GeneratorGraph } from "../../../lib/utils"
import { RFlo, RMus, RFarm, RGaun1, RGaun2, NIsle1, NIsle2, NIsle3, NIsle4, RGard, RFense, RDecor, NEntry, NL1, NL2, NL3, NL4, Haat1, Haat2, Haat3, Haat4, RFor } from "./generators"

const graph = new GeneratorGraph()

graph.addNodes([RFlo, RMus, RFarm, RGaun1, RGaun2, NIsle1, NIsle2, NIsle3, NIsle4, RGard, RFense, RDecor, NEntry, NL1, NL2, NL3, NL4, Haat1, Haat2, Haat3, Haat4, RFor])

graph.addEdge(RDecor, RMus)
graph.addEdge(RMus, RFor)
graph.addEdge(RFor, RGaun1)
graph.addEdge(RGaun1, RGard)
graph.addEdge(RGard, NIsle3)
graph.addEdge(NIsle3, Haat2)
graph.addEdge(Haat2, NL2)
graph.addEdge(NL2, NL3)
graph.addEdge(NL3, Haat1)


graph.addEdge(RFlo, RFarm)
graph.addEdge(RFarm, RGaun2)
graph.addEdge(RGaun2, NIsle4)
graph.addEdge(NIsle4, NIsle2)
graph.addEdge(NIsle2, NIsle1)


graph.addEdge(NEntry, NL4)
graph.addEdge(NL4, Haat4)
graph.addEdge(NL4, Haat3)
graph.addEdge(Haat3, NL1)
graph.addEdge(Haat4, NL1)
graph.addEdge(NL1, NEntry)

export default graph // exporting singleton since it makes sense here