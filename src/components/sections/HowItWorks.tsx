"use client";

import { Search, Cpu, Tag } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Search Any Route",
    desc: "Enter your origin, destination, and travel date. We hit all 6 Indian OTAs simultaneously.",
    curve: "M0 20 Q100 0 200 20",
    color: "#F5C842",
  },
  {
    num: "02",
    icon: Cpu,
    title: "AI Price Analysis",
    desc: "Our ML model analyzes 90 days of fare history to predict if prices will rise or fall.",
    curve: "M0 20 Q100 40 200 20",
    color: "#00E5CC",
  },
  {
    num: "03",
    icon: Tag,
    title: "Apply Real Savings",
    desc: "Only verified, currently-valid bank offers and coupon codes. No fake discounts.",
    color: "#8B5CF6",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-28 relative z-10">
      <div className="container-app">
        <div className="text-center mb-14">
          <span className="inline-block text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Simple & Transparent
          </span>
          <h2 className="section-title text-3xl md:text-4xl font-semibold tracking-tight font-[family-name:var(--font-display)] mb-3">
            How AirBook Works
          </h2>
          <p className="text-[var(--text-secondary)] text-base max-w-md mx-auto">
            From search to the best price, in milliseconds.
          </p>
        </div>

        <div className="how-steps grid md:grid-cols-3 gap-10 md:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="how-step relative text-center">
              {/* Step number watermark */}
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[120px] font-bold text-[var(--text-primary)]/[0.03] select-none pointer-events-none font-[family-name:var(--font-display)] leading-none">
                {step.num}
              </span>

              {/* Icon */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full border border-[var(--glass-border)] bg-[var(--deep)] mb-6">
                <step.icon className="w-8 h-8" style={{ color: step.color }} />
              </div>

              {/* Connector (hidden on last / mobile) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(67%+20px)] w-[calc(33%-40px)]" aria-hidden="true">
                  <svg viewBox="0 0 200 40" className="w-full h-8">
                    <path
                      d={step.curve}
                      stroke={step.color}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      fill="none"
                      opacity="0.4"
                    />
                  </svg>
                </div>
              )}

              <h3 className="text-lg font-semibold mb-2 font-[family-name:var(--font-ui)]">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
