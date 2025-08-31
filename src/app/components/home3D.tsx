"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default function ThreeText() {
  const mountRef = useRef<HTMLDivElement>(null);

  const getFrustumEdgesAtZ = (camera: THREE.PerspectiveCamera, z: number) => {
    const vFOV = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFOV / 2) * Math.abs(z - camera.position.z);
    const width = height * camera.aspect;

    return {
        left: -width / 2,
        right: width / 2,
        top: height / 2,
        bottom: -height / 2,
    };
}

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
      0.3, // strength
      0.4,
      1
    );

    composer.addPass(bloomPass);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    composer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    // Rim/back light
    const rimLight = new THREE.DirectionalLight(0x88ccff, 1); // bluish tint
    rimLight.position.set(0, 5, -30);
    scene.add(rimLight);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    scene.add(hemiLight);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1100;
    const positionBuffer = new Float32Array(particlesCount * 3);
    const colorBuffer = new Float32Array(particlesCount * 4);
    const particleSpeeds = new Float32Array(particlesCount);

    const visibleArea = getFrustumEdgesAtZ(camera, -25);

    for (let i = 0; i < particlesCount; i++) {
      positionBuffer[i * 3] = (Math.random() * (visibleArea.right - visibleArea.left) * 1.2) 
        + visibleArea.left * 1.2; // X
      positionBuffer[i * 3 + 1] = (Math.random() * (visibleArea.top - visibleArea.bottom) * 1.2) 
        + visibleArea.bottom * 1.2; // Y
      positionBuffer[i * 3 + 2] = (Math.random() * -50); // Z
      particleSpeeds[i] = (Math.random() * 0.1) + 0.05; // Z Speed
      colorBuffer[i * 4] = 255; // R
      colorBuffer[i * 4 + 1] = 255; // G
      colorBuffer[i * 4 + 2] = 255; // B
      colorBuffer[i * 4 + 3] = 0; // A
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorBuffer, 4));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x888888,
        transparent: true,
        opacity: 0.7,
        vertexColors: true,
        depthWrite: false,
    });

    

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Load font + create text
    const loader = new FontLoader();
    loader.load("/three_fonts/Lexend_Giga_Regular.json", (font) => {
      const textGeometry = new TextGeometry("mobinh.dev", {
        font: font,
        size: 3,
        depth: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 5
      });

      textGeometry.center();

      const material = new THREE.MeshStandardMaterial({ 
        color: 0x666666, 
        metalness: 0.6, 
        roughness: 0.4,
        emissive: 0xff4400,
        emissiveIntensity: 0.4
      });

      const textMesh = new THREE.Mesh(textGeometry, material);
      textMesh.position.z = -25;

      scene.add(textMesh);

      const animate = () => {
        requestAnimationFrame(animate);
    
        // Animate particles
        const positions = particlesGeometry.attributes.position.array;
        const colors = particlesGeometry.attributes.color.array;

        for(let i = 0; i < particlesCount; i++) {
            // Move particles slowly
            positions[i * 3 + 2] += particleSpeeds[i];

            if (colors[i * 4 + 3] < 1) {
                colors[i * 4 + 3] += 0.01; // Adjust this value to control fade speed
            }

            // Wrap around when particles go too far
            if(positions[i * 3 + 2] > 0) {
                positions[i * 3 + 2] = -50;
                colors[i * 4 + 3] = 0;
            }
        }
        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.color.needsUpdate = true;

        composer.render();
      }

      animate();
    });

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      composer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-screen" />;
}