function sine(i, length) {
    const spiralFactor = 0.0001; // Controls how tightly the spiral turns
    const curveIntensity = 1; // Base intensity of the curves

    // Spiral pattern using tangent, which increases with i for tight turns
    const spiralCurve = Math.tan(spiralFactor * i);

    // Sine wave to keep smoothness along with the spiral
    const sineValue = Math.sin(i / length * Math.PI * 2);

    // Add both the spiral effect and a sine wave for variety
    return curveIntensity * (spiralCurve + sineValue);
}
function waveRider(i, length) {
    const cycles = length / 700; // More frequent oscillations for a wavy feel
    const curveIntensity = 0.1; // Set base intensity for the wave-like curves
    const x = (i / length) * (2 * Math.PI * cycles);
    // Base sine wave for long sweeping ocean-like turns
    const sineValue = Math.sin(x);
    // Simulate ocean swell with a high-frequency sine wave (as if riding the crests)
    const swellWave = Math.sin(x * 3) * 0.25; // Higher frequency for small bumps
    // Introduce a small random "wind" effect to simulate randomness in wave patterns
    const windEffect = Math.random() * 0.05 - 0.025; // Small random noise
    // Combine base curve with the swell and wind effect for a dynamic wavy road
    return curveIntensity * (sineValue + swellWave + windEffect);
}
function undulating(i, length) {
    const cycles = length / 1200; // Fewer cycles for longer sweeping curves
    const baseCurveIntensity = 0.08; // Smooth mountain-like curves
    const x = (i / length) * (2 * Math.PI * cycles);
    // Base sine wave for long sweeping mountain curves
    const sineValue = Math.sin(x);
    // Add a cosine wave for steeper turns in certain sections
    const cosineValue = Math.cos(x * 1.5) * 0.15;
    // Simulate tightening of curves as you ascend the mountain with an exponential decay
    const mountainFactor = Math.exp(-0.0005 * i) + 0.5; // Sharpens over time then loosens
    // Combine the sine and cosine values for curves, and apply the mountain factor
    return baseCurveIntensity * (sineValue + cosineValue) * mountainFactor;
}
function chaotic(i, length) {
    const cycles = length / 800; // More cycles for chaotic variety
    const curveIntensity = 0.12; // Increase the base intensity for sharper turns
    // Multiple waveforms combining sine, cosine, and tangent for complexity
    const x = (i / length) * (2 * Math.PI * cycles);
    // Base sine curve for smooth turns
    const sineValue = Math.sin(x);
    // Add a secondary sine wave with double frequency for rapid small oscillations
    const sineWave2 = Math.sin(x * 2) * 0.2;
    // Apply a tangent curve sparingly for sharp, chaotic turns
    const tangentValue = Math.tan(x * 0.5) * 0.05; // Use tangent carefully to avoid infinite spikes
    // Add some random noise for unpredictability, varying between -0.1 and 0.1
    const randomNoise = (Math.random() - 0.5) * 0.2;
    // Exponential decay for smooth long turns, controlling sharpness over time
    const expFactor = Math.exp(-0.01 * i); // Decays over the curve length
    // Combine the waves, adding an exponential factor to tame the sharpness
    return curveIntensity * (sineValue + sineWave2 + tangentValue + randomNoise) * expFactor;
}
