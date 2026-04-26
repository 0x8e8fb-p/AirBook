"use client";

export function CssGlobe() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="rounded-full"
        style={{
          width: "min(600px, 80vw)",
          height: "min(600px, 80vw)",
          background:
            "radial-gradient(circle at 35% 35%, #0A2A4A 0%, #03050A 70%)",
          border: "1px solid rgba(100,149,237,0.15)",
          animation: "globeRotate 30s linear infinite",
          boxShadow:
            "inset -20px -20px 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,100,255,0.1), 0 0 200px rgba(0,100,255,0.05)",
        }}
      />
    </div>
  );
}
