"use client";

import { useEffect, useRef } from "react";
import { Plane, TrendingDown, Clock } from "lucide-react";

const ROUTES = [
  { from: "Delhi", fromCode: "DEL", to: "Mumbai", toCode: "BOM", price: 2499, was: 3799, duration: "2h 15m", frequency: "45 flights/day" },
  { from: "Bangalore", fromCode: "BLR", to: "Hyderabad", toCode: "HYD", price: 1899, was: 2899, duration: "1h 10m", frequency: "32 flights/day" },
  { from: "Mumbai", fromCode: "BOM", to: "Dubai", toCode: "DXB", price: 8999, was: 12999, duration: "3h 30m", frequency: "18 flights/day" },
  { from: "Chennai", fromCode: "MAA", to: "Delhi", toCode: "DEL", price: 3299, was: 4899, duration: "2h 50m", frequency: "28 flights/day" },
  { from: "Delhi", fromCode: "DEL", to: "London", toCode: "LHR", price: 28999, was: 38999, duration: "9h 30m", frequency: "8 flights/day" },
  { from: "Bangalore", fromCode: "BLR", to: "Singapore", toCode: "SIN", price: 15999, was: 21999, duration: "4h 30m", frequency: "12 flights/day" },
];

function RouteCard({ route }: { route: typeof ROUTES[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !glareRef.current) return;

    const isTouch = "ontouchstart" in window;
    if (isTouch) return;

    const card = cardRef.current;
    const glare = glareRef.current;
    const MAX_TILT = 10;

    function handleMove(e: MouseEvent) {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = -dy * MAX_TILT;
      const rotY = dx * MAX_TILT;

      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
      card.style.transition = "transform 0.05s linear, box-shadow 0.3s ease";

      const gx = ((dx + 1) / 2) * 100;
      const gy = ((dy + 1) / 2) * 100;
      glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12) 0%, transparent 65%)`;
      glare.style.opacity = "1";
    }

    function handleEnter() {
      card.style.willChange = "transform";
      card.style.zIndex = "10";
    }

    function handleLeave() {
      card.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease";
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
      card.style.willChange = "auto";
      card.style.zIndex = "";
      glare.style.opacity = "0";
    }

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseenter", handleEnter);
    card.addEventListener("mouseleave", handleLeave);

    return () => {
      card.removeEventListener("mousemove", handleMove);
      card.removeEventListener("mouseenter", handleEnter);
      card.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="route-card relative glass-card rounded-[var(--radius-lg)] p-5 cursor-pointer overflow-hidden"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Glare overlay */}
      <div
        ref={glareRef}
        className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 transition-opacity duration-300 z-[2]"
      />

      {/* Shine sweep on hover */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-3/5 w-2/5 h-[200%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-[15deg] transition-[left] duration-500 group-hover:left-[120%]" />
      </div>

      <div className="relative z-[1]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[var(--text-primary)]">{route.from}</span>
            <Plane className="w-3.5 h-3.5 text-[var(--aurora-teal)] rotate-90" />
            <span className="font-semibold text-[var(--text-primary)]">{route.to}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
            SAVE ₹{(route.was - route.price).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="mb-4">
          <span className="text-2xl font-bold text-[var(--aurora-gold)] font-[family-name:var(--font-data)]">
            ₹{route.price.toLocaleString("en-IN")}
          </span>
          <span className="ml-2 text-sm text-[var(--text-muted)] line-through">
            ₹{route.was.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {route.duration}
          </span>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {route.frequency}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FeaturedRoutes() {
  return (
    <section id="routes" className="py-20 md:py-28 relative z-10">
      <div className="container-app">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Popular Routes
            </span>
            <h2 className="section-title text-3xl md:text-4xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
              Featured Routes
            </h2>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROUTES.map((route, i) => (
            <RouteCard key={i} route={route} />
          ))}
        </div>
      </div>
    </section>
  );
}
