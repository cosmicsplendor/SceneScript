import { AnimationData, ObjectDefinition, ObjectKeyframe, Position } from ".";

// Helper to ensure keyframes are in a consistent format (Array of Arrays)
function getTracks(obj: ObjectDefinition): ObjectKeyframe[][] {
    if (!obj.Keyframes) return [];
    if (obj.Keyframes.length === 0) return [];
    // Check if it's already an array of arrays (Parallel tracks)
    if (Array.isArray(obj.Keyframes[0])) {
        return obj.Keyframes as ObjectKeyframe[][];
    }
    // Single track, wrap it
    return [obj.Keyframes as ObjectKeyframe[]];
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

function addPositions(pos1: Position | undefined, pos2: Position | undefined): Position {
    const p1 = pos1 || { x: 0, y: 0, z: 0 };
    const p2 = pos2 || { x: 0, y: 0, z: 0 };
    return {
        x: (p1.x || 0) + (p2.x || 0),
        y: (p1.y || 0) + (p2.y || 0),
        z: (p1.z || 0) + (p2.z || 0),
    };
}

interface ParentMotionData {
    // Parallel tracks of parent position keyframes
    positionTracks: ObjectKeyframe[][];
}

function extractParentMotion(parent: ObjectDefinition): ParentMotionData {
    const tracks = getTracks(parent);
    const positionTracks: ObjectKeyframe[][] = [];

    for (const track of tracks) {
        const posKeyframes = track.filter(kf => kf.Position !== undefined);
        if (posKeyframes.length > 0) {
            positionTracks.push(posKeyframes);
        }
    }

    return { positionTracks };
}

function createChildObject(
    parent: ObjectDefinition,
    child: ObjectDefinition,
    parentMotion: ParentMotionData
): ObjectDefinition {
    const childObj = deepClone(child);
    
    // Generate unique ID by prefixing with parent ID
    childObj.ID = `${parent.ID}_${child.ID}`;

    // Merge initial positions (child position is relative to parent)
    if (childObj.Initial) {
        const parentInitialPos = parent.Initial?.pos || { x: 0, y: 0, z: 0 };
        const childInitialPos = childObj.Initial.pos || { x: 0, y: 0, z: 0 };
        childObj.Initial.pos = addPositions(parentInitialPos, childInitialPos);
    } else if (parent.Initial?.pos) {
        // Child has no Initial, inherit parent's position
        childObj.Initial = { pos: deepClone(parent.Initial.pos) };
    }

    // Handle keyframes
    const childTracks = getTracks(childObj);
    const hasChildKeyframes = childTracks.length > 0;

    if (parentMotion.positionTracks.length === 0) {
        // Parent has no motion, child is already correctly positioned
        return childObj;
    }

    // Parent has motion - we need to add it to the child
    if (!hasChildKeyframes) {
        // Child has no keyframes - create new tracks from parent motion
        const newTracks: ObjectKeyframe[][] = [];

        for (const parentTrack of parentMotion.positionTracks) {
            const childTrack: ObjectKeyframe[] = parentTrack.map(parentKf => {
                const childRelativePos = child.Initial?.pos || { x: 0, y: 0, z: 0 };
                return {
                    Time: parentKf.Time,
                    Position: addPositions(parentKf.Position, childRelativePos),
                    Easing: parentKf.Easing ? deepClone(parentKf.Easing) : undefined
                };
            });
            newTracks.push(childTrack);
        }

        childObj.Keyframes = newTracks;
    } else {
        // Child has keyframes - add parent motion as parallel tracks
        // This is the complex case where child has its own motion
        
        // Get child's relative offset from initial
        const childRelativePos = child.Initial?.pos || { x: 0, y: 0, z: 0 };

        // For each parent position track, create a corresponding track that adds parent motion
        const parentMotionTracks: ObjectKeyframe[][] = [];
        
        for (const parentTrack of parentMotion.positionTracks) {
            const translatedTrack: ObjectKeyframe[] = parentTrack.map(parentKf => ({
                Time: parentKf.Time,
                Position: addPositions(parentKf.Position, childRelativePos),
                Easing: parentKf.Easing ? deepClone(parentKf.Easing) : undefined
            }));
            parentMotionTracks.push(translatedTrack);
        }

        // Check if child has position keyframes in any track
        const childHasPositionKeyframes = childTracks.some(track => 
            track.some(kf => kf.Position !== undefined)
        );

        if (childHasPositionKeyframes) {
            // Merge: child's keyframes + parent's motion tracks
            // This means the child will have its own motion AND follow the parent
            // Note: The rendering system will need to handle multiple position tracks appropriately
            // For now, we add them as parallel tracks (the system should sum or use the last defined)
            childObj.Keyframes = [...childTracks, ...parentMotionTracks];
        } else {
            // Child has keyframes but none are position-based (e.g., only Alpha, Scale, etc.)
            // Add parent motion as parallel tracks
            childObj.Keyframes = [...childTracks, ...parentMotionTracks];
        }
    }

    return childObj;
}

export default (animationData: AnimationData): AnimationData => {
    if (!animationData.Sequence) return animationData;

    for (const event of animationData.Sequence) {
        if (!event.Objects || event.Objects.length === 0) continue;

        const newObjects: ObjectDefinition[] = [];
        const objectsToRemove: Set<string> = new Set();

        for (const obj of event.Objects) {
            // Check if object has children (either Children or SceneGraph property)
            const children = (obj as any).Children || (obj as any).SceneGraph;
            
            if (!children || !Array.isArray(children) || children.length === 0) {
                // No children, keep as-is
                newObjects.push(obj);
                continue;
            }

            // Object has children - process them
            const parentMotion = extractParentMotion(obj);

            // Create the parent object without the Children/SceneGraph property
            const parentObj = deepClone(obj);
            delete (parentObj as any).Children;
            delete (parentObj as any).SceneGraph;
            newObjects.push(parentObj);

            // Process each child
            for (const child of children) {
                const childObj = createChildObject(obj, child, parentMotion);
                newObjects.push(childObj);
            }
        }

        // Replace objects array with processed objects
        event.Objects = newObjects;
    }

    return animationData;
}