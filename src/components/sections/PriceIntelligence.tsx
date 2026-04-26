"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Brain, BarChart3 } from "lucide-react";

const PRICE_DATA = [
  { date: "Apr 1", price: 3299 },
  { date: "Apr 3", price: 3150 },
  { date: "Apr 5", price: 2899 },
  { date: "Apr 7", price: 3100 },
  { date: "Apr 9", price: 2799 },
  { date: "Apr 11", price: 2650 },
  { date: "Apr 13", price: 2499 },
  { date: "Apr 15", price: 2750 },
  { date: "Apr 17", price: 2399 },
  { date: "Apr 19", price: 2199 },
  { date: "Apr 21", price: 2299 },
  { date: "Apr 23", price: 2099 },
  { date: "Apr 25", price: 1999 },
  { date: "Apr 26", price: 2499 },
];

function PriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Animate progress
          let start = 0;
          const animate = () => {
            start += 0.02;
            if (start >= 1) {
              setProgress(1);
              return;
            }
            // ease-out-cubic
            const t = 1 - Math.pow(1 - start, 3);
            setProgress(t);
            requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || progress <= 0.02) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const p = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = rect.width - p.left - p.right;
    const ch = rect.height - p.top - p.bottom;

    const prices = PRICE_DATA.map((d) => d.price);
    const minP = Math.min(...prices) * 0.92;
    const maxP = Math.max(...prices) * 1.05;

    const xScale = (i: number) => p.left + (i / (PRICE_DATA.length - 1)) * cw;
    const yScale = (v: number) => p.top + ch - ((v - minP) / (maxP - minP)) * ch;

    const visibleCount = Math.max(2, Math.floor(PRICE_DATA.length * progress));

    // Grid lines
    ctx.strokeStyle = "rgba(100,149,237,0.08)";
    ctx.lineWidth = 1;
    for (let y = 0; y <= 4; y++) {
      const yy = p.top + (y / 4) * ch;
      ctx.beginPath();
      ctx.moveTo(p.left, yy);
      ctx.lineTo(p.left + cw, yy);
      ctx.stroke();
      const val = maxP - (y / 4) * (maxP - minP);
      ctx.fillStyle = "#4A6080";
      ctx.font = "11px var(--font-data), monospace";
      ctx.textAlign = "right";
      ctx.fillText("₹" + Math.round(val).toLocaleString("en-IN"), p.left - 8, yy + 4);
    }

    // Date labels
    ctx.fillStyle = "#4A6080";
    ctx.textAlign = "center";
    PRICE_DATA.forEach((d, i) => {
      if (i % Math.ceil(PRICE_DATA.length / 7) === 0) {
        ctx.fillText(d.date, xScale(i), rect.height - p.bottom + 18);
      }
    });

    if (visibleCount < 2) return;

    // Area fill
    const grad = ctx.createLinearGradient(0, p.top, 0, p.top + ch);
    grad.addColorStop(0, "rgba(245,200,66,0.18)");
    grad.addColorStop(1, "rgba(245,200,66,0.0)");

    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(PRICE_DATA[0].price));
    for (let i = 1; i < visibleCount; i++) {
      const cx = (xScale(i - 1) + xScale(i)) / 2;
      ctx.bezierCurveTo(
        cx,
        yScale(PRICE_DATA[i - 1].price),
        cx,
        yScale(PRICE_DATA[i].price),
        xScale(i),
        yScale(PRICE_DATA[i].price)
      );
    }
    ctx.lineTo(xScale(visibleCount - 1), rect.height - p.bottom);
    ctx.lineTo(xScale(0), rect.height - p.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(PRICE_DATA[0].price));
    for (let i = 1; i < visibleCount; i++) {
      const cx = (xScale(i - 1) + xScale(i)) / 2;
      ctx.bezierCurveTo(
        cx,
        yScale(PRICE_DATA[i - 1].price),
        cx,
        yScale(PRICE_DATA[i].price),
        xScale(i),
        yScale(PRICE_DATA[i].price)
      );
    }
    ctx.strokeStyle = "#F5C842";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Points
    for (let i = 0; i < visibleCount; i++) {
      const x = xScale(i);
      const y = yScale(PRICE_DATA[i].price);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,200,66,0.2)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#F5C842";
      ctx.fill();
    }

    // Last point glow
    if (progress >= 0.98) {
      const lx = xScale(PRICE_DATA.length - 1);
      const ly = yScale(PRICE_DATA[PRICE_DATA.length - 1].price);
      ctx.shadowColor = "rgba(245,200,66,0.6)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#F5C842";
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [progress]);

  return (
    <div ref={containerRef} className="w-full h-[280px]">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export function PriceIntelligence() {
  return (
    <section id="intelligence" className="intelligence-section py-20 md:py-28 relative z-10">
      <div className="container-app">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Price Intelligence
            </span>
            <h2 className="section-title text-3xl md:text-4xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
              Smart Price Tracking
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3 glass-card rounded-[var(--radius-lg)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--aurora-gold)]" />
                <span className="text-sm font-medium">DEL → BOM Price Trend</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Last 30 days</span>
            </div>
            <PriceChart />
          </div>

          {/* Insights panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-[var(--aurora-teal)]" />
                <span className="text-sm font-medium">ML Prediction</span>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-[var(--accent-green)]">87%</span>
                <span className="ml-2 text-sm text-[var(--text-secondary)]">confidence</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Prices for this route are likely to rise in the next 7 days.
              </p>
              <div className="flex items-center gap-2 text-sm text-[var(--accent-green)]">
                <TrendingUp className="w-4 h-4" />
                <span>Recommended: Book now</span>
              </div>
            </div>

            <div className="glass-card rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-[var(--aurora-gold)]" />
                <span className="text-sm font-medium">Best Price Window</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Historical data shows the cheapest fares appear 3-4 weeks before departure for this route.
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Avg. savings: ₹1,200</span>
                <span>Day of week: Tuesday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
