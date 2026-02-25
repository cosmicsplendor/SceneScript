const calculateFog = (i, drawDistance, fogDensity) => {
  const normalizedDistance = i / drawDistance

  const fog = 1 - Math.exp(
    -Math.pow(fogDensity * normalizedDistance, 2)
  )

  return Math.min(fog, 1)
};
export class FogFactorCache {
    constructor() {
        this.cache = [];
        this.currentFogDensity = null;
    }

    get(i, drawDistance, fogDensity) {
        if (this.currentFogDensity !== fogDensity) {
            this.cache.length = 0 // clear cache
            this.currentFogDensity = fogDensity;
        }

        if (this.cache[i] === undefined) {
            this.cache[i] = calculateFog(i, drawDistance, fogDensity, 3)
        }
        return this.cache[i];
    }
}

// Create a singleton instance
export const fogFactorCache = new FogFactorCache();
