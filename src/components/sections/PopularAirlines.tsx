"use client";

import { Star, Clock, Plane } from "lucide-react";

const AIRLINES = [
  { name: "IndiGo", code: "6E", onTime: 94, rating: 4.2, routes: 85, color: "#0066CC" },
  { name: "Air India", code: "AI", onTime: 89, rating: 4.0, routes: 62, color: "#E31837" },
  { name: "Akasa Air", code: "QP", onTime: 92, rating: 4.1, routes: 28, color: "#FF6B35" },
  { name: "Vistara", code: "UK", onTime: 93, rating: 4.4, routes: 42, color: "#6C217F" },
  { name: "SpiceJet", code: "SG", onTime: 86, rating: 3.8, routes: 48, color: "#E31837" },
  { name: "Air Asia India", code: "I5", onTime: 88, rating: 3.9, routes: 22, color: "#E31837" },
];

function OnTimeRadial({ percentage, color }: { percentage: number; color: string }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-[var(--text-primary)]">{percentage}%</span>
    </div>
  );
}

export function PopularAirlines() {
  return (
    <section className="py-20 md:py-28 relative z-10">
      <div className="container-app">
        <div className="mb-10">
          <span className="inline-block text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Airlines
          </span>
          <h2 className="section-title text-3xl md:text-4xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Popular Airlines
          </h2>
        </div>

        <div className="airlines-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AIRLINES.map((airline) => (
            <div
              key={airline.code}
              className="airline-card glass-card rounded-[var(--radius-lg)] p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--glass-border)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: airline.color }}
                  >
                    {airline.code}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px]">{airline.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <Star className="w-3 h-3 fill-[var(--aurora-gold)] text-[var(--aurora-gold)]" />
                      <span>{airline.rating}</span>
                    </div>
                  </div>
                </div>
                <OnTimeRadial percentage={airline.onTime} color={airline.color} />
              </div>

              <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {airline.onTime}% on-time
                </span>
                <span className="flex items-center gap-1">
                  <Plane className="w-3 h-3" />
                  {airline.routes} routes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
