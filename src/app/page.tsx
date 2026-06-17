"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Compass,
  CreditCard,
  Plane,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";

import { getPlatformStats } from "@/app/actions/flightActions";
import { Footer } from "@/components/layout/Footer";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Marquee } from "@/components/ui/Marquee";
import { TravelerSearchForm } from "@/components/ui/TravelerSearchForm";
import type { SearchParams } from "@/lib/types";
import { useSearchStore } from "@/stores/search-store";

function formatLakhs(value: number) {
  if (value === 0) return "₹0";
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

function formatSearchDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function buildRecentSearchHref(search: SearchParams) {
  const params = new URLSearchParams({
    from: search.origin,
    to: search.destination,
    date: search.departureDate,
    adults: String(search.passengers.adults),
    children: String(search.passengers.children),
    infants: String(search.passengers.infants),
    cabin: search.cabinClass,
  });

  if (search.returnDate) {
    params.set("return", search.returnDate);
  }

  return `/search?${params.toString()}`;
}

const HERO_PILLARS = [
  {
    icon: ShieldCheck,
    title: "Search flights",
    body: "Route, date, travellers, cabin. Returns and one-ways both.",
  },
  {
    icon: Wallet,
    title: "Set fare alerts",
    body: "Save a route, get a ping when the price hits your target.",
  },
  {
    icon: CalendarDays,
    title: "Check nearby dates",
    body: "Calendar view shows the cheaper flanking days at a glance.",
  },
];

const SURFACE_BENEFITS = [
  {
    icon: BellRing,
    title: "Fare alerts",
    body: "Save a route. Get notified when the price moves.",
    href: "/alerts",
    cta: "View alerts",
  },
  {
    icon: Radar,
    title: "Flight status",
    body: "Check departure and arrival details on the day you fly.",
    href: "/status",
    cta: "Open tracker",
  },
  {
    icon: CreditCard,
    title: "Wallet & profile",
    body: "Save cards once so the bank offer applies on every fare card.",
    href: "/profile",
    cta: "Open wallet",
  },
];

// Indian carrier roster + select internationals. Marquee items.
const CARRIER_STRIP: Array<{ code: string; name: string }> = [
  { code: "6E", name: "IndiGo" },
  { code: "AI", name: "Air India" },
  { code: "UK", name: "Vistara" },
  { code: "SG", name: "SpiceJet" },
  { code: "QP", name: "Akasa Air" },
  { code: "I5", name: "AirAsia India" },
  { code: "EK", name: "Emirates" },
  { code: "QR", name: "Qatar Airways" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "LH", name: "Lufthansa" },
  { code: "BA", name: "British Airways" },
  { code: "TK", name: "Turkish Airlines" },
];

const HIGHLIGHTS = [
  {
    icon: Zap,
    eyebrow: "Fast",
    title: "Searches every provider in parallel",
    body: "Results stream in as each source responds. No waiting on the slowest one.",
  },
  {
    icon: TrendingDown,
    eyebrow: "Bank offers",
    title: "Discount applied to the price you see",
    body: "Save your cards once. Offer math runs before the fare card renders.",
  },
  {
    icon: Compass,
    eyebrow: "Sources cited",
    title: "Every price shows where it came from",
    body: "Source, fetched-at timestamp, and confidence on each card. No mystery numbers.",
  },
];

export default function HomePage() {
  const recentSearches = useSearchStore((state) => state.recentSearches);
  const [stats, setStats] = useState({ searchesToday: 0, moneySavedMonth: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPlatformStats()
      .then((data) => {
        if (!mounted) return;
        setStats({
          searchesToday: data.searchesToday,
          moneySavedMonth: data.moneySavedMonth,
        });
      })
      .finally(() => {
        if (mounted) setStatsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Searches today",
        value: statsLoading ? "…" : stats.searchesToday.toLocaleString(),
        icon: Radar,
      },
      {
        label: "Savings this month",
        value: statsLoading ? "…" : formatLakhs(stats.moneySavedMonth),
        icon: TrendingDown,
      },
      {
        label: "Recent searches",
        value: recentSearches.length.toString(),
        icon: Compass,
      },
    ],
    [recentSearches.length, stats.moneySavedMonth, stats.searchesToday, statsLoading],
  );

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* ───── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Single scoped ambient. Kept intentionally light: 80px blur on
            a moderate element is cheap; the previous trio of 150px+
            orbs over the whole viewport was eating the paint budget. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-8rem] z-[2] h-[22rem] w-[34rem] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_7%,transparent)] blur-[80px]"
        />
        <div aria-hidden="true" className="hero-grid absolute inset-0 z-[3] opacity-[0.10] fade-bottom" />

        <div className="container-app relative z-10 pb-20 pt-24 sm:pt-28 md:pt-32 lg:pb-24">
          <div className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_72%,transparent)] px-3 py-1.5">
                <span aria-hidden="true" className="pulse-dot" />
                <span className="text-eyebrow text-[var(--text-secondary)]">Live</span>
              </div>

              <AnimatedText
                as="h1"
                text="Every Indian carrier. One search."
                className="text-display-xl max-w-4xl text-balance text-[var(--text-primary)]"
                staggerDelay={0.04}
              />

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                Live fares from IndiGo, Air India, Vistara, SpiceJet, Akasa and more. Your bank offers
                applied before you see the price.
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {[
                  { icon: ShieldCheck, label: "Domestic + international" },
                  { icon: Wallet, label: "Bank offers auto-applied" },
                  { icon: Radar, label: "Status on the day" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] px-3.5 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {statCards.map((item) => (
                  <div
                    key={item.label}
                    className="surface-card hover-lift group rounded-[22px] px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        {item.label}
                      </span>
                      <item.icon className="h-3.5 w-3.5 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-cta)]" />
                    </div>
                    <div className="font-mono-price mt-2 text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {recentSearches.length > 0 ? (
                <div className="surface-card mt-8 max-w-3xl rounded-[28px] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <Sparkles className="h-3 w-3 text-[var(--accent-amber)]" />
                    Pick up where you left off
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 4).map((search, index) => (
                      <Link
                        key={`${search.origin}-${search.destination}-${search.departureDate}-${index}`}
                        href={buildRecentSearchHref(search)}
                        className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_70%,transparent)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                      >
                        <span className="font-semibold text-[var(--text-primary)]">
                          {search.origin}
                        </span>
                        <Plane className="h-3 w-3 text-[var(--text-muted)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
                        <span className="font-semibold text-[var(--text-primary)]">
                          {search.destination}
                        </span>
                        <span className="text-[var(--text-muted)]">·</span>
                        <span>{formatSearchDate(search.departureDate)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/alerts"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Saved alerts
                  <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/status"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Flight status
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <TravelerSearchForm variant="hero" submitLabel="Search flights" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── CARRIER MARQUEE ────────────────────────────────────── */}
      <section className="relative z-10 border-y border-[var(--border-muted)] py-7">
        <div className="container-app">
          <div className="mb-4">
            <span className="text-eyebrow text-[var(--text-muted)]">Carriers covered</span>
          </div>
          <Marquee duration="48s">
            {CARRIER_STRIP.map((carrier) => (
              <div
                key={carrier.code}
                className="inline-flex items-center gap-3 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_72%,transparent)] px-4 py-2"
              >
                <span className="font-mono-price text-sm font-semibold tracking-[0.08em] text-[var(--text-primary)]">
                  {carrier.code}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">{carrier.name}</span>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ───── PILLARS — 3-up, plain surfaces with hover-lift ────── */}
      <section className="container-app relative z-10 py-14 md:py-20">
        <div className="mb-10">
          <h2 className="max-w-2xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
            Three things, no tab-switching.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {HERO_PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="surface-card hover-lift group rounded-[28px] p-6 md:p-7"
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:scale-110">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ───── DIFFERENTIATORS — sticky left + list right ────────── */}
      <section className="container-app relative z-10 border-t border-[var(--border-muted)] py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="section-kicker mb-4">What&rsquo;s different</div>
            <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-5xl">
              Built for the Indian flight market.
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <article
                key={item.title}
                className="surface-card hover-lift group flex gap-5 rounded-[28px] p-6 md:p-7"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-colors duration-[var(--duration-base)] group-hover:bg-[color-mix(in_srgb,var(--accent-cta)_8%,var(--bg-elevated)_92%)]">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="text-eyebrow text-[var(--accent-cta)]">{item.eyebrow}</span>
                  <h3 className="mt-1.5 text-lg font-semibold text-[var(--text-primary)] md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TOOLS ─────────────────────────────────────────────── */}
      <section className="container-app relative z-10 border-t border-[var(--border-muted)] py-14 md:py-20">
        <div className="mb-10">
          <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
            Tools beyond search.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SURFACE_BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="surface-card hover-lift group rounded-[28px] p-6 md:p-7"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:scale-110">
                <benefit.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {benefit.body}
              </p>
              <Link
                href={benefit.href}
                className="group/cta mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cta)] transition-colors hover:text-[var(--text-primary)]"
              >
                {benefit.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover/cta:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ───── FINAL CTA ─────────────────────────────────────────── */}
      <section className="container-app relative z-10 pb-20 pt-10 md:pt-16">
        <div className="surface-hero relative overflow-hidden rounded-[36px] p-10 text-center md:p-16">
          <h2 className="mx-auto max-w-2xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl">
            Ready to search?
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="gloss-sweep ring-cinematic group inline-flex items-center gap-2 rounded-full bg-[var(--accent-cta)] px-6 py-4 text-base font-semibold text-[var(--text-inverse)] shadow-[var(--depth-elevated)] transition-[transform,box-shadow,filter] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:scale-[1.03] hover:shadow-[var(--depth-hero)] hover:brightness-[1.05] active:scale-[0.97]"
            >
              Start a search
              <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/alerts"
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-6 py-4 text-base font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              Or set a price alert
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


