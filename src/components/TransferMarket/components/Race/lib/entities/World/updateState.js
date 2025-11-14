// ADDED: Use this constant to shift the entire road rendering horizontally.
// Value is in pixels. Positive values shift right, negative values shift left.
const ROAD_X_OFFSET = 0;

function updateState(world, fogFactorCache, viewport, dt) {
    const { z, x, yOffset: y } = world.getCameraFocusPosition();
    const { rumbles, segmentLength, roadWidth, drawDistance, road: { data }, cameraHeight, cameraDepth, segments, atlasMeta, zOffset, yScale, spriteScale, ORIGIN_Y } = world;
    data.length = 0;
    const baseSegment = world.findSegment(z + zOffset);
    world.baseSegment = baseSegment;
    // Update camera y-position to follow subject height
    world.y = y + cameraHeight;
    world.syncSeg(baseSegment);
    const relIndex = baseSegment - world.firstSegmentIndex;
    const curSeg = segments[relIndex];
    const nextSeg = segments[relIndex + 1];
    if (!nextSeg || !curSeg) {
        return;
    }
    
    for (let i = relIndex; i < relIndex + 3; i++) {
        const testSeg = segments[i];
        if (testSeg && testSeg.vibe && testSeg.pendingVibe) {
            if (world.lastVibeZ === testSeg.z) world.vibeTransition.add(testSeg.vibe);
            testSeg.pendingVibe = undefined;
        }
    }
    
    world.syncCamera(curSeg, nextSeg, dt);
    
    world.curveSlope = nextSeg.curve - curSeg.curve;

    let maxY = Infinity;
    let cumulativeCurve = 0;
    let prevM = segments[relIndex - 1]?.h || 0;
    
    if (world.prlx) {
        const prevX = segments[relIndex - 1]?.curve || 0;
        const prevH = segments[relIndex - 1]?.h || 0;
        world.prlx.update(dt, curSeg.curve - prevX, curSeg.h - prevH, ORIGIN_Y, viewport);
    }
    if (world.lprlx && world.prlx !== world.lprlx) {
        world.lprlx.exit(dt);
    }
    
    let previousOffset = 0;
    for (let n = baseSegment; n < baseSegment + drawDistance; n++) {
    // for (let n = baseSegment + drawDistance - 1; n >= baseSegment; n--) {
        const relIndex = n - world.firstSegmentIndex;
        const segmentData = segments[relIndex];
        if (!segmentData) continue;

        const fogFactor = fogFactorCache.get(n - baseSegment, world.drawDistance, world.fogDensity);
        const zCoord = n * segmentLength;
        const yCoord = segmentData.h;

        cumulativeCurve += segmentData.curve ?? 0;

        const iter = n - baseSegment;
        const currentOffset = cumulativeCurve * iter;
        const smoothOffset = world.interpolateOffsets(previousOffset, currentOffset, 0.5);
        previousOffset = smoothOffset;

        const xOffset = smoothOffset;
        const cameraX = -(x * roadWidth * 2 * viewport.invWidth) + xOffset;
        const cameraY = (yCoord - world.y) * yScale * viewport.invHeight;
        const cameraZ = zCoord - (z + zOffset);
        const scalingFactor = cameraDepth / cameraZ;
        const projectionX = scalingFactor * cameraX;
        const projectionY = scalingFactor * cameraY;

        const dLayer = world.dLayers.segments[iter];
        dLayer.clipY = maxY;
        dLayer.fogF = fogFactor;
        dLayer.xOffset = xOffset;
        dLayer.m = segmentData.h - prevM;
        prevM = segmentData.h;

        if (cameraZ < 0) continue;

        // CHANGED: Added ROAD_X_OFFSET to the final screenX calculation.
        const screenX = (1 + projectionX) * viewport.sWidth * 0.5 + ROAD_X_OFFSET;
        const rScreenY = (1 - projectionY) * viewport.sHeight * ORIGIN_Y;
        maxY = Math.min(maxY, rScreenY);
        const screenY = maxY;

        const width = scalingFactor * roadWidth;
        const colIdex = Math.floor(n / rumbles) % 2;
        if (segmentData.road) {
            data.dataIndex = data.length;
        }
        data.push(screenX, screenY, width, colIdex, fogFactor, segmentData.road);
        if (Array.isArray(segmentData.o)) {
            const objects = segmentData.o;
            for (let ind = 0; ind < objects.length; ind++) {
                const ob = objects[ind];
                // The object's 'destX' is calculated from 'screenX', so it will automatically
                // be shifted along with the road. No changes needed here.
                const destX = screenX + width * ob.x;
                const frame = atlasMeta[ob.f];
                if (!frame) {
                    console.log(ob)
                    console.log(ob.f);
                    console.log(atlasMeta)
                }
                const scale = scalingFactor * spriteScale * (ob.s ? ob.s : 1);
                let sourceH = frame.height;
                let destH = frame.height * scale;
                const destW = frame.width * scale;
                const y = ob.h ? rScreenY - ob.h * scalingFactor : rScreenY;
                const destY = y - destH;
                if (y > screenY) {
                    const clip = Math.min(y - screenY, destH);
                    sourceH = (1 - clip / destH) * sourceH;
                    destH -= clip;
                }
                ob.srcH = sourceH;
                ob.destH = destH;
                ob.destX = destX - destW * 0.5;
                ob.destY = destY;
                ob.destW = destW;
                ob.fogF = fogFactor;
            }
        }
    }
}

export default updateState;