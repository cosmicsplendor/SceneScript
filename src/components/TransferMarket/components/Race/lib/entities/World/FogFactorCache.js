const calculateFog = (i, drawDistance, fogDensity, exponent = 20) => {
    const threshold = drawDistance * 0.7; // Point after which fog grows exponentially
    const normalizedDistance = i / drawDistance;
  
    if (i <= threshold) {
      const norm = fogDensity * normalizedDistance;
      return 1 - Math.exp(-norm);
    } else {
      // Calculate progress within the last quarter (0 to 1)
      const progressInLastQuarter = (i - threshold) / (drawDistance - threshold);
  
      // Apply exponential growth to this progress
      const exponentialFactor = Math.pow(progressInLastQuarter, exponent);
  
      // Calculate the fog factor, aiming to reach 1 at the end
      // We need to scale it appropriately. Let's consider the fog value at the threshold.
      const fogAtThreshold = 1 - Math.exp(-fogDensity * (threshold / drawDistance));
  
      // Blend the exponential factor with the remaining amount to reach 1
      return fogAtThreshold + (1 - fogAtThreshold) * exponentialFactor;
    }
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
