import { AnimationData, ObjectDefinition } from ".";

// Generic helper to iterate through all objects in the sequence
function iterateObjects(animationData: AnimationData, callback: (obj: ObjectDefinition) => void) {
    if (!animationData.Sequence) return;

    for (const event of animationData.Sequence) {
        if (event.Objects) {
            for (const obj of event.Objects) {
                callback(obj);
            }
        }
    }
}

export default (animationData: AnimationData): AnimationData => {
    iterateObjects(animationData, (obj) => {
        // Logic: specific rule for Initial.Clip without Keyframes
        if (obj.Initial?.Clip && (!obj.Keyframes || obj.Keyframes.length === 0)) {
            obj.Keyframes = [
                [{
                    Time: 0,
                    Clip: obj.Initial.Clip
                }]
            ];
        }
    });

    return animationData;
}