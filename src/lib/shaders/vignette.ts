export const VignetteShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "darkness": { value: 1.0 },
        "offset": { value: 1.0 }
    },

    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,

    fragmentShader: `
        uniform float darkness;
        uniform float offset;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        void main() {
            // Calculate distance from center
            vec2 uv = vUv - 0.5;
            float dist = length(uv);

            // Create vignette effect
            float vignette = smoothstep(offset, darkness, dist);
            vec4 color = texture2D(tDiffuse, vUv);

            // Apply vignette
            gl_FragColor = vec4(color.rgb * (1.0 - vignette), color.a);
        }
    `
};