"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { getFrustumEdgesAtZ , calculateRepulsion, getSkyGradient, calculateParticleCount } from "@/lib/three";
import { useMousePosition } from "@/lib/mouse";
import { randomGaussian } from "@/lib/math";
import { holographicRainbowFrag, holographicRainbowFragReplace } from "@/lib/shaders/holographic_rainbow_frag";
import { spawn } from "child_process";

export default function ThreeText() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouse = useMousePosition();

  useEffect(() => {
    if (mouse.x !== null && mouse.y !== null) {
      mouseRef.current = { x: mouse.x, y: mouse.y };
    }
  }, [mouse]);

  useEffect(() => {
    if (!mountRef.current) return;

    const mainScene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      4000
    );

    camera.position.z = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const renderPass = new RenderPass(mainScene, camera);
    const mainComposer = new EffectComposer(renderer);

    mainComposer.addPass(renderPass);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x4522c3, 0.3);
    mainScene.add(ambientLight);

    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    mainScene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 2, -5);
    mainScene.add(fillLight);

    // Rim/back light
    const rimLight = new THREE.DirectionalLight(0x88ccff, 1); // bluish tint
    rimLight.position.set(0, 5, -30);
    mainScene.add(rimLight);

    const sky = getSkyGradient(new THREE.Color(0x111112), new THREE.Color(0x27273b), 2000);
    mainScene.add(sky);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = calculateParticleCount(mountRef.current.clientWidth, mountRef.current.clientHeight);
    const positionBuffer = new Float32Array(particlesCount * 3);
    const colorBuffer = new Float32Array(particlesCount * 4);
    const particleSpeeds = new Float32Array(particlesCount);
    const visibleArea = getFrustumEdgesAtZ(camera, 0);

    const spawnParticles = (p_count: number) => {
      for (let i = 0; i < p_count; i++) {
        const centerX = (visibleArea.left + visibleArea.right) / 2;
        const centerY = (visibleArea.top + visibleArea.bottom) / 2;
        const widthStdDev = (visibleArea.right - visibleArea.left) / 4;
        const heightStdDev = (visibleArea.top - visibleArea.bottom) / 4;

        // Generate positions using Gaussian distribution
        positionBuffer[i * 3] = randomGaussian(centerX, widthStdDev);
        positionBuffer[i * 3 + 1] = randomGaussian(centerY, heightStdDev);
        positionBuffer[i * 3 + 2] = (Math.random() * -40) - -40;
        particleSpeeds[i] = (Math.random() * 0.12) + 0.05; // Z Speed
        colorBuffer[i * 4] = 255; // R
        colorBuffer[i * 4 + 1] = 255; // G
        colorBuffer[i * 4 + 2] = 255; // B
        colorBuffer[i * 4 + 3] = 0; // A
      }
    }

    spawnParticles(particlesCount);

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorBuffer, 4));

    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load("/img/circle.png");
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xffffff,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        map: particleTexture,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);

    mainScene.add(particlesMesh);

    // Load font + create text
    const fontLoader = new FontLoader();
    fontLoader.load("/three_fonts/Lexend_Giga_Regular.json", (font) => {
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

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.2,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 1.2
      });

      material.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };

        shader.vertexShader = shader.vertexShader.replace(
          'void main() {',
          `
          varying vec2 vUv;
          void main() {
            vUv = uv;
          `
        );
        
        shader.fragmentShader = `
          ${holographicRainbowFrag}
          ${shader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );', 
            holographicRainbowFragReplace
          )}
        `
        
        material.userData.shader = shader;
      };

      const textMesh = new THREE.Mesh(textGeometry, material);
      textMesh.position.z = -25;

      mainScene.add(textMesh);

      // Animate text mesh after it's loaded
      const textAnimation = () => {
        requestAnimationFrame(textAnimation);

        if (material.userData.shader) {
          material.userData.shader.uniforms.time.value = performance.now() * 0.001;
        }

        // Rotate text to face mouse position
        if (mountRef.current) {
          const xNorm = (mouseRef.current.x / mountRef.current.clientWidth) * 2 - 1;
          const yNorm = -(mouseRef.current.y / mountRef.current.clientHeight) * 2 + 1;
          textMesh.rotation.y = xNorm * 0.1; 
          textMesh.rotation.x = yNorm * -0.1;
        }

        mainComposer.render();
      };

      textAnimation();
    });

    const particlesAnimation = () => {
      requestAnimationFrame(particlesAnimation);

      // Animate particles
      const positions = particlesGeometry.attributes.position.array;
      const colors = particlesGeometry.attributes.color.array;
      const visibleArea = getFrustumEdgesAtZ(camera, -25);

      for (let i = 0; i < particlesCount; i++) {
        const positionIndex = i * 3;
        const colorIndex = i * 4;

        const [repulsionX, repulsionY] = calculateRepulsion(
          positions[positionIndex],
          positions[positionIndex + 1],
          positions[positionIndex + 2],
          mouseRef.current.x,
          mouseRef.current.y,
          camera,
        );

        // Move particles slowly
        positions[positionIndex + 2] += particleSpeeds[i];

        // Apply attractive force to mouse
        positions[positionIndex] += repulsionX;
        positions[positionIndex + 1] += repulsionY;

        // Fade in particles
        if (colors[colorIndex + 3] < 1) {
            colors[colorIndex + 3] += 0.005;
        }

        // Wrap around when particles go too far
        if (positions[positionIndex + 2] > 0) {
          const centerX = (visibleArea.right + visibleArea.left) / 2;
          const centerY = (visibleArea.top + visibleArea.bottom) / 2;
          const widthStdDev = (visibleArea.right - visibleArea.left) / 4;
          const heightStdDev = (visibleArea.top - visibleArea.bottom) / 4;
          
          positions[positionIndex] = randomGaussian(centerX, widthStdDev);
          positions[positionIndex + 1] = randomGaussian(centerY, heightStdDev);
          positions[positionIndex + 2] = (Math.random() * -40) - 40;
          colors[colorIndex + 3] = 0;
        }
      }

      particlesGeometry.attributes.position.needsUpdate = true;
      particlesGeometry.attributes.color.needsUpdate = true;

      mainComposer.render();
    }

    particlesAnimation();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
  
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
    
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      mainComposer.setSize(width, height);
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