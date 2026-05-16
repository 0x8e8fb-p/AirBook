"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Layers,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { searchAggregatorFlights } from "@/app/actions/aggregatorActions";
import { formatPrice } from "@/lib/constants";

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const TODAY_INPUT_VALUE = getTodayInputValue();

type AggregatorResult = NonNullable<Awaited<ReturnType<typeof searchAggregatorFlights>>>;
type AggregatorOption = AggregatorResult["results"][number];

function sanitizeIata(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function buildRouteSlug(from: string, to: string) {
  return `${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

function buildSearchHref(from: string, to: string, date: string) {
  const params = new URLSearchParams({
    from,
    to,
    date,
    adults: "1",
    children: "0",
    infants: "0",
    cabin: "economy",
  });

  return `/search?${params.toString()}`;
}

function formatStops(stops: number | null | undefined) {
  const count = stops ?? 0;
  return count === 0 ? "Direct" : `${count} stop${count > 1 ? "s" : ""}`;
}

function formatCarrierName(value?: string | null) {
  const cleaned = (value ?? "").trim();
  if (!cleaned || /^TP$/i.test(cleaned) || /travelpayouts/i.test(cleaned)) {
    return "Carrier varies";
  }
  return cleaned;
}

function formatDisplayTime(value?: string | null) {
  if (!value) return "TBA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "Date to be confirmed";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date to be confirmed";
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDurationLabel(raw?: string | null) {
  if (!raw) return "Duration to be confirmed";
  const minutes = Number(raw.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(minutes) || minutes <= 0) return raw;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  return `${hours}h ${remainder.toString().padStart(2, "0")}m`;
}

function formatChosenDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function AggregatorField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(sanitizeIata(event.target.value))}
        maxLength={3}
        placeholder={placeholder}
        className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 text-lg font-semibold tracking-[0.14em] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
      />
    </label>
  );
}

function AggregatorResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="surface-card animate-pulse rounded-[30px] p-5 md:p-6">
          <div className="h-3 w-28 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-4 h-8 w-48 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((__, statIndex) => (
              <div key={statIndex} className="rounded-[22px] border border-[var(--border-default)] p-4">
                <div className="h-2.5 w-20 rounded-full bg-[var(--bg-subtle)]" />
                <div className="mt-3 h-5 w-16 rounded-full bg-[var(--bg-subtle)]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AggregatorContent() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState<AggregatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = from.length === 3 && to.length === 3 && Boolean(date) && from !== to;
  const routeSlug = useMemo(() => (canSearch ? buildRouteSlug(from, to) : null), [canSearch, from, to]);
  const liveSearchHref = useMemo(
    () => (canSearch ? buildSearchHref(from, to, date) : "/"),
    [canSearch, date, from, to],
  );
  const cheapest = result?.cheapestOption;
  const alternatives = result?.results?.slice(1, 6) ?? [];
  const hasResults = Boolean(result?.results?.length);

  async function search() {
    if (!canSearch) return;

    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const data = await searchAggregatorFlights(from, to, date);
      setResult(data);

      if (!data) {
        setError("Route pricing is temporarily unavailable. Please try a fresh live search instead.");
      }
    } catch {
      setResult(null);
      setError("We could not load route pricing right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-kicker mb-4">
                <Layers className="h-3.5 w-3.5" />
                Route fare board
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Review one travel date clearly before you move into live checkout.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                This board helps you compare visible fares for the date you picked. It is designed for planning,
                while the main search page confirms whether a fare can hand off cleanly to booking.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: CalendarDays,
                    title: "Date-specific view",
                    body: "Keep the route anchored to one departure date so the fare spread is easy to understand.",
                  },
                  {
                    icon: Sparkles,
                    title: "Clean route scan",
                    body: "Highlight the strongest visible fare first and keep the rest in a tidy comparison list.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Search live before booking",
                    body: "Move to live search to confirm whether the route can continue into a bookable checkout handoff.",
                  },
                ].map((item) => (
                  <div key={item.title} className="surface-card rounded-[24px] p-4">
                    <item.icon className="mb-3 h-4 w-4 text-[var(--accent-cta)]" />
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="surface-card rounded-[32px] p-5 md:p-6"
            >
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Build a date view
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AggregatorField label="From" placeholder="DEL" value={from} onChange={setFrom} />
                <AggregatorField label="To" placeholder="BOM" value={to} onChange={setTo} />
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Departure date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  min={TODAY_INPUT_VALUE}
                  className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 text-base font-semibold text-[var(--text-primary)] [color-scheme:dark] transition-colors hover:border-[var(--border-strong)]"
                />
              </label>

              <button
                type="button"
                onClick={search}
                disabled={!canSearch || loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Scanning the route…" : "Build fare board"}
              </button>

              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                Visible fares on this board are for planning. Open live search next to confirm current availability.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mt-6" aria-live="polite">
          {loading ? <AggregatorResultsSkeleton /> : null}

          {!loading && searched && error && !result ? (
            <div className="rounded-[30px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-red)]">Route board unavailable</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-red)]/90">{error}</p>
                </div>
                <Link
                  href={canSearch ? liveSearchHref : "/"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Go to live search
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && result && !hasResults ? (
            <div className="rounded-[30px] border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-amber)]">No visible fares for that date</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-amber)]/90">
                    Try another day, or switch to live search to check whether fresh availability has returned for this route.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {routeSlug ? (
                    <Link
                      href={`/calendar/${routeSlug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--accent-amber)]/30 px-4 py-3 text-sm font-semibold text-[var(--accent-amber)] transition-colors hover:bg-[var(--accent-amber)]/10"
                    >
                      Open route calendar
                    </Link>
                  ) : null}
                  <Link
                    href={liveSearchHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-amber)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                  >
                    Check live fares
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && result && hasResults ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                  <div>
                    <div className="text-sm font-semibold">Plan here, confirm in live search</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      This board compares visible fares for {from} → {to} on {formatChosenDate(date)}. Use the live search page before checkout to verify a booking-ready handoff.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Visible fares</div>
                    <div className="mt-2 text-xl font-semibold">{result.summary?.totalOptions ?? result.results.length}</div>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Selected date</div>
                    <div className="mt-2 text-xl font-semibold">{formatChosenDate(date)}</div>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Lowest visible fare</div>
                    <div className="mt-2 text-xl font-semibold font-mono-price">
                      {formatPrice(cheapest?.priceDetails.best_price ?? result.summary?.cheapestBasePrice ?? 0)}
                    </div>
                  </div>
                </div>

                {result.summary?.dateAdjusted ? (
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                    We shifted to the closest date with usable route context for a clearer comparison view.
                  </p>
                ) : null}
              </div>

              {cheapest ? (
                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="status-pill border border-[var(--accent-cta)]/20 bg-[var(--accent-primary-dim)] text-[var(--accent-cta)]">
                      <Sparkles className="h-3 w-3" />
                      Best visible fare
                    </span>
                    <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                      Route context only
                    </span>
                    <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                      {formatStops(cheapest.flight.stops)}
                    </span>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                    <div className="space-y-5">
                      <div>
                        <div className="text-sm font-semibold">
                          {formatCarrierName(cheapest.flight.airline_name)}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {cheapest.flight.flight_number || "Flight detail confirmed in live search"}
                        </div>
                      </div>

                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                        <div>
                          <div className="text-xl font-semibold font-mono-price">
                            {formatDisplayTime(cheapest.flight.departure_display)}
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--text-muted)]">{from}</div>
                        </div>

                        <div className="px-1 text-center">
                          <div className="mb-1.5 text-[11px] text-[var(--text-muted)]">
                            {formatDurationLabel(cheapest.flight.duration)}
                          </div>
                          <div className="relative h-px bg-[var(--border-strong)]">
                            <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--text-secondary)]" />
                            <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--text-secondary)]" />
                          </div>
                          <div className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
                            {formatStops(cheapest.flight.stops)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-semibold font-mono-price">
                            {formatDisplayTime(cheapest.flight.arrival_display)}
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--text-muted)]">{to}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-secondary)]">
                        <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5">
                          {formatDisplayDate(cheapest.flight.departure_display)}
                        </span>
                        <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5">
                          Re-run this route live before checkout
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-muted)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      <div className="flex flex-col gap-3 lg:items-end">
                        <div className="flex flex-col lg:items-end">
                          <div className="text-3xl font-semibold font-mono-price tracking-tight text-[var(--accent-green)]">
                            {formatPrice(cheapest.priceDetails.best_price)}
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                            Visible fare on your selected date
                          </div>
                        </div>

                        {cheapest.priceDetails.savings > 0 ? (
                          <div className="w-full rounded-[18px] border border-[var(--accent-green)]/18 bg-[var(--accent-green)]/10 p-3 text-[11px] text-[var(--accent-green)] lg:max-w-[220px]">
                            Potential saving of {formatPrice(cheapest.priceDetails.savings)} surfaced in this view.
                          </div>
                        ) : null}

                        <div className="text-[11px] leading-relaxed text-[var(--text-muted)] lg:text-right">
                          This page does not send you to checkout. Confirm a live handoff first.
                        </div>

                        <Link
                          href={liveSearchHref}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 lg:w-auto"
                        >
                          Check live fares for this date
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {alternatives.length > 0 ? (
                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[var(--accent-cta)]" />
                    <h2 className="text-lg font-semibold">Other visible fares for the same date</h2>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Keep these as route context only, then verify the exact fare live before you book.
                  </p>

                  <div className="mt-5 space-y-3">
                    {alternatives.map((alt: AggregatorOption, index: number) => (
                      <div
                        key={`${alt.flight.flight_number}-${alt.priceDetails.best_price}-${index}`}
                        className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm font-semibold">
                              {formatCarrierName(alt.flight.airline_name)}
                            </div>
                            <div className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                              {formatDisplayTime(alt.flight.departure_display)} → {formatDisplayTime(alt.flight.arrival_display)} · {formatDurationLabel(alt.flight.duration)} · {formatStops(alt.flight.stops)}
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                              {formatDisplayDate(alt.flight.departure_display)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-semibold font-mono-price">
                              {formatPrice(alt.priceDetails.best_price)}
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                              Visible fare only — confirm live next
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="surface-panel rounded-[30px] p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="text-lg font-semibold">Ready to confirm this route live?</div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      Keep this board for planning, then open the main search surface to confirm fresh pricing and booking readiness for the same date.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {routeSlug ? (
                      <Link
                        href={`/calendar/${routeSlug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Open route calendar
                      </Link>
                    ) : null}
                    <Link
                      href={liveSearchHref}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                    >
                      <Search className="h-4 w-4" />
                      Run live search
                    </Link>
                  </div>
                </div>
              </section>
            </motion.div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function AggregatorPage() {
  return (
    <Suspense>
      <AggregatorContent />
    </Suspense>
  );
}
