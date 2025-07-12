import { SegmentGenerator } from "../lib/utils"
import graph from "./genGraphs/entry"
const segmentGen = new SegmentGenerator(graph, graph.entry[0], graph.entry[0])
export default {
  objectScale: 100,
  preview: {
    on: false,
    height: 100,
    drawDistance: 500,
    speed: 8000
  },
  world: {
    rumbles: 8,
    roadWidth: 180000,
    subDistConfig: {
      default: 220,
      min: 500, // Minimum subDist value
      max: 500, // Maximum subDist value
      ascThres: 10, // Threshold for ascent steepness
      descThres: -5 // Threshold for descent steepness
    },
    cameraHeight: 120,
    drawDistance:500,
    fov: 70,
    spriteScale: 400,
    segmentLength: 24,
    segmentGenerator: segmentGen
  },
  colOffsets: {
    hit: 10,
    miss: 10,
    cyl: 30
  },
  traffic:{ duration: 30, speed: 600, lanes: ["left", "middle", "right"], static: true, minGap: 1500, chopper: { cyls: 1, dropDist: 1800, gapThres: 0, headMin: 700, headMax: 1600, amplitude: 60 } },
  trafficSpeed: 600,
  vehicles: ["com_truck", "mustang_gt", "jeep"],
  reset() {
    segmentGen.reset()
  }
}