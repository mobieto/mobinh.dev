import * as THREE from "three";

export const HolographicShaderOverride = (material: THREE.MeshPhysicalMaterial, currentShader: THREE.WebGLProgramParametersWithUniforms) => {
    currentShader.uniforms.time = { value: 0 };

    currentShader.vertexShader = currentShader.vertexShader.replace(
        'void main() {',
        `
        varying vec2 vUv;
        void main() {
        vUv = uv;
        `
    );

    currentShader.fragmentShader = `
        varying vec2 vUv;

        // Simplex 2D noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                    -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        uniform float time;

        ${currentShader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );', 
            `
            float t = time * 0.2;
            vec2 scaledUv = vUv * 1.1;
            
            // Generate multiple noise patterns at different frequencies
            float noise1 = snoise(scaledUv + vec2(t));
            float noise2 = snoise(scaledUv * 0.05 - vec2(t * 0.1));
            float noise3 = snoise(scaledUv * 0.08 + vec2(t * 0.14));
            
            // Create different hue shifts based on position
            float baseHue = vUv.x * 0.4; // Changes color horizontally
            float hue1 = baseHue + noise1 * 0.2 + t * 0.1;
            float hue2 = baseHue + noise2 * 0.2 + t * 0.15;
            float hue3 = baseHue + noise3 * 0.2 + t * 0.2;
            
            // Create three different color patterns
            vec3 color1 = hsv2rgb(vec3(hue1, 1, 2));
            vec3 color2 = hsv2rgb(vec3(hue2 + 0.33, 0.8, 1.8));
            vec3 color3 = hsv2rgb(vec3(hue3 + 0.66, 0.8, 1.9));
            
            // Mix colors based on position and noise
            float mixFactor1 = sin(vUv.y * 6.28 + noise1 * 3.0) * 0.5 + 0.5;
            float mixFactor2 = cos(vUv.x * 6.28 + noise2 * 3.0) * 0.5 + 0.5;
            
            vec3 finalColor = mix(
                color1,
                mix(color2, color3, mixFactor1),
                mixFactor2
            );
            
            // Add position-dependent shimmer
            float shimmer = pow(sin(noise1 * 10.0 + t * 3.0) * 0.5 + 0.5, 1.2);
            shimmer *= sin(vUv.x * 10.0) * 0.5 + 0.5; // Horizontal shimmer bands
            finalColor += shimmer * 1.2;
            
            // Overall brightness
            finalColor *= 1.5;
            
            vec4 diffuseColor = vec4(finalColor, opacity);
            `
        )}
    `;

    material.userData.shader = currentShader;
};