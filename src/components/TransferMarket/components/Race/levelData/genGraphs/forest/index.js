import { GeneratorGraph } from "../../../lib/utils"
import { Bay1, Bay2, Forest1, Forest2, Forest3, Forest4, Forest01, Forest02, Forest03, Forest04, Forest05, Forest0, LushB1, Forest5, Forest6, Forest06, Bay0 } from "./generators"

const graph = new GeneratorGraph()
graph.addNodes([Bay1, Bay2, Forest0, Forest1, Forest2, Forest3, Forest4, Forest5, Forest6, Forest01, Forest02, Forest03, Forest04, Forest05, Forest06, Bay0, LushB1])

graph.addEdge(Forest0, Forest1)
graph.addEdge(Forest1, Forest2)
graph.addEdge(Forest2, Forest3)
graph.addEdge(Forest3, Forest4)
graph.addEdge(Forest4, Forest5)
graph.addEdge(Forest5, Forest6)

// graph.addEdge(Forest01, Forest02)
graph.addEdge(Forest02, Forest03)
graph.addEdge(Forest03, Forest04)
graph.addEdge(Forest04, Forest05)
graph.addEdge(Forest05, Forest06)
graph.addEdge(Forest06, Bay0)
graph.addEdge(Bay0, Bay1)
graph.addEdge(Bay1, Bay2)

export default graph