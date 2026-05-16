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

  if (loading) {
    return (
      <div className="surface-card rounded-[28px] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-36 rounded-full bg-[var(--bg-subtle)]" />
          <div className="h-8 w-full rounded-[18px] bg-[var(--bg-subtle)]" />
          <div className="h-8 w-[82%] rounded-[18px] bg-[var(--bg-subtle)]" />
        </div>
      </div>
    );
  }

  const cheaper = nearby.filter((d) => d.deltaFromSelected < 0);
  if (cheaper.length === 0) return null;

  const bestSave = Math.abs(cheaper[0].deltaFromSelected);
  const bestPct = selectedPrice ? Math.round((bestSave / selectedPrice) * 100) : 0;

  return (
    <div className="surface-card rounded-[28px] p-5">
      <div className="mb-3 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Fly ±3 days for up to {formatPrice(bestSave)} off{bestPct > 0 ? ` (${bestPct}%)` : ""}
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
        Nearby dates can materially change this route. Pick a cheaper departure to refresh the results without starting over.
      </p>
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
              className="flex items-center gap-2 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs font-medium transition-colors hover:border-[var(--accent-green)]"
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
