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
    
    // Keep only start and end points
    const startFrame = sortedFrames[0];
    const endFrame = sortedFrames[sortedFrames.length - 1];
    
    const startYear = startFrame.date;
    const endYear = endFrame.date;
    
    const repartitionedFrames = [];
    
    // Process each year from start to end
    for (let year = startYear; year <= endYear; year++) {
        const partitionCount = calculatePartitionCount(year, startYear);
        
        // Create partitions for this year
        for (let partition = 0; partition < partitionCount; partition++) {
            // Calculate interpolation factor for this specific frame
            const yearProgress = (year - startYear) / (endYear - startYear);
            const partitionProgress = partition / partitionCount;
            const totalProgress = yearProgress + (partitionProgress / (endYear - startYear + 1));
            
            const interpolatedData = interpolateData(
                startFrame.data,
                endFrame.data,
                totalProgress
            );
            
            repartitionedFrames.push({
                date: year, // Keep year as integer
                data: interpolatedData
            });
        }
    }
    
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
    const minPartitions = 12;
    
    const partitionCount = minPartitions + (maxPartitions - minPartitions) * Math.exp(-k * yearOffset);
    
    // Round to nearest integer and ensure minimum of 12
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
    // Create maps for easier lookup
    const startMap = new Map(startData.map(item => [item.name, item.value]));
    const endMap = new Map(endData.map(item => [item.name, item.value]));
    
    // Get all unique names from both datasets
    const allNames = new Set([...startMap.keys(), ...endMap.keys()]);
    
    const interpolatedData = [];
    
    for (const name of allNames) {
        const startValue = startMap.get(name) || 0; // Default to 0 if not present
        const endValue = endMap.get(name) || 0;     // Default to 0 if not present
        
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