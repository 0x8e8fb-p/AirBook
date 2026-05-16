"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ChevronRight, Sparkles } from "lucide-react";

interface Tip {
  text: string;
  condition?: (ctx: TipContext) => boolean;
}

interface TipContext {
  dayOfWeek: number; // 0=Sun, 6=Sat
  avgPrice: number;
  origin: string;
  destination: string;
}

const ALL_TIPS: Tip[] = [
  { text: "Domestic routes often price best when booked 3–6 weeks ahead of departure." },
  { text: "Mid-week departures are frequently cheaper than peak Friday and Sunday demand.", condition: (ctx) => ctx.dayOfWeek !== 2 && ctx.dayOfWeek !== 3 },
  { text: "You are already searching mid-week — that usually helps surface the calmest fare windows.", condition: (ctx) => ctx.dayOfWeek === 2 || ctx.dayOfWeek === 3 },
  { text: "If live booking is unavailable today, save an alert and return when the route reconnects." },
  { text: "When two fares are close, compare baggage and refund rules before you choose the cheaper headline price." },
  { text: "Early departures and late-night flights can open lower fare bands when your timing is flexible." },
  { text: "One-way pricing can beat a round trip on busy routes, especially around holiday peaks." },
  { text: "Wallet and card-based savings can materially change the final payable amount on the booking page." },
  { text: "Nearby dates often matter more than nearby airports for the biggest savings on short-haul routes." },
  { text: "Long weekends and festival windows reprice quickly — confirm early if your travel dates are fixed." },
];

export function CostCuttingTips({
  origin,
  destination,
  avgPrice,
  offerCount,
  maxSaving,
}: {
  origin: string;
  destination: string;
  avgPrice: number;
  offerCount: number;
  maxSaving: number;
}) {
  const [showAll, setShowAll] = useState(false);

  const ctx: TipContext = useMemo(() => ({
    dayOfWeek: new Date().getDay(),
    avgPrice,
    origin,
    destination,
  }), [avgPrice, origin, destination]);

  const filteredTips = useMemo(() => {
    return ALL_TIPS
      .filter(tip => !tip.condition || tip.condition(ctx))
      .slice(0, showAll ? 6 : 3);
  }, [ctx, showAll]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="surface-card rounded-[28px] p-5"
    >
      {/* Header with offer count */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-cta)]" />
          <div>
            <h3 className="text-sm font-semibold">Fare strategy for this route</h3>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Practical guidance for {origin} → {destination}
              {avgPrice > 0 ? ` · average visible fare ${avgPrice.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}` : ""}
            </p>
          </div>
        </div>
        {offerCount > 0 && (
          <span className="rounded-full bg-[var(--accent-green)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-green)]">
            {offerCount} saving path{offerCount > 1 ? "s" : ""} · up to ₹{maxSaving.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Tips */}
      <div className="space-y-2.5">
        {filteredTips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-[18px] border border-[var(--border-muted)] bg-[var(--bg-subtle)] px-3.5 py-3">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-secondary)] leading-relaxed">{tip.text}</span>
          </div>
        ))}
      </div>

      {!showAll && filteredTips.length >= 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-[var(--accent-cta)] hover:underline"
        >
          Show more tips <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}
