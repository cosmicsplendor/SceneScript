const fs = require('fs');

// Configuration for follower entity
const FOLLOWER_CONFIG = {
    name: 'police',
    distanceBehind: 1, // Configurable value to stay behind the last entity
    enabled: true // Set to false to disable follower entity
};

/**
 * Add follower entity to all frames
 * @param {string} filePath - Path to the JSON file containing frames data
 */
async function addFollowerEntity(filePath) {
    try {
        // Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf8');
        const frames = JSON.parse(rawData);

        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Invalid data format: expected array of frames');
        }

        // Add follower entity to all frames if enabled
        if (FOLLOWER_CONFIG.enabled) {
            const framesWithFollower = frames.map(frame => {
                // Find the minimum value in current frame (worst performer)
                const minValue = Math.min(...frame.data.map(item => item.value));
                
                // Calculate follower value (behind the worst performer)
                const followerValue = minValue - FOLLOWER_CONFIG.distanceBehind;
                
                // Check if follower already exists
                const existingFollowerIndex = frame.data.findIndex(item => item.name === FOLLOWER_CONFIG.name);
                
                if (existingFollowerIndex !== -1) {
                    // Update existing follower
                    frame.data[existingFollowerIndex].value = followerValue;
                } else {
                    // Add new follower
                    frame.data.push({
                        name: FOLLOWER_CONFIG.name,
                        value: followerValue
                    });
                }
                
                return frame;
            });

            // Write back to the same file
            fs.writeFileSync(filePath, JSON.stringify(framesWithFollower, null, 2));
            console.log(`Successfully processed ${framesWithFollower.length} frames and saved to ${filePath}`);
            console.log(`Added follower entity "${FOLLOWER_CONFIG.name}" with distance ${FOLLOWER_CONFIG.distanceBehind} behind last entity`);
        } else {
            console.log('Follower entity is disabled');
        }

    } catch (error) {
        console.error('Error processing file:', error.message);
        throw error;
    }
}

/**
 * Update follower configuration
 * @param {string} name - Name of the follower entity
 * @param {number} distanceBehind - Distance to stay behind the last entity
 * @param {boolean} enabled - Whether to enable the follower
 */
function updateFollowerConfig(name = 'test', distanceBehind = 10, enabled = true) {
    FOLLOWER_CONFIG.name = name;
    FOLLOWER_CONFIG.distanceBehind = distanceBehind;
    FOLLOWER_CONFIG.enabled = enabled;
    
    console.log(`Follower configuration updated:`, FOLLOWER_CONFIG);
}

// Command line usage
const path = "./src/components/TransferMarket/assets/data.json"

// You can customize the follower before processing
// updateFollowerConfig('test', 15, true); // name, distanceBehind, enabled

addFollowerEntity(path)
    .then(() => console.log('Processing completed successfully'))
    .catch(error => {
        console.error('Processing failed:', error.message);
        process.exit(1);
    });