const fs = require('fs');

// Configuration constants
const MAX_DELTA_CHANGE = 100;
const MAX_SLOWDOWN = 2;
const BASE_CHANGE_FACTOR = 0.125;
const INTERPOLATION_TYPE = 'exponential'; // 'linear' or 'exponential'

/**
 * Apply slowdown factor to input data frames based on position changes
 * @param {string} filePath - Path to the JSON file containing frames data
 */
async function applySlowDownFactor(filePath) {
    try {
        // Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf8');
        const frames = JSON.parse(rawData);

        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Invalid data format: expected array of frames');
        }

        // Process frames
        const processedFrames = processFrames(frames);

        // Write back to the same file
        fs.writeFileSync(filePath, JSON.stringify(processedFrames, null, 2));
        console.log(`Successfully processed ${processedFrames.length} frames and saved to ${filePath}`);

        return processedFrames;
    } catch (error) {
        console.error('Error processing file:', error.message);
        throw error;
    }
}

/**
 * Process all frames and add slowDown factors
 * @param {Array} frames - Array of frame objects
 * @returns {Array} Processed frames with slowDown factors
 */
function processFrames(frames) {
    const processedFrames = [];

    for (let i = 0; i < frames.length; i++) {
        const currentFrame = frames[i];

        if (i === 0) {
            // First frame: no slowdown applied
            processedFrames.push({
                ...currentFrame,
                slowDown: 1
            });
        } else {
            const previousFrame = frames[i - 1];
            const slowDown = calculateSlowDown(previousFrame, currentFrame);

            processedFrames.push({
                ...currentFrame,
                slowDown: slowDown
            });
        }
    }

    return processedFrames;
}

/**
 * Calculate slowdown factor based on position changes between frames
 * @param {Object} previousFrame - Previous frame data
 * @param {Object} currentFrame - Current frame data
 * @returns {number} Slowdown factor
 */
function calculateSlowDown(previousFrame, currentFrame) {
    // Create position maps for both frames
    const prevPositions = createPositionMap(previousFrame.data);
    const currPositions = createPositionMap(currentFrame.data);

    // Get all unique players from both frames
    const allPlayers = new Set([
        ...Object.keys(prevPositions),
        ...Object.keys(currPositions)
    ]);

    let totalPositionChange = 0;

    // Calculate position changes for each player
    for (const player of allPlayers) {
        const prevPos = prevPositions[player];
        const currPos = currPositions[player];

        let prevPosition, currPosition;

        if (prevPos === undefined) {
            // Newcomer: previous position is length + 1
            prevPosition = previousFrame.data.length + 1;
        } else {
            prevPosition = prevPos;
        }

        if (currPos === undefined) {
            // Dropout: current position is length + 1
            currPosition = currentFrame.data.length + 1;
        } else {
            currPosition = currPos;
        }

        // Add absolute position change
        totalPositionChange += Math.abs(currPosition - prevPosition);
    }

    // Calculate slowdown factor
    if (totalPositionChange === 0) {
        return 1; // No change
    }

    // Base slowdown: 1 + 0.25 for any change
    let slowDown = 1 + BASE_CHANGE_FACTOR;

    // Apply interpolation based on total position change
    const normalizedChange = Math.min(totalPositionChange / MAX_DELTA_CHANGE, 1);

    if (INTERPOLATION_TYPE === 'linear') {
        // Linear interpolation from base slowdown to max slowdown
        const additionalSlowdown = normalizedChange * (MAX_SLOWDOWN - slowDown);
        slowDown += additionalSlowdown;
    } else if (INTERPOLATION_TYPE === 'exponential') {
        // Exponential interpolation (more gradual at first, steeper later)
        const exponentialFactor = Math.pow(normalizedChange, 2);
        const additionalSlowdown = exponentialFactor * (MAX_SLOWDOWN - slowDown);
        slowDown += additionalSlowdown;
    }

    // Ensure slowdown doesn't exceed maximum
    return Math.min(slowDown, MAX_SLOWDOWN);
}

/**
 * Create a position map from frame data (name -> position)
 * @param {Array} data - Array of {name, value} objects
 * @returns {Object} Map of name to position (1-based)
 */
function createPositionMap(data) {
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const positionMap = {};

    sortedData.forEach((item, index) => {
        positionMap[item.name] = index + 1; // 1-based position
    });

    return positionMap;
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
            date: "2024-01-02",
            data: [
                { name: "Alice", value: 90 },
                { name: "Bob", value: 95 },
                { name: "Charlie", value: 70 }
            ]
        },
        {
            date: "2024-01-03",
            data: [
                { name: "Alice", value: 85 },
                { name: "Bob", value: 100 },
                { name: "David", value: 75 }
            ]
        }
    ];

    fs.writeFileSync('sample_data.json', JSON.stringify(sampleFrames, null, 2));
    console.log('Sample data created in sample_data.json');
}

// Export for use as module
module.exports = {
    applySlowDownFactor,
    createSampleData
};

// Command line usage
// const args = process.argv.slice(2);

// if (args.length === 0) {
//     console.log('Usage: node slowdown.js <json_file_path>');
//     console.log('Or: node slowdown.js --create-sample');
//     process.exit(1);
// }

// if (args[0] === '--create-sample') {
//     createSampleData();
// } else {
const path = "./src/components/TransferMarket/assets/data.json"
applySlowDownFactor(path)
    .then(() => console.log('Processing completed successfully'))
    .catch(error => {
        console.error('Processing failed:', error.message);
        process.exit(1);
    });
// }