"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 1800; // Performance cap per spec

  const positions = useMemo(() => {
    const array = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const r = 4.5;

      array[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      array[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      array[i * 3 + 2] = r * Math.cos(phi);
    }
    return array;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.012;

    // Subtle mouse parallax (0.02 ratio)
    const targetX = (state.pointer.y * Math.PI) / 20;
    const targetY = (state.pointer.x * Math.PI) / 20;

    pointsRef.current.rotation.x += (targetX - pointsRef.current.rotation.x) * 0.008;
    pointsRef.current.rotation.z += (targetY * 0.2 - pointsRef.current.rotation.z) * 0.008;
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
        size={0.03}
        color="#00C9E0"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleBackground() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // CSS gradient fallback for reduced motion
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(0,201,224,0.04) 0%, transparent 60%)",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={["#08090D", 5, 15]} />
        <Particles />
      </Canvas>
    </div>
  );
}
