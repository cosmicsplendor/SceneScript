import { DataEvolution } from ".";

import creativity from "../assets/multi/liv_city_creativity.json"
import defense from "../assets/multi/liv_city_defense.json"
import goalContrib from "../assets/multi/liv_city_goal_contrib.json"
import progression from "../assets/multi/liv_city_progression.json"
// Mock data evolutions - replace with your actual data
const dataEvolutions: DataEvolution[] = [
  {
    metric: "23/25 Goal Contributions",
    data: goalContrib,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n}⚽`
    }
  },
  {
    metric: "23/25 Creativity",
    data: creativity,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n} pts.`
    }
  },
  {
    metric: "23/25 Defense",
    data: defense,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n} pts.`
    }
  },
  {
    metric: "23/25 Progression",
    data: progression,
    formatX: (num: number | string) => {
      const n = Math.round(Number(num))
      return `${n}`
    }
  }
].reverse();

export default dataEvolutions