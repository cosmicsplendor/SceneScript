import { GeneratorGraph } from "../../../lib/utils"
import { AlienGrass1, AlienGrass2, AlienGrass3, AlienAnim1, AlienAnim2, AlienAnim3, AlienAnim4, AlienAnim0 } from "./generators"

const graph = new GeneratorGraph()

graph.addNodes([AlienGrass1, AlienGrass2, AlienGrass3, AlienAnim1, AlienAnim2, AlienAnim3, AlienAnim4, AlienAnim0])

graph.addEdge(AlienGrass1, AlienGrass2)
graph.addEdge(AlienGrass2, AlienGrass3)
graph.addEdge(AlienGrass3, AlienAnim0)
graph.addEdge(AlienAnim0, AlienAnim1)
graph.addEdge(AlienAnim1, AlienAnim2)
graph.addEdge(AlienAnim2, AlienAnim3)
graph.addEdge(AlienAnim3, AlienAnim4)

export default graph // exporting singleton since it makes sense here