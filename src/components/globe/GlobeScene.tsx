"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  earthVertexShader,
  earthFragmentShader,
  cloudVertexShader,
  cloudFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from "./shaders";
import { getGlowDotTexture, getStarTexture } from "./textures";

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
  const phi   = (90 - lat) * (Math.PI / 180);
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
      earthRef.current.rotation.y += 0.00055;
      const mat = earthRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uTime) {
        mat.uniforms.uTime.value = clock.getElapsedTime();
      }
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
        uniforms={{
          uTime:      { value: 0 },
          uNightSide: { value: 0.65 },
          uCityGlow:  { value: 0.5 },
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
    if (cloudRef.current) cloudRef.current.rotation.y += 0.00075;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[1.011, 64, 64]} />
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

// ─── ATMOSPHERE (multi-layer for depth) ───────────────────────────────────
function Atmosphere() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[1.055, 48, 48]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={{ uColor: { value: new THREE.Color(0x0A3A7A) } }}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.12, 32, 32]} />
        <shaderMaterial
          vertexShader={`
            varying float vF;
            void main() {
              vec3 vn = normalize(mat3(modelMatrix) * normal);
              vec3 vd = normalize(cameraPosition - (modelMatrix * vec4(position,1.0)).xyz);
              vF = 1.0 - max(dot(vn, vd), 0.0);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying float vF;
            void main() {
              float f = pow(vF, 4.0);
              gl_FragColor = vec4(0.08, 0.25, 0.55, f * 0.15);
            }
          `}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ─── FLIGHT ARC ───────────────────────────────────────────────────────────
function FlightArc({ lat1, lon1, lat2, lon2 }: {
  lat1: number; lon1: number; lat2: number; lon2: number;
}) {
  const progressRef = useRef(Math.random());

  const { points } = useMemo(() => {
    const p1 = latLonToVec3(lat1, lon1);
    const p2 = latLonToVec3(lat2, lon2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const dist = p1.distanceTo(p2);
    const ctrl = mid.clone().normalize().multiplyScalar(1.02 + dist * 0.35);
    const curve = new THREE.QuadraticBezierCurve3(p1, ctrl, p2);
    return { points: curve.getPoints(80) };
  }, [lat1, lon1, lat2, lon2]);

  const color = useMemo(() => new THREE.Color(0xF5C842), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(81 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lineMat = useMemo(() => new THREE.LineBasicMaterial({
    color, transparent: true, opacity: 0.5, linewidth: 1,
  }), [color]);

  const dotMat = useMemo(() => {
    const tex = getGlowDotTexture();
    return new THREE.SpriteMaterial({
      map: tex,
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
    });
  }, [color]);

  const lineObj = useMemo(() => new THREE.Line(geometry, lineMat), [geometry, lineMat]);
  const spriteRef = useRef<THREE.Sprite>(null);

  useFrame((_, delta) => {
    progressRef.current = (progressRef.current + 0.10 * delta) % 2;
    const progress = progressRef.current;
    const sprite = spriteRef.current;
    if (!sprite) return;

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

      const headPt = points[headIdx];
      sprite.position.copy(headPt);

      const fade = Math.sin(head * Math.PI);
      sprite.material.opacity = fade * 0.85;
      sprite.scale.setScalar(0.038 * fade);
      lineMat.opacity = fade * 0.45;

      lineObj.visible = true;
      sprite.visible = true;
    } else {
      lineObj.visible = false;
      sprite.visible = false;
    }
  });

  return (
    <group>
      <primitive object={lineObj} />
      <sprite ref={spriteRef} material={dotMat} />
    </group>
  );
}

// ─── SOFT PARTICLE STARFIELD ──────────────────────────────────────────────
function StarField({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const memo = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkle = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * 2.8;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      if (t < 0.35) {
        colors[i * 3]     = 1.00;
        colors[i * 3 + 1] = 0.96;
        colors[i * 3 + 2] = 0.88;
      } else if (t < 0.65) {
        colors[i * 3]     = 0.78;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1.00;
      } else if (t < 0.82) {
        colors[i * 3]     = 0.95;
        colors[i * 3 + 1] = 0.78;
        colors[i * 3 + 2] = 0.25;
      } else {
        colors[i * 3]     = 0.00;
        colors[i * 3 + 1] = 0.92;
        colors[i * 3 + 2] = 0.82;
      }

      const sizeRoll = Math.random();
      if (sizeRoll < 0.92) {
        sizes[i] = 0.008 + Math.random() * 0.015;
      } else {
        sizes[i] = 0.035 + Math.random() * 0.04;
      }

      twinkle[i] = Math.random() > 0.6 ? 1.0 + Math.random() * 2.0 : 0.2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("twinkle", new THREE.BufferAttribute(twinkle, 1));
    geo.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

    return {
      geometry: geo,
      baseSizes: new Float32Array(sizes),
      tex: getStarTexture(),
    };
  }, [count]);

  const material = useMemo(() => new THREE.PointsMaterial({
    map: memo.tex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [memo.tex]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const sizesAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const phases = pointsRef.current.geometry.attributes.phase.array as Float32Array;
    const twinkleArray = pointsRef.current.geometry.attributes.twinkle.array as Float32Array;
    const elapsed = clock.getElapsedTime();

    for (let i = 0; i < sizesAttr.count; i++) {
      const t = twinkleArray[i];
      if (t > 0.5) {
        const wobble = 0.75 + 0.25 * Math.sin(elapsed * t + phases[i]);
        sizesAttr.setX(i, memo.baseSizes[i] * wobble);
      }
    }
    sizesAttr.needsUpdate = true;
    pointsRef.current.rotation.y += 0.00008;
  });

  return (
    <points ref={pointsRef} geometry={memo.geometry} material={material} />
  );
}

// ─── BACKGROUND STAR DOME ─────────────────────────────────────────────────
function BackgroundStars({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 15;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      vertexColors: false,
      transparent: true,
      opacity: 0.3,
      size: 0.25,
      sizeAttenuation: true,
      depthWrite: false,
    });
    return { geometry: geo, material: mat };
  }, [count]);

  return <points geometry={geometry} material={material} />;
}

// ─── SCENE WRAPPER ────────────────────────────────────────────────────────
export function GlobeSceneR3F() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const mouseSmooth = useRef(new THREE.Vector2(0, 0));
  const mouseDelta = useRef(new THREE.Vector2(0, 0));

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
    if (typeof document !== "undefined" && document.hidden) return;

    const elapsed = clock.getElapsedTime();
    if (groupRef.current) groupRef.current.rotation.y += 0.00055;

    mouseSmooth.current.x += (mouseDelta.current.x - mouseSmooth.current.x) * 0.04;
    mouseSmooth.current.y += (mouseDelta.current.y - mouseSmooth.current.y) * 0.04;
    camera.position.x = Math.sin(elapsed * 0.05) * 0.15 + mouseSmooth.current.x * 0.3;
    camera.position.y = Math.sin(elapsed * 0.03) * 0.08 + mouseSmooth.current.y * 0.2;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight color={0x0A1528} intensity={0.35} />
      <directionalLight color={0xFFE5B4} intensity={1.6} position={[-5, 2.5, 4]} />
      <directionalLight color={0x4A6FA5} intensity={0.12} position={[5, -1, -4]} />
      <directionalLight color={0x1A3060} intensity={0.08} position={[0, -4, 0]} />

      <BackgroundStars count={300} />

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

        <StarField count={600} />
      </group>

      {/* Soft bloom on bright elements (cities, arcs, stars) */}
      <EffectComposer renderPriority={1}>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
