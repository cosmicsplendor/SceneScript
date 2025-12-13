const vertexShaderSrc =
    `#version 300 es
precision mediump float;

in vec2 aPosition; // expected in [0..1] for the sprite quad (origin: bottom-left)
in vec2 aTexCoord;

in vec2 aOffset;
in vec2 aScale;
in vec2 aTexOffset;
in vec2 aTexScale;
in float aFogFactor;
in float alpha;
in float aRotation;
in vec2 aAnchor; // normalized anchor: (0,0) = top-left, (1,1) = bottom-right

uniform vec2 uCanvasSize;

out vec2 vTexCoord;
out float vFogFactor;
out float vAlpha;
out vec2 vLocalCoord; // 0..1

void main() {
    // --- local (untransformed) vertex in world pixels ---
    vLocalCoord = aPosition;
    vec2 scaledPos = aPosition * aScale;

    // --- convert anchor (top-left origin) into local-space pivot ---
    // aAnchor.y == 0 -> top, we need local y == scaleY
    // aAnchor.y == 1 -> bottom, we need local y == 0
    vec2 pivot = vec2(aAnchor.x * aScale.x, (1.0 - aAnchor.y) * aScale.y);

    // --- rotate around pivot ---
    float cosA = cos(aRotation);
    float sinA = sin(aRotation);
    mat2 rotationMatrix = mat2(cosA, -sinA, sinA, cosA);
    vec2 rotated = rotationMatrix * (scaledPos - pivot) + pivot;

    // --- translate to world position ---
    vec2 finalPos = rotated + aOffset;

    // --- to clip space (and flip Y to match canvas downward Y) ---
    vec2 normalizedPos = (finalPos / uCanvasSize) * 2.0 - 1.0;
    gl_Position = vec4(normalizedPos * vec2(1.0, -1.0), 0.0, 1.0);

    // --- varyings ---
    vTexCoord = aTexCoord * aTexScale + aTexOffset;
    vAlpha = alpha;
    vFogFactor = aFogFactor;
}`
export default vertexShaderSrc
