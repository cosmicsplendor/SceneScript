const fragmentShaderSrc = `#version 300 es
precision mediump float;

uniform sampler2D uImage;
uniform vec3 uFog;
uniform int uBlendMode; // 0 = Normal (Premul), 1 = Screen (Straight/Emissive)

// --- MASK UNIFORMS ---
uniform sampler2D uMask;
uniform int uUseMask;
uniform vec4 uMaskSource;
uniform vec4 uMaskDest;
in vec2 vLocalCoord;

in float vFogFactor;
in vec2 vTexCoord;
in float vAlpha;

out vec4 frag_color;

void main() {
    vec4 tex_color = texture(uImage, vTexCoord);

    vec4 final_color;
    
    if (uBlendMode == 1) {
        // ... Screen Mode ...
        float safety = smoothstep(0.05, 0.15, tex_color.a);
        vec3 straightRGB = (tex_color.rgb / max(tex_color.a, 0.0001)) * safety;
        float occlusion = smoothstep(0.7, 0.95, tex_color.a * vAlpha);
        final_color = vec4(straightRGB * vAlpha, occlusion);
    } else {
        final_color = tex_color * vAlpha;
    }

    // --- MASK LOGIC ---
    if (uUseMask == 1) {
        vec2 relativePos = (vLocalCoord - uMaskDest.xy) / uMaskDest.zw;
        if (relativePos.x >= 0.0 && relativePos.x <= 1.0 &&
            relativePos.y >= 0.0 && relativePos.y <= 1.0) {
            
            vec2 maskUV = uMaskSource.xy + relativePos * uMaskSource.zw;
            float maskAlpha = texture(uMask, maskUV).a;
            final_color *= maskAlpha;
            final_color *= maskAlpha;
        } 
        // Else: Outside the mask definition, we do nothing (Alpha *= 1.0).
        // This ensures the object remains visible outside the masked area.
    }

    vec4 fog_color = vec4(uFog * final_color.a, final_color.a);
    frag_color = mix(final_color, fog_color, vFogFactor);
}
`

export default fragmentShaderSrc
