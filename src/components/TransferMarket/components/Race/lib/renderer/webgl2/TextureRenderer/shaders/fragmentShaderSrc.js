const fragmentShaderSrc = `#version 300 es
precision mediump float;

uniform sampler2D uImage;
uniform vec3 uFog;
uniform int uBlendMode; // 0 = Normal (Premul), 1 = Screen (Straight/Emissive)

in float vFogFactor;
in vec2 vTexCoord;
in float vAlpha;

out vec4 frag_color;

void main() {
    vec4 tex_color = texture(uImage, vTexCoord);

    vec4 final_color;
    
    if (uBlendMode == 1) {
        // Screen/Emissive Mode: Solid parts occlude, Transparent parts add.
        // We use smoothstep to push semi-transparent alphas towards 0 (Additive).
        
        // Un-premultiply RGB to get the original color intensity.
        // This ensures that even low-alpha pixels (like glass) contribute their full color brightness.
        // Avoid division by zero.
        vec3 straightRGB = tex_color.rgb / max(tex_color.a, 0.0001);
        
        // Use vAlpha for master opacity.
        float occlusion = smoothstep(0.7, 0.95, tex_color.a * vAlpha); 
        
        // Output Straight RGB (scaled by master opacity vAlpha)
        // If occlusion is 0 (Glass): Result = StraightRGB + Dst * 1 (Bright additive)
        final_color = vec4(straightRGB * vAlpha, occlusion);
    } else {
        // Normal Mode: Premultiplied Alpha
        // Standard interpolation: (RGB*A) + Dst*(1-A)
        final_color = tex_color * vAlpha;
    }

    // For fog, you need to handle premultiplied colors correctly
    vec4 fog_color = vec4(uFog * final_color.a, final_color.a);
    frag_color = mix(final_color, fog_color, vFogFactor);
}
`

export default fragmentShaderSrc