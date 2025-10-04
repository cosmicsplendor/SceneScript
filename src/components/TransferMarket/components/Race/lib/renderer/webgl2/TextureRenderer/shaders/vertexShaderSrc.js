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
in vec2 aAnchor; // normalized anchor (0,0 = top-left, 1,1 = bottom-right)

uniform vec2 uCanvasSize;

out vec2 vTexCoord;
out float vFogFactor;
out float vAlpha;

void main() {
    // Scale the vertex to world size
    vec2 scaledPos = aPosition * aScale;

    // Convert anchor from normalized (0–1, top-left origin)
    // to local-space pivot position.
    vec2 pivot = vec2(aScale.x * aAnchor.x, aScale.y * (1.0 - aAnchor.y));

    // Rotate around the pivot
    float cosA = cos(aRotation);
    float sinA = sin(aRotation);
    mat2 rotationMatrix = mat2(cosA, -sinA, sinA, cosA);

    // Shift to pivot -> rotate -> shift back
    vec2 rotated = rotationMatrix * (scaledPos - pivot) + pivot;

    // Add world offset
    vec2 finalPos = rotated + aOffset;

    // Convert to clip space (-1 to 1)
    vec2 normalizedPos = (finalPos / uCanvasSize) * 2.0 - 1.0;
    gl_Position = vec4(normalizedPos * vec2(1.0, -1.0), 0.0, 1.0);

    // Pass varying values
    vTexCoord = aTexCoord * aTexScale + aTexOffset;
    vAlpha = alpha;
    vFogFactor = aFogFactor;
}`
export default vertexShaderSrc