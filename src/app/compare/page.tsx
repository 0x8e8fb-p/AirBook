"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarRange,
  CreditCard,
  Loader2,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { getFareComparePageData } from "@/app/actions/compareActions";
import { formatPrice } from "@/lib/constants";

function getStarterSearchDate() {
  const starter = new Date(Date.now() + 3 * 86400000);
  const local = new Date(starter.getTime() - starter.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const STARTER_SEARCH_DATE = getStarterSearchDate();

type CompareData = Awaited<ReturnType<typeof getFareComparePageData>>;
type RankedAirline = NonNullable<CompareData["airline"]>["ranked_airlines"][number];

function sanitizeIata(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function buildRouteSlug(from: string, to: string) {
  return `${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

function buildLiveSearchHref(from: string, to: string, date = STARTER_SEARCH_DATE) {
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

function formatTravelDate(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatCarrierName(value?: string | null) {
  const cleaned = (value ?? "").trim();
  if (!cleaned || /^TP$/i.test(cleaned) || /travelpayouts/i.test(cleaned)) {
    return "Carrier varies";
  }
  return cleaned;
}

function formatFlightNumber(value?: string | null) {
  const cleaned = (value ?? "").trim();
  if (!cleaned || /^TP\b/i.test(cleaned)) {
    return "Flight number confirmed in live search";
  }
  return cleaned;
}

function CompareField({
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

function CompareResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="surface-card animate-pulse rounded-[30px] p-5 md:p-6">
          <div className="h-3 w-28 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-4 h-8 w-56 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
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

function CompareContent() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCompare = from.length === 3 && to.length === 3 && from !== to;
  const routeSlug = useMemo(() => (canCompare ? buildRouteSlug(from, to) : null), [canCompare, from, to]);
  const liveSearchHref = useMemo(
    () => (canCompare ? buildLiveSearchHref(from, to) : "/"),
    [canCompare, from, to],
  );
  const hasResults = Boolean(
    data?.routeBest || data?.combo?.best_combo || data?.airline?.ranked_airlines?.length,
  );
  const rankedAirlines = data?.airline?.ranked_airlines?.slice(0, 6) ?? [];
  const bestCombo = data?.combo?.best_combo ?? null;
  const paymentBasePrice = bestCombo?.base_price ?? data?.routeBest?.price ?? null;
  const paymentEffectivePrice = bestCombo?.effective_price ?? data?.routeBest?.price ?? null;
  const paymentSavings = bestCombo?.bank_savings ?? 0;

  async function compare() {
    if (!canCompare) return;

    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const response = await getFareComparePageData(from, to);
      setData(response);

      if (
        !response.routeBest &&
        !response.combo?.best_combo &&
        !(response.airline?.ranked_airlines?.length)
      ) {
        setError("Route compare is temporarily unavailable. Try another pair or move straight to live search.");
      }
    } catch {
      setData(null);
      setError("We could not build a compare view right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-kicker mb-4">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Route compare
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Compare route pricing calmly before you switch into live booking.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                AirBook uses this surface for route-level guidance: recent fare context, airline price spread,
                and payment savings worth checking once you move into a live search.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Guidance, not checkout",
                    body: "Use compare to understand the route, then confirm a booking-ready handoff in live search.",
                  },
                  {
                    icon: Plane,
                    title: "Airline price spread",
                    body: "See which carriers are surfacing lower recent fares without digging through the route manually.",
                  },
                  {
                    icon: CreditCard,
                    title: "Payment savings view",
                    body: "Check whether card or wallet savings change the effective price before you book.",
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
                Compare a route
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CompareField label="From" placeholder="DEL" value={from} onChange={setFrom} />
                <CompareField label="To" placeholder="BOM" value={to} onChange={setTo} />
              </div>

              <button
                type="button"
                onClick={compare}
                disabled={!canCompare || loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Building compare view…" : "Compare this route"}
              </button>

              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                The live search page opens with a starter date so you can confirm current availability for the route.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mt-6" aria-live="polite">
          {loading ? <CompareResultsSkeleton /> : null}

          {!loading && searched && !hasResults ? (
            <div className="rounded-[30px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-red)]">Compare view unavailable</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-red)]/90">
                    {error ?? "We could not assemble route guidance for this city pair right now."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={canCompare ? liveSearchHref : "/"}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Go to live search
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--accent-red)]/20 px-4 py-3 text-sm font-semibold text-[var(--accent-red)] transition-colors hover:bg-[var(--accent-red)]/10"
                  >
                    Start a new route
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && hasResults ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                  <div>
                    <div className="text-sm font-semibold">Use compare as route guidance first</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      These numbers help you understand pricing patterns on {from} → {to}. Confirm a live,
                      bookable fare on the main search page before you continue to checkout.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                    Route snapshot
                  </div>

                  {data?.routeBest ? (
                    <>
                      <div className="mt-4 text-3xl font-semibold font-mono-price tracking-tight">
                        {formatPrice(data.routeBest.price)}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        Lowest recent fare context we could compare
                        {formatTravelDate(data.routeBest.departureDate)
                          ? `, last seen around ${formatTravelDate(data.routeBest.departureDate)}`
                          : ""}
                        .
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Carrier</div>
                          <div className="mt-2 text-sm font-semibold">
                            {formatCarrierName(data.routeBest.airline)}
                          </div>
                        </div>
                        <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Flight detail
                          </div>
                          <div className="mt-2 text-sm font-semibold">
                            {formatFlightNumber(data.routeBest.flightNumber)}
                          </div>
                        </div>
                        <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Route
                          </div>
                          <div className="mt-2 text-sm font-semibold">{from} → {to}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                      We could not isolate a recent route snapshot, but the airline ranking and savings view may still help you prepare for live search.
                    </div>
                  )}
                </section>

                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <Wallet className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                    Payment-ready savings
                  </div>

                  <div className="mt-4 rounded-[26px] border border-[var(--accent-green)]/18 bg-[var(--accent-green)]/10 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-green)]">
                      Effective fare view
                    </div>
                    <div className="mt-3 text-3xl font-semibold font-mono-price text-[var(--accent-green)]">
                      {paymentEffectivePrice ? formatPrice(paymentEffectivePrice) : "Open live search"}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Base fare</div>
                        <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {paymentBasePrice ? formatPrice(paymentBasePrice) : "Unavailable"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Additional savings
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {formatPrice(paymentSavings)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {paymentEffectivePrice
                      ? paymentSavings > 0
                        ? "A payment saving is standing out in this route context. Recheck the same route live to confirm it still applies."
                        : "No extra payment saving is standing out right now, so live search is the next best step for exact pricing and checkout readiness."
                      : "Payment-aware pricing will appear here once we have enough route context to compare it cleanly."}
                  </p>
                </section>
              </div>

              {rankedAirlines.length > 0 ? (
                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-[var(--accent-cta)]" />
                    <h2 className="text-lg font-semibold">Carriers surfacing the strongest recent fares</h2>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    This ranking uses recent route context to help you decide which carriers deserve a closer live search.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {rankedAirlines.map((airline: RankedAirline, index: number) => (
                      <div
                        key={`${airline.airline}-${index}`}
                        className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                index === 0
                                  ? "bg-[var(--accent-green)] text-white"
                                  : "bg-[var(--bg-base)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">
                                {formatCarrierName(airline.airline)}
                              </div>
                              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                                {airline.count} recent fare signals
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold font-mono-price">
                              {formatPrice(airline.cheapest)}
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                              Avg {formatPrice(airline.average)}
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
                    <div className="text-lg font-semibold">Ready to confirm the route live?</div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      Open the route calendar for broader date context, or jump into live search with a starter date and confirm whether a bookable fare is available right now.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {routeSlug ? (
                      <Link
                        href={`/calendar/${routeSlug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                      >
                        <CalendarRange className="h-4 w-4" />
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

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  );
}
