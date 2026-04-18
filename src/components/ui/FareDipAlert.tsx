"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";
import { fetchPriceTrend } from "@/app/actions/flightActions";
import { formatPrice } from "@/lib/constants";

interface Props {
  origin: string;
  destination: string;
  date: string;
}

type TrendVerdict = "DROP_LIKELY" | "RISING" | "STABLE" | "INSUFFICIENT_DATA";
interface Trend {
  verdict: TrendVerdict;
  currentLow: number | null;
  avg30d: number | null;
  sampleCount: number;
  confidence: "high" | "medium" | "low";
  message: string;
}

const STYLES: Record<TrendVerdict, { border: string; bg: string; text: string; Icon: typeof TrendingDown; label: string }> = {
  DROP_LIKELY: {
    border: "border-[var(--accent-green)]/30",
    bg: "bg-[var(--accent-green)]/5",
    text: "text-[var(--accent-green)]",
    Icon: TrendingDown,
    label: "Prices likely to drop",
  },
  RISING: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-500",
    Icon: TrendingUp,
    label: "Book now — prices rising",
  },
  STABLE: {
    border: "border-[var(--border-default)]",
    bg: "bg-[var(--bg-subtle)]",
    text: "text-[var(--text-secondary)]",
    Icon: Minus,
    label: "Prices stable",
  },
  INSUFFICIENT_DATA: {
    border: "border-[var(--border-default)]",
    bg: "bg-[var(--bg-subtle)]",
    text: "text-[var(--text-muted)]",
    Icon: Sparkles,
    label: "Tracking prices",
  },
};

export function FareDipAlert({ origin, destination, date }: Props) {
  const [trend, setTrend] = useState<Trend | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPriceTrend(origin, destination, date)
      .then((r) => !cancelled && setTrend(r as Trend))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [origin, destination, date]);

  if (!trend) return null;
  if (trend.verdict === "INSUFFICIENT_DATA" && trend.sampleCount === 0) return null;

  const style = STYLES[trend.verdict];
  const Icon = style.Icon;

  return (
    <div className={`mb-4 p-3 rounded-[var(--radius-lg)] border ${style.border} ${style.bg} flex items-start gap-3`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${style.text}`}>{style.label}</div>
        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{trend.message}</div>
        {trend.currentLow !== null && trend.avg30d !== null && (
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-mono-price">
            Now {formatPrice(trend.currentLow)} · 30-day avg {formatPrice(trend.avg30d)} · {trend.sampleCount} samples · {trend.confidence} confidence
          </div>
        )}
      </div>
    </div>
  );
}
