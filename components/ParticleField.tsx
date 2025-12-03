import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, InputMode, InteractionState, HandGesture } from '../types';

const ParticleShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color() },
    uColorEnd: { value: new THREE.Color() },
    uSize: { value: 1.0 },
    uSpeed: { value: 1.0 },
    uNoiseStrength: { value: 1.0 },
    uDispersion: { value: 1.0 },
    uMouse: { value: new THREE.Vector3() },
    uShapeBias: { value: 0.0 },
    uInteractionStrength: { value: 5.0 }, // Positive = Repel, Negative = Attract
  },
  vertexShader: `
    uniform float uTime;
    uniform float uSize;
    uniform float uSpeed;
    uniform float uNoiseStrength;
    uniform float uDispersion;
    uniform float uShapeBias;
    uniform vec3 uMouse;
    uniform float uInteractionStrength;
    
    attribute float aScale;
    attribute vec3 aRandomness;
    
    varying float vDepth;
    varying vec3 vPos;
    varying float vDistance;
    varying float vEnergy; // Represents speed/force

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      vec3 i_ = mod289(i);
      vec4 p = permute( permute( permute(
                i_.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i_.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i_.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // Basic position
      vec3 pos = position;
      float time = uTime * uSpeed;
      
      // Noise Field
      vec3 noisePos = pos * 0.5 + time * 0.2;
      vec3 noiseVec = vec3(
        snoise(noisePos + vec3(0.0)),
        snoise(noisePos + vec3(10.0)),
        snoise(noisePos + vec3(20.0))
      );
      vec3 displacement = noiseVec * uNoiseStrength;
      
      // Shape mixing
      vec3 spherical = normalize(pos) * uDispersion;
      vec3 cubic = pos * (uDispersion * 0.5);
      vec3 basePos = mix(spherical, cubic, uShapeBias);
      vec3 finalPos = basePos + displacement;

      // INTERACTION: Attraction or Repulsion
      float dist = distance(finalPos, uMouse);
      float radius = 7.0; // Influence radius
      float force = 0.0;
      
      if (dist < radius) {
          force = (radius - dist) / radius; // 0 to 1
          force = pow(force, 2.0); // Non-linear falloff
          vec3 dir = normalize(finalPos - uMouse);
          
          if (uInteractionStrength > 0.0) {
              // REPEL: Push away
              finalPos += dir * force * uInteractionStrength;
          } else {
              // ATTRACT: Pull in (using negative strength)
              finalPos += dir * force * uInteractionStrength; 
              
              // Swirl effect when attracting
              float swirl = force * 3.0;
              float s = sin(swirl);
              float c = cos(swirl);
              mat2 rot = mat2(c, -s, s, c);
              finalPos.xz = rot * finalPos.xz;
          }
      }
      
      // Global Rotation
      float angle = time * 0.05;
      float s = sin(angle);
      float c = cos(angle);
      mat2 rot = mat2(c, -s, s, c);
      finalPos.xz = rot * finalPos.xz;

      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      gl_PointSize = uSize * aScale * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      vDepth = length(finalPos) / (uDispersion * 2.0);
      vPos = finalPos;
      vDistance = length(finalPos);
      
      // Energy = Interaction Force + Noise Intensity
      // Used to brighten fast moving particles
      vEnergy = force + (length(displacement) * 0.15);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;
    uniform float uDispersion;
    
    varying float vDepth;
    varying vec3 vPos;
    varying float vDistance;
    varying float vEnergy;

    void main() {
      // Circular particle
      vec2 center = vec2(0.5);
      float r = distance(gl_PointCoord, center);
      if (r > 0.5) discard;
      
      // Soft glow
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 2.0);
      
      // Color mixing based on depth
      vec3 baseColor = mix(uColorStart, uColorEnd, smoothstep(0.0, 1.0, vDepth));
      
      // SPEED HIGHLIGHT
      // Add white/brightness based on energy (interaction force or high noise)
      vec3 hotColor = vec3(1.0, 1.0, 1.0);
      float energyFactor = clamp(vEnergy * 0.8, 0.0, 1.0); // Adjust sensitivity
      
      vec3 finalColor = mix(baseColor, hotColor, energyFactor);
      
      // EDGE FADE OUT
      // Fade out particles that are far from center relative to dispersion
      float fadeStart = uDispersion * 1.5;
      float fadeEnd = uDispersion * 3.0;
      float alpha = 1.0 - smoothstep(fadeStart, fadeEnd, vDistance);
      
      gl_FragColor = vec4(finalColor, glow * alpha);
    }
  `
};

interface ParticleFieldProps {
  config: ParticleConfig;
  inputMode: InputMode;
  interactionStateRef: React.MutableRefObject<InteractionState>;
}

const ParticleField: React.FC<ParticleFieldProps> = ({ config, inputMode, interactionStateRef }) => {
  const mesh = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create particles once
  const particles = useMemo(() => {
    const tempPositions = new Float32Array(config.count * 3);
    const tempScales = new Float32Array(config.count);
    const tempRandoms = new Float32Array(config.count * 3);

    for (let i = 0; i < config.count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      
      tempPositions[i * 3] = x;
      tempPositions[i * 3 + 1] = y;
      tempPositions[i * 3 + 2] = z;

      tempScales[i] = Math.random();
      tempRandoms[i * 3] = Math.random();
      tempRandoms[i * 3 + 1] = Math.random();
      tempRandoms[i * 3 + 2] = Math.random();
    }
    return { positions: tempPositions, scales: tempScales, randoms: tempRandoms };
  }, [config.count]);

  useFrame((state) => {
    if (shaderRef.current) {
      const material = shaderRef.current;
      material.uniforms.uTime.value = state.clock.getElapsedTime();
      
      let targetPos = new THREE.Vector3();
      let targetInteraction = 6.0; // Default repel force
      let currentDispersion = config.dispersion;

      if (inputMode === InputMode.CAMERA) {
          const handState = interactionStateRef.current;
          
          // Position
          targetPos.copy(handState.position);
          
          // --- GESTURE LOGIC ---

          // 1. Two Hands = Control Dispersion/Spread
          if (handState.handCount === 2) {
             // Map separation (0.1 to 0.8 usually) to Dispersion (2.0 to 15.0)
             // Clamped to avoid weird values
             const sep = Math.max(0.1, Math.min(handState.separation, 1.0));
             currentDispersion = sep * 18.0; 
             
             // If both fists, SUPER ATTRACT
             if (handState.gesture === HandGesture.DUAL_FIST) {
                 targetInteraction = -25.0; // Massive black hole
             } else {
                 targetInteraction = 2.0; // Mild repel when just moving hands
             }
          } 
          // 2. Single Hand = Standard Control
          else {
              if (handState.gesture === HandGesture.FIST) {
                  targetInteraction = -15.0; // Strong attract
              } else if (handState.gesture === HandGesture.PINCH) {
                   // Pinch acts as a mini gravity well or dense point
                   targetInteraction = -5.0; 
                   currentDispersion = config.dispersion * 0.5; // Compress slightly
              } else {
                  targetInteraction = 6.0; // Standard repel
              }
          }

      } else {
          // Mouse Mode
          targetPos.set(state.mouse.x * 12, state.mouse.y * 12, 0);
      }

      // --- SMOOTHING (Lerp) ---
      // Increased factors (0.2-0.25) for more immediate/precise feel
      material.uniforms.uMouse.value.lerp(targetPos, 0.25);
      material.uniforms.uInteractionStrength.value = THREE.MathUtils.lerp(
          material.uniforms.uInteractionStrength.value, 
          targetInteraction, 
          0.15
      );
      
      // Allow Camera mode to override dispersion smoothly
      material.uniforms.uDispersion.value = THREE.MathUtils.lerp(
          material.uniforms.uDispersion.value, 
          currentDispersion, 
          0.1
      );

      // Other Config Values
      material.uniforms.uSize.value = THREE.MathUtils.lerp(material.uniforms.uSize.value, config.size, 0.05);
      material.uniforms.uSpeed.value = THREE.MathUtils.lerp(material.uniforms.uSpeed.value, config.speed, 0.05);
      material.uniforms.uNoiseStrength.value = THREE.MathUtils.lerp(material.uniforms.uNoiseStrength.value, config.noiseStrength, 0.05);
      material.uniforms.uShapeBias.value = THREE.MathUtils.lerp(material.uniforms.uShapeBias.value, config.shapeBias, 0.05);
      material.uniforms.uColorStart.value.lerp(new THREE.Color(config.colorStart), 0.05);
      material.uniforms.uColorEnd.value.lerp(new THREE.Color(config.colorEnd), 0.05);
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={particles.scales.length}
          array={particles.scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandomness"
          count={particles.randoms.length / 3}
          array={particles.randoms}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={ParticleShaderMaterial.vertexShader}
        fragmentShader={ParticleShaderMaterial.fragmentShader}
        uniforms={ParticleShaderMaterial.uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleField;