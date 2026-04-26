"use client";

import { Plane, TrendingDown } from "lucide-react";

const DEALS = [
  { from: "Delhi", to: "Mumbai", code: "DEL-BOM", price: 2499, was: 3799, off: 34, airline: "IndiGo · 6E-456", expires: "6h", coupon: "SAVE750CT" },
  { from: "Bangalore", to: "Delhi", code: "BLR-DEL", price: 3299, was: 4899, off: 33, airline: "Air India · AI-504", expires: "12h", coupon: "FLY500" },
  { from: "Mumbai", to: "Chennai", code: "BOM-MAA", price: 1999, was: 2999, off: 33, airline: "IndiGo · 6E-221", expires: "4h", coupon: "CHENNAI400" },
  { from: "Hyderabad", to: "Bangalore", code: "HYD-BLR", price: 1799, was: 2599, off: 31, airline: "Akasa Air · QP-1120", expires: "8h", coupon: "BLR300" },
  { from: "Delhi", to: "Dubai", code: "DEL-DXB", price: 8999, was: 12999, off: 31, airline: "Emirates · EK-511", expires: "24h", coupon: "DXB1500" },
  { from: "Mumbai", to: "Singapore", code: "BOM-SIN", price: 12499, was: 16999, off: 26, airline: "Singapore Airlines · SQ-421", expires: "48h", coupon: "SIN2000" },
  { from: "Chennai", to: "Bangalore", code: "MAA-BLR", price: 1499, was: 2199, off: 32, airline: "IndiGo · 6E-653", expires: "3h", coupon: "SOUTH250" },
  { from: "Delhi", to: "London", code: "DEL-LON", price: 28999, was: 38999, off: 26, airline: "Air India · AI-111", expires: "72h", coupon: "LONDON4000" },
];

export function DealsStrip() {
  // Double the deals for seamless loop
  const allDeals = [...DEALS, ...DEALS];

  return (
    <section id="deals" className="deals-strip py-20 md:py-24 relative z-10 overflow-hidden">
      <div className="container-app mb-8 flex items-end justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[var(--aurora-teal)] mb-3">
            <TrendingDown className="w-3.5 h-3.5" />
            Live Deals
          </span>
          <h2 className="section-title text-2xl md:text-3xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Trending Right Now
          </h2>
        </div>
        <button className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--glass-border)] text-sm text-[var(--text-secondary)] hover:text-[var(--aurora-gold)] hover:border-[var(--aurora-gold)] transition-all">
          View All Deals
          <Plane className="w-3.5 h-3.5 rotate-90" />
        </button>
      </div>

      {/* Marquee track */}
      <div className="deals-track-wrap overflow-hidden" style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}>
        <div
          className="flex gap-4 w-max"
          style={{ animation: "marqueeScroll 40s linear infinite" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.animationPlayState = "running";
          }}
        >
          {allDeals.map((deal, i) => (
            <article
              key={i}
              className="deal-card flex-shrink-0 w-[240px] p-5 rounded-[var(--radius-lg)] glass-card cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]"
              style={{ transitionTimingFunction: "var(--ease-spring)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">{deal.from}</span>
                  <Plane className="w-3 h-3 text-[var(--text-muted)] rotate-90" />
                  <span className="font-medium text-[var(--text-primary)]">{deal.to}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--aurora-violet)]/15 text-[var(--aurora-violet)] border border-[var(--aurora-violet)]/25">
                  -{deal.off}%
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[28px] font-bold text-[var(--aurora-gold)] font-[family-name:var(--font-data)] leading-none">
                  ₹{deal.price.toLocaleString("en-IN")}
                </span>
                <span className="ml-2 text-sm text-[var(--text-muted)] line-through">
                  ₹{deal.was.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-3">
                <span>{deal.airline}</span>
                <span>Expires in {deal.expires}</span>
              </div>

              <div className="inline-block px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--aurora-violet)]/10 border border-dashed border-[var(--aurora-violet)]/40 text-[11px] font-semibold text-[var(--aurora-violet)] tracking-wider font-[family-name:var(--font-data)]">
                {deal.coupon}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
