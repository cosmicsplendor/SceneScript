const fs = require('fs');

/**
 * Repartition data frames with exponentially decreasing partitions
 * @param {Array} frames - Array of frame objects with date and data fields
 * @returns {Array} Repartitioned frames with interpolated values
 */
function repartition(frames) {
    if (!Array.isArray(frames) || frames.length < 2) {
        // Need at least two years of data to interpolate between.
        throw new Error('Invalid data format: expected an array of at least two frame objects');
    }

    // Convert date strings to numbers for reliable sorting and create a deep copy.
    const framesWithNumericDates = frames.map(f => ({
        ...f,
        date: parseInt(f.date, 10)
    }));
    
    // Sort frames by date to ensure proper ordering
    const sortedFrames = framesWithNumericDates.sort((a, b) => a.date - b.date);
    
    // Group frames by year and keep only the LAST frame for each year.
    // This consolidated view represents the 'end-of-year' state for interpolation.
    const yearEndFrames = {};
    sortedFrames.forEach(frame => {
        const year = frame.date;
        yearEndFrames[year] = frame;
    });
    
    // Create a sorted array of these 'end-of-year' anchor points.
    const yearlyAnchorPoints = Object.values(yearEndFrames).sort((a, b) => a.date - b.date);

    const repartitionedFrames = [];
    const startYearGlobal = yearlyAnchorPoints[0].date;

    // --- LOGIC FIX: Iterate through pairs of anchor points ---
    // We interpolate FROM the previous year's end-state TO the current year's end-state.
    // The loop starts at the second anchor point (i=1).
    for (let i = 1; i < yearlyAnchorPoints.length; i++) {
        const startAnchor = yearlyAnchorPoints[i-1];
        const endAnchor = yearlyAnchorPoints[i];

        const startData = startAnchor.data;
        const endData = endAnchor.data;
        const currentYear = endAnchor.date;

        const partitionCount = calculatePartitionCount(currentYear, startYearGlobal);
        
        for (let p = 0; p < partitionCount; p++) {
            // FIX: Use (p + 1) to ensure the last frame hits the target value exactly.
            // This creates a smooth, continuous motion across year boundaries.
            // progress will go from (1/N) to (N/N = 1).
            const progress = (p + 1) / partitionCount; 
            
            const interpolatedData = interpolateData(
                startData,
                endData,
                progress
            );
            
            repartitionedFrames.push({
                // Convert date back to string to match original format
                date: String(currentYear), 
                data: interpolatedData
            });
        }
    }

    // OPTIONAL: To avoid an abrupt start, you can add a few static frames
    // of the very first year's data at the beginning of the animation.
    const firstAnchorData = {
        date: String(yearlyAnchorPoints[0].date),
        data: yearlyAnchorPoints[0].data
    };
    // Add 3 static frames at the start to establish a baseline
    repartitionedFrames.unshift(firstAnchorData, firstAnchorData, firstAnchorData);
    
    return repartitionedFrames;
}

/**
 * Calculate partition count for a given year using exponential decay
 * @param {number} currentYear - Current year being processed
 * @param {number} startYear - The first year in the entire dataset
 * @returns {number} Number of partitions for this year
 */
function calculatePartitionCount(currentYear, startYear) {
    const yearOffset = currentYear - startYear;
    
    // Exponential decay from 24 down towards 12 partitions
    const k = 0.15; // Decay constant (adjust for faster/slower transition)
    
    // --- BUG FIX: Use correct min/max values ---
    const maxPartitions = 3;
    const minPartitions = 3; 
    
    const partitionCount = minPartitions + (maxPartitions - minPartitions) * Math.exp(-k * yearOffset);
    
    // Round to nearest integer and ensure it doesn't go below the minimum
    return Math.max(Math.round(partitionCount), minPartitions);
}

/**
 * Interpolate data between start and end frames
 * @param {Array} startData - Starting frame data
 * @param {Array} endData - Ending frame data
 * @param {number} progress - Interpolation progress (0 to 1)
 * @returns {Array} Interpolated data array
 */
function interpolateData(startData, endData, progress) {
    // This function was already correct, no changes needed here.
    const startMap = new Map(startData.map(item => [item.name, item.value]));
    const endMap = new Map(endData.map(item => [item.name, item.value]));
    
    const allNames = new Set([...startMap.keys(), ...endMap.keys()]);
    
    const interpolatedData = [];
    
    for (const name of allNames) {
        const startValue = startMap.get(name) || 0; 
        const endValue = endMap.get(name) || 0;     
        
        const interpolatedValue = startValue + (endValue - startValue) * progress;
        const roundedValue = Math.round(interpolatedValue);
        
        interpolatedData.push({
            name: name,
            value: roundedValue
        });
    }
    
    return interpolatedData.sort((a, b) => b.value - a.value);
}
/**
 * Apply repartitioning to a JSON file
 * @param {string} filePath - Path to the JSON file containing frames data
 */
async function applyRepartition(filePath) {
    try {
        // Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf8');
        const frames = JSON.parse(rawData);

        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Invalid data format: expected array of frames');
        }

        // Apply repartitioning
        const repartitionedFrames = repartition(frames);

        // Write back to the same file
        fs.writeFileSync(filePath, JSON.stringify(repartitionedFrames, null, 2));
        console.log(`Successfully repartitioned ${repartitionedFrames.length} frames and saved to ${filePath}`);

        return repartitionedFrames;
    } catch (error) {
        console.error('Error repartitioning file:', error.message);
        throw error;
    }
}

// Main execution
const path = "./src/components/TransferMarket/assets/data.json";
applyRepartition(path)
    .then(() => console.log('Repartitioning completed successfully'))
    .catch(error => {
        console.error('Repartitioning failed:', error.message);
        process.exit(1);
    });