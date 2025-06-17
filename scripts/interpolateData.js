const fs = require('fs');
const { readFile, writeFile } = fs.promises;

/**
 * Reads data from a JSON file, interpolates between frames,
 * sorts each frame's data by value, and writes the result back.
 *
 * @param {string} filePath The path to the JSON file.
 * @param {number} numSteps The number of intermediate frames to generate.
 */
async function interpolateJsonData(filePath, numSteps) {
    if (numSteps < 1) {
        console.warn("Warning: numSteps is less than 1. No interpolation will be performed.");
        return;
    }

    console.log(`Reading data from '${filePath}'...`);
    let originalData;
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        originalData = JSON.parse(fileContent);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: The file '${filePath}' was not found.`);
        } else if (error instanceof SyntaxError) {
            console.error(`Error: The file '${filePath}' contains invalid JSON.`);
        } else {
            console.error("An unexpected error occurred:", error);
        }
        return;
    }

    if (!Array.isArray(originalData) || originalData.length < 2) {
        console.log("Cannot interpolate: Data must be an array with at least two frames.");
        return;
    }

    const interpolatedFrames = [];

    for (let i = 0; i < originalData.length - 1; i++) {
        const frameA = originalData[i];
        const frameB = originalData[i + 1];

        interpolatedFrames.push(frameA);

        const dataAMap = new Map(frameA.data.map(item => [item.name, item.value]));
        const dataBMap = new Map(frameB.data.map(item => [item.name, item.value]));
        const allNames = new Set([...dataAMap.keys(), ...dataBMap.keys()]);
        
        for (let step = 1; step <= numSteps; step++) {
            const intermediateData = [];
            const intermediateFrame = {
                date: frameA.date,
                data: intermediateData,
            };

            const sortedNames = Array.from(allNames).sort();

            for (const name of sortedNames) {
                const startValue = dataAMap.get(name) ?? 0;
                const endValue = dataBMap.get(name) ?? 0;
                const delta = endValue - startValue;
                const currentValue = startValue + (delta * step / (numSteps + 1));
                intermediateData.push({ name, value: currentValue });
            }
            
            interpolatedFrames.push(intermediateFrame);
        }
    }

    interpolatedFrames.push(originalData[originalData.length - 1]);

    // --- NEWLY ADDED SECTION ---
    // Sort the 'data' array within each frame by value in descending order.
    // This is done at the end to ensure all frames, original and interpolated, are sorted.
    console.log("Sorting all frames by value (descending)...");
    for (const frame of interpolatedFrames) {
        // The sort function (b.value - a.value) sorts numbers in descending order.
        frame.data.sort((a, b) => b.value - a.value);
    }
    // --- END OF NEW SECTION ---

    console.log(`Writing ${interpolatedFrames.length} total frames back to '${filePath}'...`);
    const outputJson = JSON.stringify(interpolatedFrames, null, 2);
    await writeFile(filePath, outputJson, 'utf-8');
    
    console.log("Interpolation complete.");
}

// --- Example Usage ---
(async () => {
    const JSON_FILE_PATH = './src/components/TransferMarket/assets/data.json';
    const NUM_INTERPOLATION_STEPS = 4;

    await interpolateJsonData(JSON_FILE_PATH, NUM_INTERPOLATION_STEPS);

    console.log(`\n--- Interpolation and sorting complete for '${JSON_FILE_PATH}' ---`);
})();