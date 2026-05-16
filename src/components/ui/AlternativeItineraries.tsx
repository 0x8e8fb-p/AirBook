"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Plane, Split, TrendingDown } from "lucide-react";
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

  const loading = splits === null || hidden === null;

  if (loading) {
    return (
      <div className="surface-card rounded-[28px] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-32 rounded-full bg-[var(--bg-subtle)]" />
          <div className="h-8 w-full rounded-[20px] bg-[var(--bg-subtle)]" />
          <div className="h-8 w-[86%] rounded-[20px] bg-[var(--bg-subtle)]" />
        </div>
      </div>
    );
  }

  const hasSplits = splits && splits.length > 0;
  const hasHidden = hidden && hidden.length > 0;
  if (!hasSplits && !hasHidden) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_82%,transparent)] p-5">
        <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <Split className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
          Optional route tools
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          These ideas are for experienced travellers who want to compare unconventional routing options before they commit.
        </p>
      </div>

      {hasSplits && (
        <div className="surface-card rounded-[28px] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Split className="h-4 w-4 text-[var(--accent-blue)]" />
            <div className="text-sm font-semibold text-[var(--text-primary)]">Split-ticket savings</div>
          </div>
          <div className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
            Separate tickets via a hub can sometimes beat a single through fare. Leave extra buffer for self-transfers and re-check baggage if needed.
          </div>
          <div className="space-y-2">
            {splits!.map((s, i) => (
              <div
                key={`${s.hub}-${i}`}
                className="rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Plane className="h-3.5 w-3.5 text-[var(--text-muted)]" />
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
                      <TrendingDown className="h-3 w-3" />
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
        <div className="surface-card rounded-[28px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="flex w-full items-center gap-3 p-5 text-left"
          >
            <AlertTriangle className="h-4 w-4 text-[var(--accent-amber)]" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Hidden-city ideas ({hidden!.length})
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Review the warning carefully before you expand this section.
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${showHidden ? "rotate-180" : ""}`} />
          </button>
          {showHidden && (
            <div className="space-y-3 px-5 pb-5">
              <div className="rounded-[18px] border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/10 p-4 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                <strong className="text-[var(--accent-amber)]">Important:</strong> these ideas can break baggage assumptions, cancel onward travel, and conflict with airline rules. Use only if you understand the risks.
              </div>
              {hidden!.map((h, i) => (
                <div
                  key={`${h.throughDestination}-${i}`}
                  className="rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4"
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
