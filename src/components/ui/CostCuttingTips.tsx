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
  { text: "Book 21-45 days before departure for the lowest domestic fares", condition: () => true },
  { text: "Tuesday & Wednesday flights are typically 15-20% cheaper", condition: (ctx) => ctx.dayOfWeek !== 2 && ctx.dayOfWeek !== 3 },
  { text: "You're searching on a great day — mid-week fares tend to be lowest!", condition: (ctx) => ctx.dayOfWeek === 2 || ctx.dayOfWeek === 3 },
  { text: "Use incognito mode on OTA sites to avoid dynamic pricing markup" },
  { text: "Check the airline website directly — sometimes ₹200-500 cheaper than OTAs" },
  { text: "Stack bank card discounts with cashback portals (CashKaro, GoPaisa) for double savings" },
  { text: "Set a price alert — we'll notify you when fares drop for this route" },
  { text: "Early morning flights (5-7 AM) are often the cheapest departure slots" },
  { text: "Red-eye flights save money — overnight departures can be 30% cheaper" },
  { text: "Book one-way tickets separately if round-trip pricing seems high" },
  { text: "Avoid booking during festivals and long weekends — fares spike 40-60%" },
  { text: "Compare prices across payment methods — some cards give extra instant discounts" },
  { text: "Nearby airports trick: try alternate airports for potentially cheaper fares" },
  { text: "Flexible date? Use ±3 day search to find the cheapest travel window" },
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
      className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4 mb-4"
    >
      {/* Header with offer count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-cta)]" />
          <h3 className="text-sm font-semibold">Save More on This Route</h3>
        </div>
        {offerCount > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-green)]/10 text-[var(--accent-green)] px-2 py-0.5 rounded-full">
            {offerCount} offers • Save up to ₹{maxSaving.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Tips */}
      <div className="space-y-2">
        {filteredTips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Lightbulb className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
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
