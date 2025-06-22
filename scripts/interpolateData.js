const fs = require('fs');
const { readFile, writeFile } = fs.promises;

/** Checks if a date string is a 4-digit year. */
const isYearly = (dateStr) => /^\d{4}$/.test(dateStr);

/** Checks if a date string is a "Qx YYYY" quarter. */
const isQuarterly = (dateStr) => /^Q(\d)\s(\d{4})$/.test(dateStr);

/** Gets the year from either "2008" or "Q1 2008". */
const getYear = (dateStr) => dateStr.slice(-4);

/**
 * Transforms yearly data into quarterly, intelligently handling existing quarterly data.
 * @param {string} filePath Path to the JSON file.
 */
async function processData(filePath) {
    console.log(`Reading data from '${filePath}'...`);
    let originalData;
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        originalData = JSON.parse(fileContent);
    } catch (error) {
        console.error("An error occurred during file reading:", error); return;
    }

    // --- STAGE 1: CLEANUP ---
    // Filter out yearly frames that are immediately followed by their own Q1.
    // This is the key fix for the user's reported issue.
    console.log("Cleaning data: Removing redundant yearly frames...");
    const cleanedData = originalData.filter((frame, index) => {
        const nextFrame = originalData[index + 1];
        if (isYearly(frame.date) && nextFrame && isQuarterly(nextFrame.date)) {
            // Check if the next frame is Q1 of the current frame's year
            if (getYear(frame.date) === getYear(nextFrame.date) && nextFrame.date.startsWith('Q1')) {
                console.log(`   - Found redundant frame "${frame.date}", removing.`);
                return false; // Filter this frame out
            }
        }
        return true; // Keep all other frames
    });

    // --- STAGE 2: EXPAND & PRESERVE ---
    console.log("Processing cleaned data: Expanding years and preserving quarters...");
    const finalFrames = [];

    for (let i = 0; i < cleanedData.length - 1; i++) {
        const frameA = cleanedData[i];
        const frameB = cleanedData[i + 1];

        // Only expand a year if it's followed by another year.
        if (isYearly(frameA.date) && isYearly(frameB.date)) {
            const yearToExpand = frameB.date;
            console.log(`   - Expanding year "${yearToExpand}" into 4 quarters...`);
            
            const dataAMap = new Map(frameA.data.map(item => [item.name, item.value]));
            const dataBMap = new Map(frameB.data.map(item => [item.name, item.value]));
            const allNames = new Set([...dataAMap.keys(), ...dataBMap.keys()]);

            for (let quarter = 1; quarter <= 4; quarter++) {
                const t = quarter / 4.0;
                const intermediateData = [];
                for (const name of Array.from(allNames).sort()) {
                    const startValue = dataAMap.get(name) ?? 0;
                    const endValue = dataBMap.get(name) ?? 0;
                    const currentValue = startValue + (endValue - startValue) * t;
                    intermediateData.push({ name, value: currentValue });
                }
                finalFrames.push({
                    date: `Q${quarter} ${yearToExpand}`,
                    data: intermediateData,
                    easing: frameB.easing,
                });
            }
        } else {
            // If the pair is not (Year, Year), we are not expanding.
            // Just add the first frame of the pair to the results.
            finalFrames.push(frameA);
        }
    }

    // Add the very last frame from the cleaned data, as the loop won't reach it.
    finalFrames.push(cleanedData[cleanedData.length - 1]);

    console.log("Sorting all frames by value (descending)...");
    for (const frame of finalFrames) {
        frame.data.sort((a, b) => b.value - a.value);
    }

    console.log(`Writing ${finalFrames.length} total frames back to '${filePath}'...`);
    const outputJson = JSON.stringify(finalFrames, null, 2);
    await writeFile(filePath, outputJson, 'utf-8');
    
    console.log("Transformation complete.");
}

// --- Example Usage ---
(async () => {
    const JSON_FILE_PATH = './src/components/TransferMarket/assets/data.json';
    await processData(JSON_FILE_PATH);
})();