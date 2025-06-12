import { DynamicObject } from "../lib/entities/DynamicObjects"
import { pickOne, rand } from "../lib/utils/math"
import Coin from "./Coin"
import { createNoise2D } from 'simplex-noise'
import Pool from "../lib/utils/Pool"
const noise2d = createNoise2D()
const MIN_COIN_Y = 36
const MAX_COINS = 20

const coinPool = new Pool({
    size: 16,
    factory(x, z, world, yOffset, gravity, gState) {
        return new Coin({ x, world, z, yOffset, gravity, gState })
    }
})
const tempCoins = []
function yFromZ(z, z0, velY, velZ, g) {
    const t = (z - z0) / velZ
    return (velY + 0.5 * g * t) * t
}
const soundModes = ['standard', 'muffle', "muffle", 'vibrato', 'tremolo', 'echo'];

function pitchShift(coins) {
    const mode = "tremelo" || pickOne(soundModes); // Fixed mode selection
    const maxCoins = 20;
    const minPitch = 0, maxPitch = -6;
    const minVolume = 0.5, maxVolume = 1;
    const coinCount = coins.length;
    if (coinCount === 0) return;
    const volMul = 0.5 + (0.5 * Math.random())
    const pitchMid = (minPitch + maxPitch) / 2;
    const pitchRange = (maxPitch - minPitch) * (coinCount / maxCoins) / 2;
    const pitchStart = pitchMid - pitchRange;
    const pitchEnd = pitchMid + pitchRange;
    
    const volumeStart = minVolume + (1 - coinCount / maxCoins) * (maxVolume - minVolume) / 2;
    const volumeEnd = maxVolume;
    
    for (let i = 0; i < coinCount; i++) {
        const t = i / (coinCount - 1 || 1);
        
        switch (mode) {
            case 'muffle':
                coins[i].pitch = pitchStart + t * (pitchEnd - pitchStart);
                coins[i].vol = volumeStart + t * (volumeEnd - volumeStart);
                coins[i].muf = coins[i].vol * 0.75;
                break;
                
            case 'vibrato':
                coins[i].pitch = (pitchStart + t * (pitchEnd - pitchStart) +
                                  Math.sin(t * Math.PI * 10) * 0.2) * 0.5;
                coins[i].vol = (volumeStart + t * (volumeEnd - volumeStart)) * 0.75;
                coins[i].muf = 0;
                break;
                
            case 'tremolo': {
                const baseVol = volumeStart + t * (volumeEnd - volumeStart);
                const tremolo = Math.sin(t * Math.PI * 8) * 0.15;
                coins[i].vol = Math.max(minVolume, Math.min(maxVolume, baseVol * (1 + tremolo)));
                coins[i].pitch = pitchStart + t * (pitchEnd - pitchStart);
                coins[i].muf = 0;
                break;
            }
                
            case 'echo':
                coins[i].pitch = pitchStart + t * (pitchEnd - pitchStart);
                coins[i].vol = (volumeStart + t * (volumeEnd - volumeStart)) * Math.pow(0.95, i);
                coins[i].muf = coins[i].vol * 0.6;
                break;
                
            default: // 'standard'
                coins[i].pitch = pitchStart + t * (pitchEnd - pitchStart);
                coins[i].vol = volumeStart + t * (volumeEnd - volumeStart);
                coins[i].muf = 0;
                break;
        }
        coins[i].vol *= volMul
    }
}



class Pickup extends DynamicObject {
    static lastActive = 1
    scale = 2
    alpha = 0.6
    yOffset = 7.5
    active = false
    boostY = 100
    colOffset = -90
    constructor(props) {
        super(props)
        this.player = props.world.subject
        this.zThres = props.world.segmentLength * 150
        const { type, val, dir } = props.extrema
        this.type = type
        this.val = val
        this.dir = dir
        this.traffic = props.traffic
        this.gState = props.gState
    }
    placeCoins(i0) {
        const { segments, segmentLength } = this.world
        const { flyVelZ, gravity, zVel } = this.player
        const n = segments.length - (i0 + 2)
        const h0 = segments[i0].h
        let noiseX = rand(100, 0)
        const xOffset = (this.x + 1) / 2 - noise2d(noiseX, 0)
        let totalCoins = 0
        let coinsAdded = 0
        tempCoins.length = 0
        for (let i = i0 + rand(8,4); i < i0 + n; i +=3) {
            if (totalCoins >= MAX_COINS) break
            const segment = segments[i]
            const z = (i - i0) * segmentLength
            const h = segment.h
            const y = yFromZ(z, 0, this.boostY, zVel + flyVelZ, gravity)
            const yOffset = y - (h - h0)
            if (yOffset < MIN_COIN_Y) continue
            // if (Math.abs(yOffset - lastYOffset) < 10) continue
            totalCoins++
            noiseX += 0.0035
            let coinX = -1 + 2 * (xOffset + noise2d(noiseX, 0));
            // Reflect coinX if it's outside the -1 to 1 range
            if (coinX > 1) {
                coinX = 2 - coinX; // Reflect about 1
            } else if (coinX < -1) {
                coinX = -2 - coinX; // Reflect about -1
            }
            const coin = coinPool.create(coinX, z + this.z, this.world, yOffset, 0, this.gState)
            this.parent.add(coin)
            tempCoins.push(coin)
            coinsAdded += 1
        }
        pitchShift(tempCoins)

        return coinsAdded
    }
    activate() {
        this.active = true
        this.traffic.setPickup(this.z)
    }
    remove() {
        this.parent.remove(this)
    }
    update(dt, t) {
        if (this.active == false) {
            if (this.player.z < this.z - this.zThres) return
            const { world } = this
            const segment = world.findSegment(this.z)
            let idx = segment - world.firstSegmentIndex
            if (this.type === "inflection") {
                if (this.val > -1) {
                    this.remove()
                    return
                }
                this.boostY = this.dir === 1 ? 250: 100
                // if (this.dir === 1) {
                //     this.alpha = 0
                //     this.colOffset = -600
                // }
                const coinsAdded = this.placeCoins(idx)
                if (coinsAdded === 0) {
                    this.remove()
                    return
                }
                this.activate()
                return
            }
            let lastH = world.segments[idx].h
            const initIdx = idx
            const initH = lastH
            let dh = 0
            let maxDelH = -Infinity
            let increasing = 0
            let gradient
            while (world.segments[idx + 1]) {
                idx++
                const curH = world.segments[idx].h
                dh = initH - curH
                maxDelH = Math.max(maxDelH, dh)
                increasing = curH - lastH > 0 ? increasing + 1 : 0
                gradient = maxDelH / (idx - initIdx)
                lastH = curH
            }
            if (gradient > 1.5) {
                Pickup.lastActive = t
                const coinsAdded = this.placeCoins(initIdx, idx - initIdx)
                if (coinsAdded === 0) {
                    this.remove()
                    return
                }
                this.activate()
            } else {
                this.remove()
                return
            }
        }
        const scaleX = Math.tanh(Math.cos(t * 4) * 2)
        const adjustedScaleX = scaleX
        this.flip = adjustedScaleX < 0
        this.scaleX = Math.abs(adjustedScaleX)
        super.update(dt, t)
    }
}

export default Pickup
