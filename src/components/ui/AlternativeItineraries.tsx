"use client";

import { useEffect, useState } from "react";
import { Split, AlertTriangle, Plane, TrendingDown } from "lucide-react";
import {
  fetchSplitTicketSuggestions,
  fetchHiddenCityOpportunities,
} from "@/app/actions/flightActions";
import { formatPrice } from "@/lib/constants";

interface Props {
  origin: string;
  destination: string;
  date: string;
}

interface SplitSuggestion {
  hub: string;
  leg1: { airline: string; flightNumber?: string | null; price: number; departureTime?: string | null; arrivalTime?: string | null };
  leg2: { airline: string; flightNumber?: string | null; price: number; departureTime?: string | null; arrivalTime?: string | null };
  totalPrice: number;
  directPrice: number;
  savings: number;
  savingsPct: number;
  layoverMinutes: number;
}

interface HiddenSuggestion {
  throughDestination: string;
  fare: { airline: string; flightNumber?: string | null; price: number; stops?: number | null };
  directPrice: number;
  savings: number;
  savingsPct: number;
}

function fmtLayover(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function AlternativeItineraries({ origin, destination, date }: Props) {
  const [splits, setSplits] = useState<SplitSuggestion[] | null>(null);
  const [hidden, setHidden] = useState<HiddenSuggestion[] | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchSplitTicketSuggestions(origin, destination, date).catch(() => []),
      fetchHiddenCityOpportunities(origin, destination, date).catch(() => []),
    ]).then(([s, h]) => {
      if (cancelled) return;
      setSplits(s as SplitSuggestion[]);
      setHidden(h as HiddenSuggestion[]);
    });
    return () => {
      cancelled = true;
    };
  }, [origin, destination, date]);

  const hasSplits = splits && splits.length > 0;
  const hasHidden = hidden && hidden.length > 0;
  if (!hasSplits && !hasHidden) return null;

  return (
    <div className="mb-4 space-y-3">
      {hasSplits && (
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/5">
          <div className="flex items-center gap-2 mb-3">
            <Split className="w-4 h-4 text-[var(--accent-blue)]" />
            <div className="font-semibold text-sm text-[var(--accent-blue)]">
              Split-ticket savings
            </div>
          </div>
          <div className="text-xs text-[var(--text-secondary)] mb-3">
            Book two separate tickets via a hub — often cheaper than one direct ticket.
            Self-transfer: no guaranteed connection, no through-checked baggage.
          </div>
          <div className="space-y-2">
            {splits!.map((s, i) => (
              <div
                key={`${s.hub}-${i}`}
                className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Plane className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>
                        {origin} → {s.hub} → {destination}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {s.leg1.airline} {s.leg1.flightNumber ?? ""} · {s.leg1.departureTime ?? "--"}–{s.leg1.arrivalTime ?? "--"}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {s.leg2.airline} {s.leg2.flightNumber ?? ""} · {s.leg2.departureTime ?? "--"}–{s.leg2.arrivalTime ?? "--"}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                      Layover {fmtLayover(s.layoverMinutes)} at {s.hub}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-price font-semibold text-sm">
                      {formatPrice(s.totalPrice)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--accent-green)] font-semibold mt-0.5">
                      <TrendingDown className="w-3 h-3" />
                      save {formatPrice(s.savings)} ({Math.round(s.savingsPct * 100)}%)
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] line-through font-mono-price">
                      {formatPrice(s.directPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasHidden && (
        <div className="rounded-[var(--radius-lg)] border border-orange-500/30 bg-orange-500/5">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="w-full p-4 flex items-center gap-2 text-left"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-orange-500">
                Hidden-city opportunities ({hidden!.length})
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                {showHidden ? "Hide" : "Show"} advanced savings (read warning first)
              </div>
            </div>
          </button>
          {showHidden && (
            <div className="px-4 pb-4 space-y-3">
              <div className="p-3 rounded-[var(--radius-md)] bg-orange-500/10 border border-orange-500/30 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-orange-500">Risks:</strong> Airlines may cancel
                return segments, forfeit frequent-flyer miles, or ban repeat offenders.
                No checked baggage (it goes to final destination). One-way only.
                Legality varies by jurisdiction. Use at your own risk.
              </div>
              {hidden!.map((h, i) => (
                <div
                  key={`${h.throughDestination}-${i}`}
                  className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        Book {origin} → {h.throughDestination}, disembark at {destination}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        {h.fare.airline} {h.fare.flightNumber ?? ""} · {h.fare.stops ?? 0} stop{(h.fare.stops ?? 0) === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono-price font-semibold text-sm">
                        {formatPrice(h.fare.price)}
                      </div>
                      <div className="text-[11px] text-[var(--accent-green)] font-semibold mt-0.5">
                        save {formatPrice(h.savings)} ({Math.round(h.savingsPct * 100)}%)
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] line-through font-mono-price">
                        {formatPrice(h.directPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
