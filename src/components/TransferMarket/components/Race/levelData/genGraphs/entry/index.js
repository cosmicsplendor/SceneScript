import tropics from "../tropics"
import forest from "../forest"
import khemet from "../khemet"
import egypt from "../egypt"
import nepal from "../nepal"
import alien from "../alien"
import { Bay2, Forest0, Forest01, Forest6, LushB1 } from "../forest/generators"
import { BCity, Entry0,  IsleFlank,  TBound1, Entry } from "../tropics/generators"
import { Nile0, Nile6} from "../egypt/generators"
import { Haat1, NEntry, NIsle1,NL1, RDecor, RFlo } from "../nepal/generators"
import {  HEntry, HGate,  KEntry1, KRock } from "../khemet/generators"
import { GeneratorGraph } from "../../../lib/utils"
import {  AlienAnim4, AlienGrass1 } from "../alien/generators"
const graph = GeneratorGraph.merge(tropics, forest, khemet, egypt, nepal, alien)


graph.addEdge(AlienAnim4, HEntry)
graph.addEdge(HGate, Forest01)
graph.addEdge(Bay2, BCity)


graph.addEdge(TBound1, KEntry1)
graph.addEdge(KRock, Forest0)
graph.addEdge(Forest6, RDecor)
graph.addEdge(Nile6, NEntry)


graph.addEdge(Haat1, AlienGrass1)
graph.addEdge(NL1, RFlo)
graph.addEdge(NIsle1, LushB1)
graph.addEdge(LushB1, Entry0)
graph.addEdge(IsleFlank, Nile0)

graph.entry = [BCity]
graph.regentry = [Entry]

export default graph