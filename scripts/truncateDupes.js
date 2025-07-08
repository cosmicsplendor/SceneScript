const fs = require('fs');

/**
 * Remove consecutive frames with identical data values
 * @param {string} filePath - Path to the JSON file containing frames data
 */
async function truncateData(filePath) {
    try {
        // Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf8');
        const frames = JSON.parse(rawData);

        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Invalid data format: expected array of frames');
        }

        // Filter out duplicate frames
        const truncatedFrames = filterDuplicateFrames(frames);

        // Write back to the same file
        fs.writeFileSync(filePath, JSON.stringify(truncatedFrames, null, 2));
        console.log(`Successfully truncated from ${frames.length} to ${truncatedFrames.length} frames and saved to ${filePath}`);

        return truncatedFrames;
    } catch (error) {
        console.error('Error processing file:', error.message);
        throw error;
    }
}

/**
 * Filter out frames that have identical data values to the previous frame
 * @param {Array} frames - Array of frame objects
 * @returns {Array} Filtered frames with duplicates removed
 */
function filterDuplicateFrames(frames) {
    const filteredFrames = [];

    for (let i = 0; i < frames.length; i++) {
        const currentFrame = frames[i];

        if (i === 0) {
            // Always keep the first frame
            filteredFrames.push(currentFrame);
        } else {
            const previousFrame = frames[i - 1];
            
            // Check if current frame has identical data to previous
            if (!areFramesIdentical(previousFrame, currentFrame)) {
                filteredFrames.push(currentFrame);
            }
            // If frames are identical, skip this frame (don't add to filtered array)
        }
    }

    return filteredFrames;
}

/**
 * Check if two frames have identical data values
 * @param {Object} frame1 - First frame data
 * @param {Object} frame2 - Second frame data
 * @returns {boolean} True if frames have identical data, false otherwise
 */
function areFramesIdentical(frame1, frame2) {
    const data1 = frame1.data || [];
    const data2 = frame2.data || [];

    // Quick check: different lengths means different data
    if (data1.length !== data2.length) {
        return false;
    }

    // Create maps for O(1) lookup
    const map1 = createValueMap(data1);
    const map2 = createValueMap(data2);

    // Check if both maps have the same keys
    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    // Check if all names exist in both frames with identical values
    for (const name of keys1) {
        if (!(name in map2) || map1[name] !== map2[name]) {
            return false;
        }
    }

    return true;
}

/**
 * Create a value map from frame data (name -> value)
 * @param {Array} data - Array of {name, value} objects
 * @returns {Object} Map of name to value
 */
function createValueMap(data) {
    const valueMap = {};
    
    data.forEach(item => {
        valueMap[item.name] = item.value;
    });

    return valueMap;
}

/**
 * Example usage and testing function
 */
function createSampleData() {
    const sampleFrames = [
        {
            date: "2024-01-01",
            data: [
                { name: "Alice", value: 100 },
                { name: "Bob", value: 80 },
                { name: "Charlie", value: 60 }
            ]
        },
        {
            date: "2024-01-02", // Identical to previous - should be removed
            data: [
                { name: "Alice", value: 100 },
                { name: "Bob", value: 80 },
                { name: "Charlie", value: 60 }
            ]
        },
        {
            date: "2024-01-03", // Different values - should be kept
            data: [
                { name: "Alice", value: 90 },
                { name: "Bob", value: 95 },
                { name: "Charlie", value: 70 }
            ]
        },
        {
            date: "2024-01-04", // Identical to previous - should be removed
            data: [
                { name: "Alice", value: 90 },
                { name: "Bob", value: 95 },
                { name: "Charlie", value: 70 }
            ]
        },
        {
            date: "2024-01-05", // Different values - should be kept
            data: [
                { name: "Alice", value: 85 },
                { name: "Bob", value: 100 },
                { name: "David", value: 75 }
            ]
        }
    ];

    fs.writeFileSync('sample_data_truncate.json', JSON.stringify(sampleFrames, null, 2));
    console.log('Sample data created in sample_data_truncate.json');
}

// Export for use as module
module.exports = {
    truncateData,
    createSampleData
};

// Command line usage
const path = "./src/components/TransferMarket/assets/data.json"
truncateData(path)
    .then(() => console.log('Truncation completed successfully'))
    .catch(error => {
        console.error('Truncation failed:', error.message);
        process.exit(1);
    });