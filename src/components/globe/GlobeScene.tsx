"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  earthVertexShader,
  earthFragmentShader,
  cloudVertexShader,
  cloudFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from "./shaders";

// ─── ROUTE DATA ───────────────────────────────────────────────────────────
const ROUTES = [
  [28.6, 77.1,   19.1, 72.9],
  [28.6, 77.1,   13.0, 80.2],
  [19.1, 72.9,   13.0, 80.2],
  [12.9, 77.6,   17.4, 78.5],
  [28.6, 77.1,   12.9, 77.6],
  [22.6, 88.4,   19.1, 72.9],
  [28.6, 77.1,   23.1, 72.6],
  [12.9, 77.6,   10.1, 76.4],
];

function latLonToVec3(lat: number, lon: number, radius = 1.02) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── EARTH ────────────────────────────────────────────────────────────────
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0008;
      const mat = earthRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uTime) {
        mat.uniforms.uTime.value = clock.getElapsedTime();
      }
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
        uniforms={{
          uTime:      { value: 0 },
          uNightSide: { value: 0.6 },
          uCityGlow:  { value: 0.4 },
        }}
      />
    </mesh>
  );
}

// ─── CLOUDS ───────────────────────────────────────────────────────────────
function Clouds() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (cloudRef.current) cloudRef.current.rotation.y += 0.001;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[1.007, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── ATMOSPHERE ───────────────────────────────────────────────────────────
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.08, 48, 48]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={{ uColor: { value: new THREE.Color(0x0066FF) } }}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── FLIGHT ARC ───────────────────────────────────────────────────────────
function FlightArc({
  lat1, lon1, lat2, lon2,
}: {
  lat1: number; lon1: number; lat2: number; lon2: number;
}) {
  const progressRef = useRef(Math.random());

  const { points } = useMemo(() => {
    const p1 = latLonToVec3(lat1, lon1);
    const p2 = latLonToVec3(lat2, lon2);
    const mid  = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const dist = p1.distanceTo(p2);
    const ctrl = mid.clone().normalize().multiplyScalar(1.02 + dist * 0.35);
    const curve = new THREE.QuadraticBezierCurve3(p1, ctrl, p2);
    return { curve, points: curve.getPoints(80) };
  }, [lat1, lon1, lat2, lon2]);

  const color = useMemo(() => new THREE.Color(0xF5C842), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(81 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lineMat = useMemo(() => new THREE.LineBasicMaterial({
    color, transparent: true, opacity: 0.7, linewidth: 1,
  }), [color]);

  const dotMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true }), [color]);

  const lineObj = useMemo(() => new THREE.Line(geometry, lineMat), [geometry, lineMat]);
  const dotMeshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    progressRef.current = (progressRef.current + 0.12 * delta) % 2;
    const progress = progressRef.current;
    const dot = dotMeshRef.current;
    if (!dot) return;

    if (progress <= 1.0) {
      const trailFrac = 0.22;
      const posAttr = lineObj.geometry.attributes.position as THREE.BufferAttribute;
      const head = progress;
      const tail = Math.max(0, head - trailFrac);
      const totalPts = points.length;
      const headIdx = Math.floor(head * (totalPts - 1));
      const tailIdx = Math.floor(tail * (totalPts - 1));
      const segCount = Math.max(2, headIdx - tailIdx);

      for (let i = 0; i <= segCount; i++) {
        const pt = points[Math.min(tailIdx + i, totalPts - 1)];
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      lineObj.geometry.setDrawRange(0, segCount + 1);
      posAttr.needsUpdate = true;
      dot.position.copy(points[headIdx]);
      const fade = Math.sin(head * Math.PI);
      dotMat.opacity = fade * 0.9;
      lineMat.opacity = fade * 0.65;
      lineObj.visible = true;
      dot.visible = true;
    } else {
      lineObj.visible = false;
      dot.visible = false;
    }
  });

  return (
    <group>
      <primitive object={lineObj} />
      <mesh ref={dotMeshRef} material={dotMat}>
        <sphereGeometry args={[0.006, 8, 8]} />
      </mesh>
    </group>
  );
}

// ─── PARTICLES ────────────────────────────────────────────────────────────
function Particles({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const speedsRef = useRef<Float32Array>(new Float32Array(count));

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 1.1 + Math.random() * 1.4;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      if (t < 0.6) {
        colors[i * 3]     = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
        colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else if (t < 0.85) {
        colors[i * 3]     = 0.95;
        colors[i * 3 + 1] = 0.78;
        colors[i * 3 + 2] = 0.25;
      } else {
        colors[i * 3]     = 0.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.8;
      }
      sizes[i] = Math.random() * 2.5 + 0.5;
      speedsRef.current[i] = (Math.random() - 0.5) * 0.002;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < Math.min(pos.count, count); i++) {
      pos.setY(i, pos.getY(i) + speedsRef.current[i]);
      if (Math.abs(pos.getY(i)) > 2.6) speedsRef.current[i] *= -1;
    }
    pos.needsUpdate = true;
    pointsRef.current.rotation.y += 0.0002;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.012}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── SCENE WRAPPER ────────────────────────────────────────────────────────
export function GlobeSceneR3F() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const mouseSmooth = useRef(new THREE.Vector2(0, 0));
  const mouseDelta = useRef(new THREE.Vector2(0, 0));
  const frameSkip = useRef(false);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseDelta.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseDelta.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      mouseDelta.current.x = (t.clientX / window.innerWidth - 0.5) * 2;
      mouseDelta.current.y = (t.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  useFrame(({ clock }) => {
    const now = performance.now();
    if (now - lastUpdate.current < 16) return; // ~60fps cap
    lastUpdate.current = now;

    mouseSmooth.current.x += (mouseDelta.current.x - mouseSmooth.current.x) * 0.04;
    mouseSmooth.current.y += (mouseDelta.current.y - mouseSmooth.current.y) * 0.04;
    const elapsed = clock.getElapsedTime();
    camera.position.x = Math.sin(elapsed * 0.05) * 0.15 + mouseSmooth.current.x * 0.3;
    camera.position.y = Math.sin(elapsed * 0.03) * 0.08 + mouseSmooth.current.y * 0.2;
    camera.lookAt(0, 0, 0);

    if (groupRef.current) groupRef.current.rotation.y += 0.0008;
  });

  return (
    <>
      <ambientLight color={0x112233} intensity={0.4} />
      <directionalLight color={0xFFEECC} intensity={1.8} position={[-5, 3, 4]} />

      <group ref={groupRef}>
        <Earth />
        <Clouds />
        <Atmosphere />
        {ROUTES.map((route, i) => (
          <FlightArc
            key={i}
            lat1={route[0]} lon1={route[1]}
            lat2={route[2]} lon2={route[3]}
          />
        ))}
        <Particles count={800} />
      </group>
    </>
  );
}
