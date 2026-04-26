"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const GlobeSceneR3F = dynamic(
  () => import("./GlobeScene").then((mod) => mod.GlobeSceneR3F),
  { ssr: false }
);

import { CssGlobe } from "./CssGlobe";

function WebGLCheck() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) return <CssGlobe />;
  return null;
}

export function GlobeCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <CssGlobe />;
  }

  return (
    <div className="relative w-full h-full">
      <WebGLCheck />
      <Suspense fallback={<CssGlobe />}>
        {typeof window !== "undefined" && Canvas && GlobeSceneR3F && (
          <Canvas
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            camera={{ position: [0, 0, 2.8], fov: 45, near: 0.1, far: 1000 }}
            dpr={Math.min(window.devicePixelRatio, 2)}
            style={{ background: "transparent", position: "absolute", inset: 0 }}
          >
            <GlobeSceneR3F />
          </Canvas>
        )}
      </Suspense>
    </div>
  );
}
