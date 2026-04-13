"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 3000;
  
  // Create sphere distribution of points
  const positions = useMemo(() => {
    const array = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Math to distribute points evenly on a sphere
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      const r = 4.5; // globe radius
      
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }
    return array;
  }, [particleCount]);

  // Handle animation and mouse parallax
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Slow rotation
    pointsRef.current.rotation.y += delta * 0.015;
    
    // Lerp rotation to mouse position
    const targetX = (state.pointer.y * Math.PI) / 16;
    const targetY = (state.pointer.x * Math.PI) / 16;
    
    pointsRef.current.rotation.x += (targetX - pointsRef.current.rotation.x) * 0.01;
    pointsRef.current.rotation.z += (targetY * 0.3 - pointsRef.current.rotation.z) * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.035}
        color="#00E5FF"
        transparent
        opacity={0.4}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleBackground() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return <div className="absolute inset-0 bg-black/90 pointer-events-none -z-10" />;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-transparent">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ alpha: true, antialias: true }}>
        <fog attach="fog" args={["#080C14", 5, 15]} />
        <Particles />
      </Canvas>
    </div>
  );
}
