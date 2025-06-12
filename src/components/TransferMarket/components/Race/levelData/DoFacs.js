import WindBlade from "../entities/WindBlade";
import Gull from "../entities/Gull";
import Blimp from "../entities/Blimp";
import Pool from "../lib/utils/Pool";

const gullPool = new Pool({
    size: 12,
    factory(params, z, world) {
        return new Gull(params, z, world)
    }
})
const wbPool = new Pool({
    size: 20,
    factory(params, z, world) {
        return new WindBlade(params, z, world)
    }
})
export default {
    "wind_blade": (params, z, world) => wbPool.create(params, z, world),
    blimp: (params, z, world) => new Blimp(params, z, world),
    gull: (params, z, world) => gullPool.create(params, z, world),
};