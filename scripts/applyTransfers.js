const fs = require('fs');

// Configuration constants
const DATA_PATH = "./src/components/TransferMarket/assets/data.json";
const LOGOS_MAP_PATH = "./src/components/TransferMarket/assets/logosMap.json";
const FRAMES_PRIOR_TO_CHANGE = 5;
const TRANSFER_SLOWDOWN_FACTOR = 3;

/**
 * Apply transfer effects to data frames based on club changes
 * @param {string} dataFilePath - Path to the JSON file containing frames data
 * @param {string} logosMapPath - Path to the logos map JSON file
 */
async function applyTransferEffects(dataFilePath = DATA_PATH, logosMapPath = LOGOS_MAP_PATH) {
    try {
        // Read the data file
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        const frames = JSON.parse(rawData);

        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Invalid data format: expected array of frames');
        }

        // Read the logos map
        const logosMapData = fs.readFileSync(logosMapPath, 'utf8');
        const logosMap = JSON.parse(logosMapData);

        console.log(`Processing ${frames.length} frames for club changes...`);

        // Process frames to identify club changes and apply effects
        const processedFrames = processTransferEffects(frames, logosMap);

        // Write back to the same file
        fs.writeFileSync(dataFilePath, JSON.stringify(processedFrames, null, 2));
        console.log(`Successfully processed transfer effects and saved to ${dataFilePath}`);

        return processedFrames;
    } catch (error) {
        console.error('Error processing transfer effects:', error.message);
        throw error;
    }
}

/**
 * Process all frames to identify club changes and apply transfer effects
 * @param {Array} frames - Array of frame objects
 * @param {Object} logosMap - Map of club names to logo sources
 * @returns {Array} Processed frames with transfer effects
 */
function processTransferEffects(frames, logosMap) {
    const processedFrames = [...frames];
    const clubChanges = identifyClubChanges(frames);

    console.log(`Found ${clubChanges.length} club changes to process`);

    // Apply effects for each club change
    clubChanges.forEach(change => {
        const { playerName, frameIndex, destClub, srcClub } = change;

        console.log(`Processing transfer: ${playerName} from ${srcClub} to ${destClub} at frame ${frameIndex}`);

        // Apply effects to only the fifth frame prior to the club change (the earliest one)
        const targetFrameIndex = frameIndex - FRAMES_PRIOR_TO_CHANGE;

        if (targetFrameIndex >= 0) {
            applyTransferEffectToFrame(
                processedFrames[targetFrameIndex],
                playerName,
                destClub,
                logosMap
            );
        }
    });

    return processedFrames;
}

/**
 * Identify all club changes in the frames
 * @param {Array} frames - Array of frame objects
 * @returns {Array} Array of club change objects
 */
function identifyClubChanges(frames) {
    const clubChanges = [];

    for (let frameIndex = FRAMES_PRIOR_TO_CHANGE; frameIndex < frames.length; frameIndex++) {
        const currentFrame = frames[frameIndex];

        // Check each player in the current frame
        currentFrame.data.forEach(player => {
            const { name: playerName, club: currentClub } = player;

            // Check if player was present in the last 5 frames with a different club
            const playerHistory = getPlayerHistory(frames, frameIndex, playerName, FRAMES_PRIOR_TO_CHANGE);

            if (playerHistory.length === FRAMES_PRIOR_TO_CHANGE) {
                // Player was present in all 5 previous frames
                const previousClub = playerHistory[playerHistory.length - 1].club;

                if (previousClub !== currentClub) {
                    // Club change detected
                    clubChanges.push({
                        playerName,
                        frameIndex,
                        srcClub: previousClub,
                        destClub: currentClub
                    });
                }
            }
        });
    }

    return clubChanges;
}

/**
 * Get player history for the specified number of frames prior to current frame
 * @param {Array} frames - Array of frame objects
 * @param {number} currentFrameIndex - Index of the current frame
 * @param {string} playerName - Name of the player
 * @param {number} frameCount - Number of frames to look back
 * @returns {Array} Array of player data from previous frames
 */
function getPlayerHistory(frames, currentFrameIndex, playerName, frameCount) {
    const history = [];

    for (let i = 1; i <= frameCount; i++) {
        const frameIndex = currentFrameIndex - i;

        if (frameIndex >= 0) {
            const frame = frames[frameIndex];
            const playerData = frame.data.find(p => p.name === playerName);

            if (playerData) {
                history.unshift(playerData); // Add to beginning to maintain chronological order
            } else {
                // Player not found in this frame, break the chain
                break;
            }
        }
    }

    return history;
}

/**
 * Apply transfer effects to a specific frame
 * @param {Object} frame - Frame object to modify
 * @param {string} playerName - Name of the player transferring
 * @param {string} destClub - Destination club name
 * @param {Object} logosMap - Map of club names to logo sources
 */
function applyTransferEffectToFrame(frame, playerName, destClub, logosMap) {
    // Initialize effects array if not present
    if (!frame.effects) {
        frame.effects = [];
    }

    // Set slowdown factor
    frame.slowDown = TRANSFER_SLOWDOWN_FACTOR;

    // Get destination club logo source
    const destClubLogoSrc = logosMap[destClub];

    if (!destClubLogoSrc) {
        console.warn(`Warning: No logo found for club "${destClub}"`);
    }

    // Add transfer lottie indicator
    const lottieEffect = {
        type: "lottie",
        targetEl: "logo",
        target: playerName,
        anim: "boost1",
        duration: 1.8,
        height: 72,
        offsetX: 265
    };

    // Add destination club indicator
    const clubIndicatorEffect = {
        type: "image",
        targetEl: "logo",
        offsetX: 420,
        duration: 2,
        target: playerName,
        src: destClubLogoSrc,
        height: 64,
        pulseAmp: 0,
        pulseFreq: 0
    };

    // Check if effects already exist for this player to avoid duplicates
    const existingLottieEffect = frame.effects.find(
        effect => effect.type === "lottie" && effect.target === playerName
    );
    const existingClubEffect = frame.effects.find(
        effect => effect.type === "image" && effect.target === playerName
    );

    if (!existingLottieEffect) {
        frame.effects.push(lottieEffect);
    }

    if (!existingClubEffect) {
        frame.effects.push(clubIndicatorEffect);
    }
}

/**
 * Create sample data for testing
 */
function createSampleTransferData() {
    const sampleFrames = [
        {
            date: "2024-01-01",
            data: [
                { name: "Lamine Yamal", value: 195955527, club: "FC Barcelona" },
                { name: "Erling Haaland", value: 182807527, club: "Manchester City" },
                { name: "Kylian Mbappe", value: 175000000, club: "Paris Saint-Germain" }
            ],
            slowDown: 1
        },
        {
            date: "2024-01-02",
            data: [
                { name: "Lamine Yamal", value: 195955527, club: "FC Barcelona" },
                { name: "Erling Haaland", value: 182807527, club: "Manchester City" },
                { name: "Kylian Mbappe", value: 175000000, club: "Paris Saint-Germain" }
            ],
            slowDown: 1
        },
        {
            date: "2024-01-03",
            data: [
                { name: "Lamine Yamal", value: 195955527, club: "FC Barcelona" },
                { name: "Erling Haaland", value: 182807527, club: "Manchester City" },
                { name: "Kylian Mbappe", value: 175000000, club: "Paris Saint-Germain" }
            ],
            slowDown: 1
        },
        {
            date: "2024-01-04",
            data: [
                { name: "Lamine Yamal", value: 195955527, club: "FC Barcelona" },
                { name: "Erling Haaland", value: 182807527, club: "Manchester City" },
                { name: "Kylian Mbappe", value: 175000000, club: "Paris Saint-Germain" }
            ],
            slowDown: 1
        },
        {
            date: "2024-01-05",
            data: [
                { name: "Lamine Yamal", value: 195955527, club: "FC Barcelona" },
                { name: "Erling Haaland", value: 182807527, club: "Manchester City" },
                { name: "Kylian Mbappe", value: 175000000, club: "Paris Saint-Germain" }
            ],
            slowDown: 1
        },
        {
            date: "2024-01-06",
            data: [
                { name: "Lamine Yamal", value: 195955527, club: "FC Barcelona" },
                { name: "Erling Haaland", value: 182807527, club: "Manchester City" },
                { name: "Kylian Mbappe", value: 180000000, club: "Real Madrid" } // Transfer!
            ],
            slowDown: 1
        }
    ];

    const sampleLogosMap = {
        "FC Barcelona": "/logos/barcelona.png",
        "Manchester City": "/logos/manchester-city.png",
        "Paris Saint-Germain": "/logos/psg.png",
        "Real Madrid": "/logos/real-madrid.png"
    };

    fs.writeFileSync('sample_transfer_data.json', JSON.stringify(sampleFrames, null, 2));
    fs.writeFileSync('sample_logos_map.json', JSON.stringify(sampleLogosMap, null, 2));
    console.log('Sample transfer data created in sample_transfer_data.json');
    console.log('Sample logos map created in sample_logos_map.json');
}

// Export for use as module
module.exports = {
    applyTransferEffects,
    createSampleTransferData
};

// Command line usage
const args = process.argv.slice(2);

if (args.length === 0) {
    // Default execution
    applyTransferEffects()
        .then(() => console.log('Transfer effects processing completed successfully'))
        .catch(error => {
            console.error('Transfer effects processing failed:', error.message);
            process.exit(1);
        });
} else if (args[0] === '--create-sample') {
    createSampleTransferData();
} else if (args[0] === '--help') {
    console.log('Usage: node apply_transfer.js [options]');
    console.log('Options:');
    console.log('  --create-sample  Create sample data for testing');
    console.log('  --help          Show this help message');
    console.log('  (no args)       Process the default data file');
} else {
    console.log('Unknown option. Use --help for usage information.');
    process.exit(1);
}