"use client";

export function CssGlobe() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Outer glow rings */}
      <div className="absolute rounded-full opacity-20"
        style={{
          width: "min(700px, 90vw)", height: "min(700px, 90vw)",
          background: "radial-gradient(circle at 40% 35%, rgba(100,180,255,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="absolute rounded-full opacity-15"
        style={{
          width: "min(750px, 96vw)", height: "min(750px, 96vw)",
          background: "radial-gradient(circle at 50% 50%, rgba(245,200,66,0.06) 0%, transparent 50%)",
        }}
      />
      {/* Main sphere */}
      <div
        className="relative rounded-full"
        style={{
          width: "min(500px, 70vw)",
          height: "min(500px, 70vw)",
          background: `
            radial-gradient(circle at 38% 32%, #1a3a60 0%, #0f2a4a 20%, #0a1a30 50%, #060f1a 80%, #03050A 100%)
          `,
          boxShadow: `
            inset -30px -30px 60px rgba(0,0,0,0.6),
            inset 15px 15px 40px rgba(60,130,200,0.15),
            0 0 60px rgba(30,90,180,0.12),
            0 0 160px rgba(20,60,140,0.08)
          `,
          border: "1px solid rgba(60,130,200,0.12)",
          animation: "globeBreathe 8s ease-in-out infinite",
        }}
      >
        {/* Subtle rotating gradient band (cloud illusion) */}
        <div className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: "linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)",
            transform: "rotate(-15deg)",
            animation: "globeRotateBand 20s linear infinite",
          }}
        />
        {/* Equatorial atmosphere ring */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
          style={{
            width: "104%", height: "6%",
            background: "linear-gradient(90deg, transparent 10%, rgba(100,160,255,0.4) 40%, rgba(245,200,66,0.3) 60%, transparent 90%)",
            filter: "blur(4px)",
          }}
        />
      </div>
    </div>
  );
}
