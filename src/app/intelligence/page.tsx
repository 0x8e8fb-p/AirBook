"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { getIntelligenceCombined } from "@/app/actions/intelligenceActions";
import { formatPrice } from "@/lib/constants";

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const TODAY_INPUT_VALUE = getTodayInputValue();

type IntelligenceResult = Awaited<ReturnType<typeof getIntelligenceCombined>>;

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

function formatRecommendation(value?: string | null) {
  if (!value) return "More route context is needed";
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTrendLabel(value?: string | null) {
  if (!value) return "Stable";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTrendTone(value?: string | null) {
  switch (value) {
    case "falling":
      return "border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]";
    case "rising":
      return "border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 text-[var(--accent-red)]";
    default:
      return "border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]";
  }
}

function IntelligenceField({
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

function IntelligenceSkeleton() {
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

function IntelligenceContent() {
  const params = useSearchParams();
  const [from, setFrom] = useState(() => sanitizeIata(params.get("from") ?? ""));
  const [to, setTo] = useState(() => sanitizeIata(params.get("to") ?? ""));
  const [date, setDate] = useState(params.get("date") ?? "");
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = from.length === 3 && to.length === 3 && Boolean(date) && from !== to;
  const routeSlug = useMemo(() => (canAnalyze ? buildRouteSlug(from, to) : null), [canAnalyze, from, to]);
  const liveSearchHref = useMemo(
    () => (canAnalyze ? buildSearchHref(from, to, date) : "/"),
    [canAnalyze, date, from, to],
  );
  const hasGuidance = Boolean(result?.prediction || result?.advice || result?.forecast);

  async function analyze() {
    if (!canAnalyze) return;

    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const data = await getIntelligenceCombined(from, to, date);
      setResult(data);

      if (!data.prediction && !data.advice && !data.forecast) {
        setError("Route guidance is temporarily unavailable. Please try another date or switch to live search.");
      }
    } catch {
      setResult(null);
      setError("We could not assemble route guidance right now. Please try again shortly.");
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
                <Brain className="h-3.5 w-3.5" />
                Route guidance
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Read the route with calmer market guidance before you search live.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Use recent fare signals to understand typical pricing, timing guidance, and the wider range around your selected date — then confirm fresh availability on the live search page.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: TrendingUp,
                    title: "Recent fare range",
                    body: "See a practical low-to-high band before you commit time to a deeper live search.",
                  },
                  {
                    icon: CalendarDays,
                    title: "Timing guidance",
                    body: "Check whether the route looks steady, softening, or firming up around your trip date.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Search live next",
                    body: "Treat this page as planning guidance only, then verify bookable availability in live search.",
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
                Analyze a route
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <IntelligenceField label="From" placeholder="DEL" value={from} onChange={setFrom} />
                <IntelligenceField label="To" placeholder="BOM" value={to} onChange={setTo} />
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Travel date
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
                onClick={analyze}
                disabled={!canAnalyze || loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Reading route signals…" : "Show route guidance"}
              </button>

              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                This page helps with planning. Live availability and booking readiness are always confirmed on the main search surface.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mt-6" aria-live="polite">
          {loading ? <IntelligenceSkeleton /> : null}

          {!loading && searched && !hasGuidance ? (
            <div className="rounded-[30px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-red)]">Route guidance unavailable</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-red)]/90">
                    {error ?? "We could not find enough recent route context for this search."}
                  </p>
                </div>
                <Link
                  href={canAnalyze ? liveSearchHref : "/"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Go to live search
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && hasGuidance ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                  <div>
                    <div className="text-sm font-semibold">Planning guidance first, live confirmation second</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      These insights describe recent fare signals around {from} → {to}. They help you choose when to search, but a live search is still the step that confirms current availability and booking readiness.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                    Recent fare estimate
                  </div>

                  {result?.prediction && result.prediction.predicted_price > 0 ? (
                    <>
                      <div className="mt-4 text-3xl font-semibold font-mono-price tracking-tight">
                        {formatPrice(result.prediction.predicted_price)}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        A practical centre point from recent route signals around your selected date.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-center">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Lower edge</div>
                          <div className="mt-2 text-xl font-semibold font-mono-price text-[var(--accent-green)]">
                            {formatPrice(result.prediction.confidence_low ?? result.prediction.predicted_price)}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-center">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Typical</div>
                          <div className="mt-2 text-xl font-semibold font-mono-price">
                            {formatPrice(result.prediction.predicted_price)}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-center">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Upper edge</div>
                          <div className="mt-2 text-xl font-semibold font-mono-price text-[var(--accent-red)]">
                            {formatPrice(result.prediction.confidence_high ?? result.prediction.predicted_price)}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {result.prediction.training_samples > 0
                          ? `Based on ${result.prediction.training_samples.toLocaleString()} recent fare points on this route.`
                          : "We will tighten this range as more recent route context becomes available."}
                      </p>
                    </>
                  ) : (
                    <div className="mt-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                      We do not have enough recent route context yet to show a useful fare estimate.
                    </div>
                  )}
                </section>

                <section className="surface-card rounded-[30px] p-5 md:p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                    Timing guidance
                  </div>

                  {result?.advice ? (
                    <>
                      <div
                        className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${getTrendTone(result.advice.price_trend)}`}
                      >
                        {formatTrendLabel(result.advice.price_trend)} trend
                      </div>
                      <div className="mt-4 text-lg font-semibold">
                        {formatRecommendation(result.advice.recommendation)}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        Use this read to decide whether to search immediately or widen the dates you compare.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Often softer on</div>
                          <div className="mt-2 text-lg font-semibold">{result.advice.cheapest_day_of_week}</div>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Seasonal sweet spot</div>
                          <div className="mt-2 text-lg font-semibold">{result.advice.cheapest_month}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                      Timing guidance will appear here once the route has enough recent fare history to read cleanly.
                    </div>
                  )}
                </section>
              </div>

              <section className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--accent-cta)]" />
                  <h2 className="text-lg font-semibold">30-day market band</h2>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  A broader range for this route so you can see how today’s guidance sits inside the month around it.
                </p>

                {result?.forecast ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-center">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Lower band</div>
                        <div className="mt-2 text-xl font-semibold font-mono-price text-[var(--accent-green)]">
                          {result.forecast.p25 ? formatPrice(result.forecast.p25) : "—"}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-center">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Typical</div>
                        <div className="mt-2 text-xl font-semibold font-mono-price">
                          {result.forecast.median ? formatPrice(result.forecast.median) : "—"}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-center">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Upper band</div>
                        <div className="mt-2 text-xl font-semibold font-mono-price text-[var(--accent-red)]">
                          {result.forecast.p75 ? formatPrice(result.forecast.p75) : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                      {formatRecommendation(result.forecast.recommendation)}
                      {result.forecast.sample_size
                        ? ` · ${result.forecast.sample_size.toLocaleString()} recent fare points in this 30-day view`
                        : " · Recent route context is still building"}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                    The broader market band is not available yet for this route.
                  </div>
                )}
              </section>

              <section className="surface-panel rounded-[30px] p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="text-lg font-semibold">Ready to move from guidance to live availability?</div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      Open the route calendar for broader date context, or go straight to live search for your selected date and confirm whether a fare is ready to book.
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
                      Check live fares
                      <ArrowRight className="h-4 w-4" />
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

export default function IntelligencePage() {
  return (
    <Suspense>
      <IntelligenceContent />
    </Suspense>
  );
}
