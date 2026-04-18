"use client";

import { useEffect, useState } from "react";
import { TrendingDown, Calendar } from "lucide-react";
import { getCheapestNearbyDays, type NearbyDay } from "@/app/actions/flightActions";
import { formatPrice } from "@/lib/constants";

interface Props {
  origin: string;
  destination: string;
  selectedDate: string;
  onPickDate?: (date: string) => void;
}

export function DateHinter({ origin, destination, selectedDate, onPickDate }: Props) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [nearby, setNearby] = useState<NearbyDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCheapestNearbyDays(origin, destination, selectedDate)
      .then((r) => {
        if (cancelled) return;
        setSelectedPrice(r.selectedPrice);
        setNearby(r.cheapest);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [origin, destination, selectedDate]);

  if (loading) return null;

  const cheaper = nearby.filter((d) => d.deltaFromSelected < 0);
  if (cheaper.length === 0) return null;

  const bestSave = Math.abs(cheaper[0].deltaFromSelected);
  const bestPct = selectedPrice ? Math.round((bestSave / selectedPrice) * 100) : 0;

  return (
    <div className="mb-4 p-4 bg-[var(--accent-green)]/5 border border-[var(--accent-green)]/30 rounded-[var(--radius-lg)]">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />
        <span className="font-semibold text-sm text-[var(--accent-green)]">
          Fly ±3 days for up to {formatPrice(bestSave)} off{bestPct > 0 ? ` (${bestPct}%)` : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {cheaper.map((d) => {
          const label = new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          return (
            <button
              key={d.date}
              onClick={() => onPickDate?.(d.date)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-default)] hover:border-[var(--accent-green)] rounded-[var(--radius-md)] text-xs font-medium transition-colors"
            >
              <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{label}</span>
              <span className="text-[var(--accent-green)] font-mono-price">{formatPrice(d.price)}</span>
              <span className="text-[var(--accent-green)] text-[10px]">−{formatPrice(Math.abs(d.deltaFromSelected))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
