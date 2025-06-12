import { SegmentGenerator } from "../lib/utils"
import graph from "./genGraphs/entry"
import { pickOne } from "../lib/utils/math"
const segmentGen = new SegmentGenerator(graph, pickOne(graph.entry), pickOne(graph.regentry))
export default {
  objectScale: 125,
  preview: {
    on: false,
    height: 100,
    drawDistance: 200,
    speed: 8000
  },
  world: {
    rumbles: 8,
    roadWidth: 80000,
    subDistConfig: {
      default: 220,
      min: 200, // Minimum subDist value
      max: 300, // Maximum subDist value
      ascThres: 10, // Threshold for ascent steepness
      descThres: -5 // Threshold for descent steepness
    },
    cameraHeight: 100,
    drawDistance:350,
    fov: 60,
    spriteScale: 400,
    segmentLength: 24,
    segmentGenerator: segmentGen
  },
  player: {
    x: 0,
    y: 0,
    z: 400,
    frame: "messi",
    maxSpeed: 1900,
    scale: 0.6,
    xMin: -0.95,
    xMax: 0.95
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