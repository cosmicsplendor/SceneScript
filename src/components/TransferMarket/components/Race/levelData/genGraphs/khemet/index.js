import { GeneratorGraph } from "../../../lib/utils"
import { KEntry, KWild, KWall, KGate, KRock, HArmy, HGate, HRock, HDead, HPalm, HHouse, HEntry, KDRes, KDArt, KEntry1 } from "./generators"

const graph = new GeneratorGraph()

graph.addNodes([KEntry, KWild, KWall, KGate, KRock, HArmy, HGate, HRock, HEntry, HDead, HPalm, HHouse, KEntry1, KDRes, KDArt ])

graph.addEdge(KEntry1, KDArt)
graph.addEdge(KDArt, KDRes)
graph.addEdge(KDRes, KEntry)

graph.addEdge(KEntry, KWall)
graph.addEdge(KWall, KWild)
graph.addEdge(KWall, KGate)
graph.addEdge(KGate, KWild)
graph.addEdge(KWild, KRock)
graph.addEdge(KRock, HPalm)

graph.addEdge(HEntry, HRock)
graph.addEdge(HRock, HPalm)
graph.addEdge(HPalm, HArmy)
graph.addEdge(HArmy, HDead)
graph.addEdge(HDead, HHouse)
graph.addEdge(HHouse, HGate)


export default graph // exporting singleton since it makes sense here