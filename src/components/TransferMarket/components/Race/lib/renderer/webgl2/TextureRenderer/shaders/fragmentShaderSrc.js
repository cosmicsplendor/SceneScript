const fragmentShaderSrc = `#version 300 es
precision mediump float;

uniform sampler2D uImage;
uniform vec3 uFog;

in float vFogFactor;
in vec2 vTexCoord;
in float vAlpha;

out vec4 frag_color;

void main() {
    vec4 tex_color = texture(uImage, vTexCoord);

    // For premultiplied textures, multiply the entire vec4 by vAlpha
    vec4 final_color = tex_color * vAlpha;

    // For fog, you need to handle premultiplied colors correctly
    vec4 fog_color = vec4(uFog * final_color.a, final_color.a);
    frag_color = mix(final_color, fog_color, vFogFactor);
}
`

export default fragmentShaderSrc