import { GeneratorGraph } from "../../../lib/utils"
import { Entry0, Entry1, Entry, Gate, Fortress, TBound1, TBound2, FlagFort, FlagFort2, NullFort, BHills1, BHills2, BHills3, BTown, BCont, BField, BCity, BHills4, FlagFort3, IsleFlank, BGard } from "./generators"

const graph = new GeneratorGraph()

graph.addNodes([Entry, Gate, Fortress, TBound1, TBound2, Entry0, Entry1, FlagFort, FlagFort2, NullFort, BHills1, BHills2, BHills3, BTown, BCont, BField, BCity, BHills4, FlagFort3, IsleFlank, BGard])

graph.addEdge(Entry0, Entry1)
graph.addEdge(Entry1, FlagFort)
graph.addEdge(Entry1, FlagFort2)
graph.addEdge(Entry1, FlagFort3)
graph.addEdge(Entry, Gate)
graph.addEdge(Gate, FlagFort)
graph.addEdge(Gate, FlagFort2)
graph.addEdge(Gate, FlagFort3)

graph.addEdge(FlagFort3, NullFort)
graph.addEdge(NullFort, TBound1)
graph.addEdge(NullFort, TBound2)
graph.addEdge(FlagFort2, TBound1)
graph.addEdge(FlagFort, TBound1)
graph.addEdge(Fortress, TBound1)

graph.addEdge(BCity, BHills1)
graph.addEdge(BHills1, BHills2)
graph.addEdge(BHills2, BHills3)
graph.addEdge(BHills3, BHills4)
graph.addEdge(BHills4, BCont)
graph.addEdge(BCont, BField)
graph.addEdge(BField, BTown)
graph.addEdge(BTown, BGard)
graph.addEdge(BGard, IsleFlank)

export default graph // exporting singleton since it makes sense here