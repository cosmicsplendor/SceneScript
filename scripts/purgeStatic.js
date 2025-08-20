const fs = require('fs');

/**
 * Remove consecutive frames with identical top N positions or insufficient value change
 * @param {string} filePath - Path to the JSON file containing frames data
 * @param {number} topN - Number of top positions to compare (default: 10)
 * @param {number} threshold - Minimum accumulated value change to keep frame (default: 25000000)
 */
async function truncateDataByPosition(filePath, topN = 10, threshold = 25000000) {
    try {
        // Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf8');
        const frames = JSON.parse(rawData);

        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Invalid data format: expected array of frames');
        }

        // Filter out frames with identical top N positions or insufficient value change
        const truncatedFrames = filterFramesByPosition(frames, topN, threshold);

        // Write back to the same file
        fs.writeFileSync(filePath, JSON.stringify(truncatedFrames, null, 2));
        console.log(`Successfully truncated from ${frames.length} to ${truncatedFrames.length} frames (comparing top ${topN} positions, threshold: ${threshold}) and saved to ${filePath}`);

        return truncatedFrames;
    } catch (error) {
        console.error('Error processing file:', error.message);
        throw error;
    }
}

/**
 * Filter out frames that have identical top N positions and insufficient value change to the previous frame
 * @param {Array} frames - Array of frame objects
 * @param {number} topN - Number of top positions to compare
 * @param {number} threshold - Minimum accumulated value change to keep frame
 * @returns {Array} Filtered frames with position duplicates and insufficient changes removed
 */
function filterFramesByPosition(frames, topN, threshold) {
    const filteredFrames = [];

    for (let i = 0; i < frames.length; i++) {
        const currentFrame = frames[i];

        if (i === 0) {
            // Always keep the first frame
            filteredFrames.push(currentFrame);
        } else {
            const previousFrame = frames[i - 1];
            
            // Check if current frame should be kept based on position changes OR value changes
            const positionsChanged = !areTopNPositionsIdentical(previousFrame, currentFrame, topN);
            const valueChangeSubstantial = isValueChangeSubstantial(previousFrame, currentFrame, topN, threshold);
            
            if (positionsChanged || valueChangeSubstantial) {
                filteredFrames.push(currentFrame);
            }
            // If positions are identical AND value change is not substantial, skip this frame
        }
    }

    return filteredFrames;
}

/**
 * Check if two frames have identical top N positions (regardless of values)
 * @param {Object} frame1 - First frame data
 * @param {Object} frame2 - Second frame data
 * @param {number} topN - Number of top positions to compare
 * @returns {boolean} True if top N positions are identical, false otherwise
 */
function areTopNPositionsIdentical(frame1, frame2, topN) {
    const topN1 = getTopNItems(frame1.data || [], topN);
    const topN2 = getTopNItems(frame2.data || [], topN);

    // Quick check: different lengths means different positions
    if (topN1.length !== topN2.length) {
        return false;
    }

    // Compare positions (order matters)
    for (let i = 0; i < topN1.length; i++) {
        if (topN1[i].name !== topN2[i].name) {
            return false;
        }
    }

    return true;
}

/**
 * Check if the accumulated value change in top N items exceeds threshold
 * @param {Object} frame1 - First frame data
 * @param {Object} frame2 - Second frame data
 * @param {number} topN - Number of top items to compare
 * @param {number} threshold - Minimum accumulated change to consider substantial
 * @returns {boolean} True if value change is substantial, false otherwise
 */
function isValueChangeSubstantial(frame1, frame2, topN, threshold) {
    const topN1 = getTopNItems(frame1.data || [], topN);
    const topN2 = getTopNItems(frame2.data || [], topN);

    // Create maps for easy lookup
    const map1 = {};
    const map2 = {};
    
    topN1.forEach(item => map1[item.name] = item.value);
    topN2.forEach(item => map2[item.name] = item.value);

    let accumulatedChange = 0;

    // Calculate accumulated absolute change for items present in both frames
    for (const name in map1) {
        if (name in map2) {
            accumulatedChange += Math.abs(map2[name] - map1[name]);
        }
    }

    // Add full values for items that entered/left the top N
    for (const name in map2) {
        if (!(name in map1)) {
            accumulatedChange += map2[name];
        }
    }

    for (const name in map1) {
        if (!(name in map2)) {
            accumulatedChange += map1[name];
        }
    }

    return accumulatedChange >= threshold;
}

/**
 * Get top N items sorted by value (descending)
 * @param {Array} data - Array of {name, value} objects
 * @param {number} topN - Number of top items to return
 * @returns {Array} Top N items sorted by value
 */
function getTopNItems(data, topN) {
    return data
        .slice() // Create a copy to avoid mutating original
        .sort((a, b) => b.value - a.value) // Sort by value descending
        .slice(0, topN); // Take top N
}

// Export for use as module
module.exports = {
    truncateDataByPosition
};

// Command line usage
const topN = 6; // Configure how many top positions to compare
const threshold = 1; // Configure minimum accumulated value change
const path = "./src/components/TransferMarket/assets/data.json"
truncateDataByPosition(path, topN, threshold)
    .then(() => console.log('Truncation completed successfully'))
    .catch(error => {
        console.error('Truncation failed:', error.message);
        process.exit(1);
    });