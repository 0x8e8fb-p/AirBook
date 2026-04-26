"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

/* ─── Flight routes ───────────────────────────────────────── */
interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  order: number;
}

const ARCS: ArcData[] = [
  { startLat: 28.56, startLng: 77.10, endLat: 19.09, endLng: 72.87, color: ["#F5C842", "#C49A20"], order: 1 },
  { startLat: 28.56, startLng: 77.10, endLat: 13.08, endLng: 80.27, color: ["#F5C842", "#00E5CC"], order: 2 },
  { startLat: 19.09, startLng: 72.87, endLat: 13.08, endLng: 80.27, color: ["#00E5CC", "#F5C842"], order: 3 },
  { startLat: 12.97, startLng: 77.59, endLat: 17.39, endLng: 78.49, color: ["#8B5CF6", "#F5C842"], order: 4 },
  { startLat: 28.56, startLng: 77.10, endLat: 12.97, endLng: 77.59, color: ["#F5C842", "#8B5CF6"], order: 5 },
  { startLat: 22.57, startLng: 88.36, endLat: 19.09, endLng: 72.87, color: ["#00E5CC", "#00E5CC"], order: 6 },
  { startLat: 28.56, startLng: 77.10, endLat: 1.35,  endLng: 103.82, color: ["#F5C842", "#F5C842"], order: 7 },
  { startLat: 19.09, startLng: 72.87, endLat: 25.25, endLng: 55.36,  color: ["#00E5CC", "#F5C842"], order: 8 },
  { startLat: 12.97, startLng: 77.59, endLat: 10.16, endLng: 76.39,  color: ["#8B5CF6", "#00E5CC"], order: 9 },
  { startLat: 28.56, startLng: 77.10, endLat: 23.07, endLng: 72.58,  color: ["#F5C842", "#F43F5E"], order: 10 },
];

/* ─── Airports ────────────────────────────────────────────── */
interface AirportData {
  lat: number;
  lng: number;
  label: string;
  color: string;
  size: number;
}

const AIRPORTS: AirportData[] = [
  { lat: 28.56, lng: 77.10, label: "DEL", color: "#F5C842", size: 0.50 },
  { lat: 19.09, lng: 72.87, label: "BOM", color: "#F5C842", size: 0.48 },
  { lat: 13.08, lng: 80.27, label: "MAA", color: "#00E5CC", size: 0.40 },
  { lat: 12.97, lng: 77.59, label: "BLR", color: "#00E5CC", size: 0.42 },
  { lat: 17.39, lng: 78.49, label: "HYD", color: "#8B5CF6", size: 0.36 },
  { lat: 22.57, lng: 88.36, label: "CCU", color: "#8B5CF6", size: 0.36 },
  { lat: 23.07, lng: 72.58, label: "AMD", color: "#F43F5E", size: 0.32 },
  { lat: 10.16, lng: 76.39, label: "COK", color: "#00E5CC", size: 0.30 },
  { lat: 1.35,  lng: 103.82, label: "SIN", color: "#F5C842", size: 0.36 },
  { lat: 25.25, lng: 55.36,  label: "DXB", color: "#F5C842", size: 0.42 },
];

/* ─── Rings ───────────────────────────────────────────────── */
interface RingData {
  lat: number;
  lng: number;
  maxR: number;
  speed: number;
  period: number;
}

const RINGS: RingData[] = AIRPORTS.map((a) => ({
  lat: a.lat,
  lng: a.lng,
  maxR: 3.2 + Math.random() * 0.6,
  speed: 1.2 + Math.random() * 0.4,
  period: 900 + Math.floor(Math.random() * 400),
}));

/* ─── Component ───────────────────────────────────────────── */
export function GlobeGL() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  /* Responsive sizing */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Globe ready – set initial POV + controls */
  const handleGlobeReady = () => {
    const g = globeRef.current;
    if (!g) return;

    g.pointOfView({ lat: 18, lng: 72, altitude: 2.4 }, 1400);

    const controls = g.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = false;
      controls.enablePan = false;
    }
  };

  if (dims.w === 0 || dims.h === 0) {
    return <div ref={wrapRef} style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Globe
        ref={globeRef}
        onGlobeReady={handleGlobeReady}

        /* Earth */
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#4B8CC9"
        atmosphereAltitude={0.22}

        /* Arcs */
        arcsData={ARCS}
        arcColor="color"
        arcDashLength={0.92}
        arcDashGap={0.06}
        arcDashInitialGap={(d) => (d as ArcData).order * 0.12}
        arcDashAnimateTime={2600}
        arcStroke={0.65}
        arcAltitudeAutoScale={0.4}
        arcCircularResolution={64}

        /* Airports */
        pointsData={AIRPORTS}
        pointColor="color"
        pointAltitude={0.008}
        pointRadius="size"
        pointResolution={32}
        pointsMerge={false}

        /* Rings */
        ringsData={RINGS}
        ringColor={() => (t: number) => `rgba(0,229,204,${Math.max(0, 1 - t)})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="speed"
        ringRepeatPeriod="period"

        /* Renderer */
        width={dims.w}
        height={dims.h}
      />
    </div>
  );
}
