const fs = require('fs');

/**
 * Repartition data frames with exponentially decreasing partitions
 * @param {Array} frames - Array of frame objects with date and data fields
 * @returns {Array} Repartitioned frames with interpolated values
 */
function repartition(frames) {
    if (!Array.isArray(frames) || frames.length === 0) {
        throw new Error('Invalid data format: expected array of frames');
    }

    // Sort frames by date to ensure proper ordering
    const sortedFrames = [...frames].sort((a, b) => a.date - b.date);
    
    // Group frames by year and keep only the LAST frame for each year.
    // This consolidated view represents the 'end-of-year' state for interpolation.
    // E.g., { 1992: frame_1992_last, 1993: frame_1993_last, ... }
    const yearEndFrames = {};
    sortedFrames.forEach(frame => {
        const year = frame.date;
        yearEndFrames[year] = frame; // Overwrite with the latest frame for this year
    });
    
    // Create a sorted array of these 'end-of-year' anchor points.
    // These are the specific data points that define the state at the end of each year.
    const yearlyAnchorPoints = Object.keys(yearEndFrames)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(year => yearEndFrames[year]);
    
    const repartitionedFrames = [];
    
    // The global start year for the partition decay calculation.
    const startYearGlobal = yearlyAnchorPoints[0].date;

    // Initialize the starting data for the very first interpolation segment.
    // This is the data from the first original frame of the entire dataset (e.g., beginning of 1992).
    let prevEffectiveData = sortedFrames[0].data; 
    
    // Iterate through each 'end-of-year' anchor point.
    // For each currentYearEndFrame, we will interpolate from `prevEffectiveData`
    // up to (but not including) the `currentYearEndFrame.data`.
    // The `currentYearEndFrame.data` will then become the `prevEffectiveData` for the *next* year's segment.
    for (let i = 0; i < yearlyAnchorPoints.length; i++) {
        const currentYearEndFrame = yearlyAnchorPoints[i]; 
        const currentYear = currentYearEndFrame.date;
        
        // The data that we are interpolating *towards* for this year segment.
        const interpolationTargetData = currentYearEndFrame.data;

        // Calculate the total number of frames (partitions) for this current year.
        const partitionCount = calculatePartitionCount(currentYear, startYearGlobal);
        
        // Generate `partitionCount` frames for the current year.
        // The progress `p / partitionCount` ensures that:
        // - The first frame (p=0) starts exactly from `prevEffectiveData`.
        // - The last frame (p=partitionCount-1) interpolates up to `(partitionCount-1)/partitionCount` towards `interpolationTargetData`.
        // - Crucially, `interpolationTargetData` itself is not reached within this year's frames.
        //   It will be reached *as the starting point* of the next year's first frame.
        for (let p = 0; p < partitionCount; p++) {
            // This is the key change for smooth transition: progress goes from 0 up to (N-1)/N
            const progress = p / partitionCount; 
            
            const interpolatedData = interpolateData(
                prevEffectiveData,
                interpolationTargetData,
                progress
            );
            
            repartitionedFrames.push({
                date: currentYear, 
                data: interpolatedData
            });
        }
        
        // Update `prevEffectiveData` for the next year's interpolation.
        // The next year's first frame will start exactly from the `interpolationTargetData` of the current year.
        // This creates a seamless transition without duplicate frames at year boundaries.
        prevEffectiveData = interpolationTargetData;
    }

    // IMPORTANT CONSIDERATION FOR THE VERY LAST FRAME OF THE ANIMATION:
    // With the current `progress = p / partitionCount` logic, the last frame of the entire repartitioned set
    // will *not* precisely hit the `yearlyAnchorPoints[last].data` (the absolute final data point),
    // but rather be `(N-1)/N` interpolated towards it.
    // If you need the *exact* final state to be included as the very last frame for a "settling" effect,
    // uncomment the block below. Be aware that adding this frame might cause a visual "stop" at the very end
    // of your animation sequence, as there's no further frame to transition into.
    /*
    if (yearlyAnchorPoints.length > 0) {
        const lastAnchorFrame = yearlyAnchorPoints[yearlyAnchorPoints.length - 1];
        repartitionedFrames.push({
            date: lastAnchorFrame.date,
            data: [...lastAnchorFrame.data] // Add the exact final data point
        });
    }
    */
    
    return repartitionedFrames;
}

/**
 * Calculate partition count for a given year using exponential decay
 * @param {number} currentYear - Current year being processed
 * @param {number} startYear - Starting year (1992)
 * @returns {number} Number of partitions for this year
 */
function calculatePartitionCount(currentYear, startYear) {
    const yearOffset = currentYear - startYear;
    
    // Exponential decay from 24 to 12 partitions
    // Formula: 12 + (24 - 12) * e^(-k * yearOffset)
    // where k is chosen so that we reach near 12 partitions in 10-15 years
    const k = 0.15; // Decay constant (adjust for faster/slower transition)
    const maxPartitions = 24;
    const minPartitions = 12; // Corrected typo here
    
    const partitionCount = minPartitions + (maxPartitions - minPartitions) * Math.exp(-k * yearOffset); // Corrected typo here
    
    // Round to nearest integer and ensure minimum of 12
    return Math.max(Math.round(partitionCount), minPartitions); // Corrected typo here
}

/**
 * Interpolate data between start and end frames
 * @param {Array} startData - Starting frame data
 * @param {Array} endData - Ending frame data
 * @param {number} progress - Interpolation progress (0 to 1)
 * @returns {Array} Interpolated data array
 */
function interpolateData(startData, endData, progress) {
    // Create maps for easier lookup
    const startMap = new Map(startData.map(item => [item.name, item.value]));
    const endMap = new Map(endData.map(item => [item.name, item.value]));
    
    // Get all unique names from both datasets
    const allNames = new Set([...startMap.keys(), ...endMap.keys()]);
    
    const interpolatedData = [];
    
    for (const name of allNames) {
        // Use 0 if a value is not present in one of the datasets.
        // This ensures new entries fade in from 0 and disappearing entries fade out to 0.
        const startValue = startMap.get(name) || 0; 
        const endValue = endMap.get(name) || 0;     
        
        // Linear interpolation
        const interpolatedValue = startValue + (endValue - startValue) * progress;
        
        // Round to nearest integer
        const roundedValue = Math.round(interpolatedValue);
        
        interpolatedData.push({
            name: name,
            value: roundedValue
        });
    }
    
    // Sort by value descending to maintain consistent ordering
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