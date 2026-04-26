"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const GlobeGL = dynamic(() => import("./GlobeGL").then((m) => m.GlobeGL), {
  ssr: false,
  loading: () => <CssFallback />,
});

function CssFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="rounded-full"
        style={{
          width: "min(500px, 70vw)",
          height: "min(500px, 70vw)",
          background:
            "radial-gradient(circle at 38% 32%, #1a3a60 0%, #0f2a4a 20%, #0a1a30 50%, #060f1a 80%, #03050A 100%)",
          boxShadow:
            "inset -30px -30px 60px rgba(0,0,0,0.6), inset 15px 15px 40px rgba(60,130,200,0.15), 0 0 60px rgba(30,90,180,0.12), 0 0 160px rgba(20,60,140,0.08)",
          border: "1px solid rgba(60,130,200,0.12)",
          animation: "globeBreathe 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export function GlobeCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <CssFallback />;

  return (
    <div className="absolute top-1/2 left-[30%] md:left-[45%] -translate-y-1/2 w-[120vw] md:w-[80vw] aspect-square z-0">
      <GlobeGL />
    </div>
  );
}
