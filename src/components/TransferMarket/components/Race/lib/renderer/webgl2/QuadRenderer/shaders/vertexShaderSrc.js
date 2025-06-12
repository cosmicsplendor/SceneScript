// vertexShaderSrc.js
const vertexShaderSrc = `#version 300 es
precision mediump float;

in vec2 aPos;
in float aFogFactor;
in vec3 aColor;

uniform vec2 uCanvasSize;

out float vFogFactor;
out vec3 vColor;

void main() {
  vec2 normalizedPos = (aPos / uCanvasSize) * 2.0 - 1.0;
  gl_Position = vec4(normalizedPos * vec2(1, -1), 0, 1);

  vFogFactor = aFogFactor;
  vColor = aColor;
}
`;

export default vertexShaderSrc;