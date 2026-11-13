import { SegmentGenerator } from "../lib/utils"
import graph from "./genGraphs/entry"
const segmentGen = new SegmentGenerator(graph, graph.entry[0], graph.entry[0])
export default {
  objectScale: 15,
  xOffset: 0,
  world: {
    rumbles: 3,
    roadWidth: 180000,
    subDistConfig: {
      default: 220,
      min: 200, // Minimum subDist value
      max: 200, // Maximum subDist value
      ascThres: 10, // Threshold for ascent steepness
      descThres: -5 // Threshold for descent steepness
    },
    cameraHeight: 120,
    drawDistance:320,
    fov: 120,
    spriteScale: 300,
    segmentLength: 100,
    segmentGenerator: segmentGen
  },
  reset() {
    segmentGen.reset()
  }
}