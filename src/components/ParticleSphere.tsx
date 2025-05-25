"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createNoise3D, createNoise4D } from 'simplex-noise';

interface ParticleSphereProps {
  className?: string;
  fullscreen?: boolean;
}

export default function ParticleSphere({ className, fullscreen = false }: ParticleSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        controls: OrbitControls,
        composer: EffectComposer,
        bloomPass: UnrealBloomPass,
        particlesGeometry: THREE.BufferGeometry,
        particlesMaterial: THREE.ShaderMaterial,
        particleSystem: THREE.Points,
        currentPositions: Float32Array,
        particleSizes: Float32Array,
        particleOpacities: Float32Array,
        noise3D: any,
        noise4D: any;

    const CONFIG = {
      particleCount: 15000,
      shapeSize: 14,
      noiseFrequency: 0.1,
      noiseTimeScale: 0.04,
      noiseMaxStrength: 2.8,
      colorScheme: 'fire',
      particleSizeRange: [0.08, 0.25],
      starCount: fullscreen ? 50000 : 18000,
      bloomStrength: 1.3,
      bloomRadius: 0.5,
      bloomThreshold: 0.05,
      idleFlowStrength: 0.03,
      idleFlowSpeed: 0.02,
      idleRotationSpeed: 0.02
    };

    const COLOR_SCHEMES = {
      fire: { startHue: 0, endHue: 45, saturation: 0.95, lightness: 0.6 }
    };

    const tempVec = new THREE.Vector3();
    const flowVec = new THREE.Vector3();
    const currentVec = new THREE.Vector3();

    function generateSphere(count: number, size: number) {
      const points = new Float32Array(count * 3);
      const phi = Math.PI * (Math.sqrt(5) - 1);
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        points[i * 3] = x * size;
        points[i * 3 + 1] = y * size;
        points[i * 3 + 2] = z * size;
      }
      return points;
    }

    function createStarTexture() {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return new THREE.Texture();
      
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    }

    function init() {
      // Scene setup
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000308, 0.03);

      // Camera setup
      if (!container) return;
      camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 8, fullscreen ? 50 : 28);
      camera.lookAt(scene.position);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.setClearColor(0x000000, 0); // Transparent background
      container.appendChild(renderer.domElement);

      // Controls setup
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 5;
      controls.maxDistance = 80;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;

      // Lighting
      scene.add(new THREE.AmbientLight(0x404060));
      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight1.position.set(15, 20, 10);
      scene.add(dirLight1);
      const dirLight2 = new THREE.DirectionalLight(0x88aaff, 0.9);
      dirLight2.position.set(-15, -10, -15);
      scene.add(dirLight2);

      // Particle system setup
      noise3D = createNoise3D(() => Math.random());
      noise4D = createNoise4D(() => Math.random());
      
      if (!fullscreen) {
        currentPositions = generateSphere(CONFIG.particleCount, CONFIG.shapeSize);
        particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));

        particleSizes = new Float32Array(CONFIG.particleCount);
        particleOpacities = new Float32Array(CONFIG.particleCount);
        for (let i = 0; i < CONFIG.particleCount; i++) {
          particleSizes[i] = THREE.MathUtils.randFloat(CONFIG.particleSizeRange[0], CONFIG.particleSizeRange[1]);
          particleOpacities[i] = 1.0;
        }
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        particlesGeometry.setAttribute('opacity', new THREE.BufferAttribute(particleOpacities, 1));

        const colors = new Float32Array(CONFIG.particleCount * 3);
        const colorScheme = COLOR_SCHEMES.fire;
        const center = new THREE.Vector3(0, 0, 0);
        const maxRadius = CONFIG.shapeSize * 1.1;

        for (let i = 0; i < CONFIG.particleCount; i++) {
          const i3 = i * 3;
          tempVec.fromArray(currentPositions, i3);
          const dist = tempVec.distanceTo(center);
          const hue = THREE.MathUtils.mapLinear(dist, 0, maxRadius, colorScheme.startHue, colorScheme.endHue);
          const noiseValue = (noise3D(tempVec.x * 0.2, tempVec.y * 0.2, tempVec.z * 0.2) + 1) * 0.5;
          const saturation = THREE.MathUtils.clamp(colorScheme.saturation * (0.9 + noiseValue * 0.2), 0, 1);
          const lightness = THREE.MathUtils.clamp(colorScheme.lightness * (0.85 + noiseValue * 0.3), 0.1, 0.9);
          const color = new THREE.Color().setHSL(hue / 360, saturation, lightness);
          color.toArray(colors, i3);
        }
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        particlesMaterial = new THREE.ShaderMaterial({
          uniforms: {
            pointTexture: { value: createStarTexture() }
          },
          vertexShader: `
            attribute float size;
            attribute float opacity;
            varying vec3 vColor;
            varying float vOpacity;

            void main() {
              vColor = color;
              vOpacity = opacity;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (400.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            varying float vOpacity;

            void main() {
              float alpha = texture2D(pointTexture, gl_PointCoord).a;
              if (alpha < 0.05) discard;
              gl_FragColor = vec4(vColor, alpha * vOpacity);
            }
          `,
          blending: THREE.AdditiveBlending,
          depthTest: true,
          depthWrite: false,
          transparent: true,
          vertexColors: true
        });

        particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleSystem);
      }

      // Starfield background (only in fullscreen mode)
      if (fullscreen) {
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(CONFIG.starCount * 3);
        const starSizes = new Float32Array(CONFIG.starCount);
        const starColors = new Float32Array(CONFIG.starCount * 3);

        for (let i = 0; i < CONFIG.starCount; i++) {
          const i3 = i * 3;
          // Random positions in a large sphere
          const radius = 200 + Math.random() * 100;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          
          starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
          starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          starPositions[i3 + 2] = radius * Math.cos(phi);
          
          // Random sizes
          starSizes[i] = Math.random() * 0.8 + 0.2;
          
          // Random colors with slight blue tint
          starColors[i3] = 0.8 + Math.random() * 0.2;     // R
          starColors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
          starColors[i3 + 2] = 1.0;                       // B
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.ShaderMaterial({
          uniforms: {
            pointTexture: { value: createStarTexture() }
          },
          vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            void main() {
              float alpha = texture2D(pointTexture, gl_PointCoord).a;
              if (alpha < 0.05) discard;
              gl_FragColor = vec4(vColor, alpha);
            }
          `,
          blending: THREE.AdditiveBlending,
          depthTest: true,
          depthWrite: false,
          transparent: true,
          vertexColors: true
        });

        const starField = new THREE.Points(starGeometry, starMaterial);
        scene.add(starField);
      }

      // Post-processing
      if (!container) return;
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        CONFIG.bloomStrength,
        CONFIG.bloomRadius,
        CONFIG.bloomThreshold
      );
      composer.addPass(bloomPass);

      // Animation
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = clock.getDelta();

        controls.update();

        if (!fullscreen) {
          // Update particle positions
          const positions = particlesGeometry.attributes.position.array;
          const breathScale = 1.0 + Math.sin(elapsedTime * 0.3) * 0.004;
          const timeScaled = elapsedTime * CONFIG.idleFlowSpeed;
          const freq = 0.05;

          for (let i = 0; i < CONFIG.particleCount; i++) {
            const i3 = i * 3;
            tempVec.fromArray(currentPositions, i3);
            const originalLength = tempVec.length();
            
            // Apply very subtle movement
            tempVec.multiplyScalar(breathScale);
            flowVec.set(
              noise4D(tempVec.x * freq, tempVec.y * freq, tempVec.z * freq, timeScaled),
              noise4D(tempVec.x * freq + 10, tempVec.y * freq + 10, tempVec.z * freq + 10, timeScaled),
              noise4D(tempVec.x * freq + 20, tempVec.y * freq + 20, tempVec.z * freq + 20, timeScaled)
            );
            tempVec.addScaledVector(flowVec, CONFIG.idleFlowStrength);
            
            // Stronger constraint to maintain sphere shape
            const currentLength = tempVec.length();
            if (currentLength > 0) {
              const scale = originalLength / currentLength;
              // Add extra constraint to prevent particles from moving too far
              const constrainedScale = Math.min(scale, 1.1);
              tempVec.multiplyScalar(constrainedScale);
            }
            
            currentVec.fromArray(positions, i3);
            currentVec.lerp(tempVec, 0.03);
            positions[i3] = currentVec.x;
            positions[i3 + 1] = currentVec.y;
            positions[i3 + 2] = currentVec.z;
          }
          particlesGeometry.attributes.position.needsUpdate = true;
        }

        composer.render(deltaTime);
      }

      animate();

      // Handle window resize
      function onWindowResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        composer.setSize(container.clientWidth, container.clientHeight);
      }

      window.addEventListener('resize', onWindowResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', onWindowResize);
        if (container) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        composer.dispose();
      };
    }

    init();
  }, []);

  return (
    <div ref={containerRef} className={className} />
  );
} 