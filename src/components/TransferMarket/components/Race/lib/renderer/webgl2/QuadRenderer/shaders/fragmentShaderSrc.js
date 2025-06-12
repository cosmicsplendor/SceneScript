// fragmentShaderSrc.js
const fragmentShaderSrc = `#version 300 es
precision mediump float;

uniform vec3 uFog;

in float vFogFactor;
in vec3 vColor;

out vec4 frag_color;

void main() {
  frag_color = mix(vec4(vColor, 1.0), vec4(uFog, 1.0), vFogFactor);
}
`;

export default fragmentShaderSrc;