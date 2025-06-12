export const wavy = (sinf=2, sina=0.2, cosf=3, cosa=0.5) => (i, length) => {
    // return 15 * i
    const cycles = length / 500; // Control the number of cycles
    const x = (i / length) * (2 * Math.PI * cycles); // Scale i to fit the number of cycles

    // Primary sine wave for smooth periodicity
    const sineValue = Math.sin(x);

    // Secondary sine and cosine waves for added smooth variation
    const sineWave2 = Math.sin(x * sinf) * sina; // Higher frequency, lower amplitude
    const cosineWave = Math.cos(x * cosf) * cosa; // Even higher frequency for detail

    // Combine the waves smoothly
    const combinedWave = sineValue + sineWave2 + cosineWave;

    // Scale the final result to a desired height range (only positive values for ascent)
    return 500 * combinedWave;
}

export const linear = (m=0, c=0) => (i, _) => {
    return i * m + c
}

export const rolling = (f=2, a=0.2) => (i, length) => {
    const cycles = length / 500;
    const x = (i / length) * (2 * Math.PI * cycles);

    // Base sine wave
    const sineValue = Math.sin(x);

    // Apply a Gaussian function for smooth rolling hills
    const gaussian = Math.exp(-sineValue * sineValue);

    // Add more variety with another sine wave
    const sineWave2 = Math.sin(x * f) * a;

    // Scale and combine the waves
    return 500 * (gaussian + sineWave2);
}

export default generateHeight