// Use modern ES module syntax for imports
const fs = require('fs');
const { readFile, writeFile } = fs.promises;

/**
 * Reads data from a JSON file, interpolates between frames,
 * and writes the result back to the same file.
 *
 * @param {string} filePath The path to the JSON file.
 * @param {number} numSteps The number of intermediate frames to generate between each original frame.
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

    // This will hold all frames: original and interpolated
    const interpolatedFrames = [];

    // Iterate through each pair of consecutive frames
    for (let i = 0; i < originalData.length - 1; i++) {
        const frameA = originalData[i];
        const frameB = originalData[i + 1];

        // Always add the first frame of the pair to our results
        interpolatedFrames.push(frameA);

        // Create lookup maps for quick access to values by name. This is highly efficient.
        const dataAMap = new Map(frameA.data.map(item => [item.name, item.value]));
        const dataBMap = new Map(frameB.data.map(item => [item.name, item.value]));

        // Get a set of all unique names across both frames to handle appearing/disappearing items
        const allNames = new Set([...dataAMap.keys(), ...dataBMap.keys()]);

        // Generate the intermediate frames
        for (let step = 1; step <= numSteps; step++) {
            const intermediateData = [];

            // The date for all sub-frames is the date of the starting frame
            const intermediateFrame = {
                date: frameA.date,
                data: intermediateData,
            };

            // Sort names for a consistent output order in the final JSON
            const sortedNames = Array.from(allNames).sort();

            for (const name of sortedNames) {
                // Get start value. If name not in A, it's appearing (starts at 0).
                // The '??' operator is perfect for providing a default value.
                const startValue = dataAMap.get(name) ?? 0;

                // Get end value. If name not in B, it's disappearing (ends at 0).
                const endValue = dataBMap.get(name) ?? 0;

                // Calculate the total change required
                const delta = endValue - startValue;

                // Linear interpolation formula:
                // We divide by (numSteps + 1) because there are that many "gaps" between frameA and frameB
                const currentValue = startValue + (delta * step / (numSteps + 1));

                intermediateData.push({ name: name, value: currentValue });
            }
            
            interpolatedFrames.push(intermediateFrame);
        }
    }

    // Finally, add the very last frame from the original data
    interpolatedFrames.push(originalData[originalData.length - 1]);

    console.log(`Writing ${interpolatedFrames.length} total frames back to '${filePath}'...`);

    // Convert the data back to a pretty-printed JSON string
    const outputJson = JSON.stringify(interpolatedFrames, null, 2);

    await writeFile(filePath, outputJson, 'utf-8');
    
    console.log("Interpolation complete.");
}

// --- Example Usage ---
// This IIFE (Immediately Invoked Function Expression) allows us to use async/await at the top level
(async () => {
    // 1. Define the file path and number of interpolation steps
    const JSON_FILE_PATH = './src/components/TransferMarket/assets/data.json';
    const NUM_INTERPOLATION_STEPS = 4; // Creates 4 new frames between each original pair

    await interpolateJsonData(JSON_FILE_PATH, NUM_INTERPOLATION_STEPS);

    // 4. (Optional) Print the new content of the file to verify
    console.log(`\n--- Content of '${JSON_FILE_PATH}' after interpolation ---`);
    // const finalContent = await readFile(JSON_FILE_PATH, 'utf-8');
    // console.log(finalContent);
})();