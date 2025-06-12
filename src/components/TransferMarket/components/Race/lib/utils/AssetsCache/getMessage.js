import { rand } from "../math"

const messages = [
    "Loading Shaders...",
    "Compiling Vertex Buffers...",
    "Generating Mipmaps...",
    "Packing Texture Atlas...",
    "Initializing Physics Engine...",
    "Pre-caching Sound Effects...",
    "Loading Level Geometry...",
    "Generating Navigation Mesh...",
    "Initializing Particle Systems...",
    "Creating Occlusion Culling Data...",
    "Loading Animation Data...",
    "Pre-baking Lighting...",
    "Initializing AI Behaviors...",
    "Buffering Audio Streams...",
    "Compressing Texture Data...",
    "Building Collision Meshes...",
    "Loading UI Elements...",
    "Generating Procedural Content...",
    "Optimizing Draw Calls...",
    "Initializing Input Manager...",
    "Validating Asset Integrity...",
    "Loading Localization Data...",
    "Setting up Render Pipeline...",
    "Generating LODs...",
    "Initializing Scripting Engine...",
    "Pre-warming Shader Cache...",
    "Applying Post-Processing Effects...",
    "Loading Configuration Files...",
    "Initializing Network Manager...",
    "Setting up Game State...",
    "Loading Save Game Data...", //Optional - if applicable
    "Connecting to Backend Services...", //Optional - if online
    "Allocating Memory Buffers...",
    "Performing Garbage Collection (Initial)...",
    "Initializing Random Number Generator...",
    "Creating Scene Graph...",
    "Registering Game Objects...",
    "Initializing Event System...",
    "Setting up Camera Parameters...",
    "Loading Character Models...",
    "Preparing Instanced Rendering...",
    "Loading Cutscene Data...", //If Applicable
    "Initializing UI Framework...",
    "Decompressing Packed Assets...",
    "Rasterizing Vector Graphics...",
    "Building Quadtree...", // If using a quadtree
    "Building Octree...",  // If using an octree
    "Performing Dependency Injection...",
    "Initializing Profiler...",  // Dev-build only, perhaps
    "Setting up Debug Tools...", // Dev-build only, perhaps
    "Validating Game Logic...",
    "Loading Player Preferences...",
    "Generating Shadow Maps...",
    "Initializing Audio Mixer...",
    "Creating Material Instances...",
    "Loading Font Glyphs...",
    "Performing Asset Streaming...",
    "Optimizing Memory Footprint...",
    "Initializing Input Buffering...",
    "Setting up World Boundaries...",
    "Pre-calculating Physics Paths...",
    "Binding Textures to Samplers...",
	"Applying Anti-Aliasing...",
    "Tessellating Meshes...",
    "Warming up GPU...",
    "Fine-tuning Pixel Density...",
    "Calibrating Haptic Feedback...", //If applicable
    "Constructing BSP Tree...", // If using BSP
	"Pre-computing Ray Tracing Data...", //if using ray tracing
	"Linking Dynamic Libraries...",
	"Initializing Asynchronous Loading...",
	"Setting Render Targets...",
	"Binding Vertex Attributes...",
	"Creating Framebuffer Objects...",
    "Synchronizing Threads..." //Important for multithreaded loading
].map(x => x.toLowerCase())

let idx = rand(messages.length - 1, 0)
const getMessage = () => {
    idx = (idx + 1) % messages.length
    return messages[idx]
}

export default getMessage