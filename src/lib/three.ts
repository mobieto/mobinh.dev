import * as THREE from "three";

export const getFrustumEdgesAtZ = (camera: THREE.PerspectiveCamera, z: number) => {
    const vFOV = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFOV / 2) * Math.abs(z - camera.position.z);
    const width = height * camera.aspect;

    return {
        left: -width / 2,
        right: width / 2,
        top: height / 2,
        bottom: -height / 2,
    };
};

export const calculateRepulsion = (
  particleX: number,
  particleY: number,
  particleZ: number,
  mouseX: number,
  mouseY: number,
  camera: THREE.PerspectiveCamera
): [number, number] => {
    // Convert mouse coordinates to scene coordinates
    const vector = new THREE.Vector3(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    
    // Check Z-axis distance
    const zDistance = Math.abs(particleZ);
    const maxZDistance = 40; // Maximum Z distance for repulsion effect
    
    if (zDistance > maxZDistance) {
        return [0, 0]; // No repulsion if too far in Z axis
    }
    
    // Scale the mouse position to match scene scale
    const mousePos = new THREE.Vector2(vector.x * 25, vector.y * 25);
    const particlePos = new THREE.Vector2(particleX, particleY);
    
    // Calculate distance in 2D space
    const distance = mousePos.distanceTo(particlePos);
    
    // Apply repulsion force based on distance
    const repulsionRadius = 6;
    const repulsionStrength = 0.1;
    
    // Scale force based on Z distance
    const zFactor = 1 - (zDistance / maxZDistance);
    
    if (distance < repulsionRadius) {
        const force = (1 - distance / repulsionRadius) * repulsionStrength * zFactor;
        const angle = Math.atan2(
            particlePos.y - mousePos.y,
            particlePos.x - mousePos.x
        );
        
        return [
            Math.cos(angle) * force,
            Math.sin(angle) * force
        ];
    }
    
    return [0, 0];
};

export const calculateAttraction = (
  particleX: number,
  particleY: number,
  particleZ: number,
  mouseX: number,
  mouseY: number,
  camera: THREE.PerspectiveCamera,
  velocity: [number, number] // Add velocity parameter
): [number, number] => {
    const vector = new THREE.Vector3(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    
    const mousePos = new THREE.Vector2(vector.x * 25, vector.y * 25);
    const particlePos = new THREE.Vector2(particleX, particleY);
    
    const distance = mousePos.distanceTo(particlePos);
    const zDistance = Math.abs(particleZ);
    const maxZDistance = 25;
    
    if (zDistance > maxZDistance) {
        return velocity;
    }
    
    // Spring/orbit parameters
    const attractionRadius = 8;
    const attractionStrength = 0.05;
    const dampening = 0.88; // Reduces velocity over time
    const minDistance = 5; // Minimum distance to prevent particles from sticking
    
    const zFactor = 1 - (zDistance / maxZDistance);
    
    if (distance < attractionRadius) {
        // Calculate spring force
        const force = (distance > minDistance) 
            ? (1 - distance / attractionRadius) * attractionStrength * zFactor
            : -attractionStrength * zFactor; // Repel if too close
            
        const angle = Math.atan2(
            mousePos.y - particlePos.y,
            mousePos.x - particlePos.x
        );
        
        // Add orbital component
        const tangentialAngle = angle + Math.PI / 2;
        const orbitalForce = force * 0.5;
        
        // Combine spring and orbital forces with current velocity
        const newVelocityX = (velocity[0] + 
            Math.cos(angle) * force +
            Math.cos(tangentialAngle) * orbitalForce) * dampening;
            
        const newVelocityY = (velocity[1] + 
            Math.sin(angle) * force +
            Math.sin(tangentialAngle) * orbitalForce) * dampening;
        
        return [newVelocityX, newVelocityY];
    }
    
    // Return dampened velocity when out of range
    return [velocity[0] * dampening, velocity[1] * dampening];
};

export const gradTexture = (color: [string[], number[]]) => {
    const c = document.createElement("canvas");
    const ct = c.getContext("2d")!;
    c.width = 16;
    c.height = 256;
    
    const gradient = ct.createLinearGradient(0, 0, 0, 256);
    let i = color[0].length;
    
    while(i--) {
        gradient.addColorStop(color[1][i], color[0][i]);
    }
    
    ct.fillStyle = gradient;
    ct.fillRect(0, 0, 16, 256);
    
    const texture = new THREE.Texture(c);
    texture.needsUpdate = true;

    return texture;
};

export const getSkyGradient = (
    skyColour: THREE.Color,
    groundColor: THREE.Color,
    skySize: number
): THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> => {
    const vertexShader = `
      varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`;
    const fragmentShader = `
      uniform vec3 topColor;
            uniform vec3 bottomColor;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize( vWorldPosition).z;
                gl_FragColor = vec4( mix( bottomColor, topColor, max( h, 0.0 ) ), 1.0 );
            }`;
    const uniforms = {
        topColor: { value: skyColour },
        bottomColor: { value: groundColor }
    };
    const skyGeo = new THREE.SphereGeometry(skySize, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);

    return sky;
};

export const calculateParticleCount = (width: number, height: number) => {
    const screenArea = width * height;
    const baseArea = 1920 * 1080; // Base resolution
    const baseCount = 2500;

    const count = Math.floor((screenArea / baseArea) * baseCount);
    return Math.min(Math.max(count, 1000), 3000); // Min 1000, Max 3000
};