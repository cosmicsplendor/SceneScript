const vertexShaderSrc = 
`#version 300 es
precision mediump float;
in vec2 aPosition;
in vec2 aTexCoord;

in vec2 aOffset;
in vec2 aScale;
in vec2 aTexOffset;
in vec2 aTexScale;
in float aFogFactor;
in float alpha;
in float aRotation;
uniform vec2 uCanvasSize;

out vec2 vTexCoord;
out float vFogFactor;
out float vAlpha;

void main() {
    // First scale, then shift origin to bottom-center
    vec2 scaledPos = aPosition * aScale;

    // Shift origin to bottom center instead of center
    vec2 centered = scaledPos - vec2(aScale.x * 0.5, 0.0);

    // Apply rotation
    float cosA = cos(aRotation);
    float sinA = sin(aRotation);
    mat2 rotationMatrix = mat2(cosA, -sinA, sinA, cosA);
    vec2 rotated = rotationMatrix * centered;

    // Move back and add offset
    vec2 finalPos = rotated + vec2(aScale.x * 0.5, 0.0) + aOffset;

    // Convert to clip space
    vec2 normalizedPos = (finalPos / uCanvasSize) * 2.0 - 1.0;
    gl_Position = vec4(normalizedPos * vec2(1, -1), 0, 1);

    vTexCoord = aTexCoord * aTexScale + aTexOffset;
    vAlpha = alpha;
    vFogFactor = aFogFactor;
}`

export default vertexShaderSrc