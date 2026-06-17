"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
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
import { ParticleBackground } from "@/components/ui/ParticleBackground";
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
    body: "Search one-way or return trips by route, date, travellers, and cabin.",
    glow: "cyan" as const,
  },
  {
    icon: Wallet,
    title: "Set fare alerts",
    body: "Save a route and come back when the price matches what you want to pay.",
    glow: "amber" as const,
  },
  {
    icon: CalendarDays,
    title: "Check nearby dates",
    body: "Use date and route guidance to spot better timing before you book.",
    glow: "primary" as const,
  },
];

const SURFACE_BENEFITS = [
  {
    icon: BellRing,
    title: "Fare alerts",
    body: "Save a route and get notified when the price changes.",
    href: "/alerts",
    cta: "View alerts",
  },
  {
    icon: Radar,
    title: "Flight status",
    body: "Check departure and arrival details in one place.",
    href: "/status",
    cta: "Open tracker",
  },
  {
    icon: CreditCard,
    title: "Wallet & profile",
    body: "Keep saved details and payment options ready for your next booking.",
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
    eyebrow: "Sub-second",
    title: "Search the fastest path to the cheapest fare",
    body: "Parallel provider waterfall, hot-cached recent routes, and zero spinners until results render.",
  },
  {
    icon: TrendingDown,
    eyebrow: "Wallet-aware",
    title: "Effective price after Indian bank offers",
    body: "Auto-matches your saved cards against live promotions so the headline price reflects what you actually pay.",
  },
  {
    icon: Compass,
    eyebrow: "Aviation-grade",
    title: "Source transparency on every price",
    body: "Each fare ships with its origin, freshness, and confidence — never an unsourced number.",
  },
];

export default function HomePage() {
  const recentSearches = useSearchStore((state) => state.recentSearches);
  const [stats, setStats] = useState({ searchesToday: 0, moneySavedMonth: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Scroll-driven parallax on the hero ambient layer.
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const ambientY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const ambientOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.2]);

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
      <ParticleBackground />

      {/* ───── HERO ───────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          style={{ y: ambientY, opacity: ambientOpacity }}
          className="pointer-events-none absolute inset-0 z-[2] will-change-transform"
        >
          <div className="absolute left-[-6%] top-[-18%] h-[34rem] w-[34rem] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] blur-[160px]" />
          <div className="absolute right-[-5%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-[color-mix(in_srgb,var(--accent-amber)_10%,transparent)] blur-[150px]" />
          <div className="absolute bottom-[-12%] left-[18%] h-[20rem] w-[42rem] rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] blur-[130px]" />
        </motion.div>

        <div aria-hidden="true" className="hero-grid absolute inset-0 z-[3] opacity-[0.14] fade-bottom" />

        <div className="container-app relative z-10 pb-20 pt-24 sm:pt-28 md:pt-32 lg:pb-24">
          <div className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_72%,transparent)] px-3 py-1.5 backdrop-blur-md"
              >
                <span aria-hidden="true" className="pulse-dot" />
                <span className="text-eyebrow text-[var(--text-secondary)]">
                  Live · India-first flight search
                </span>
              </motion.div>

              <AnimatedText
                as="h1"
                text="Find every fare. Trust every price."
                className="text-display-xl max-w-4xl text-balance text-[var(--text-primary)]"
                staggerDelay={0.045}
              />
              <p className="mt-3 max-w-2xl text-balance font-[var(--font-display)] text-2xl font-medium leading-tight tracking-[-0.02em] text-[var(--text-secondary)] sm:text-3xl">
                <span className="text-gradient-soft">
                  Parallel scrapers, wallet-aware pricing, source-cited results.
                </span>
              </p>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                Use TheWingScan to search routes, save price alerts, and track flights — with every fare
                stamped by its source and freshness.
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {[
                  { icon: ShieldCheck, label: "Source-transparent fares" },
                  { icon: Wallet, label: "Bank-offer effective price" },
                  { icon: Radar, label: "Live flight tracking" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] px-3.5 py-2 text-xs text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--accent-cta)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:scale-110" />
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {statCards.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + 0.08 * index, duration: 0.45 }}
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
                  </motion.div>
                ))}
              </div>

              {recentSearches.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.32 }}
                  className="surface-card mt-8 max-w-3xl overflow-hidden rounded-[28px] p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <Sparkles className="h-3 w-3 text-[var(--accent-amber)]" />
                    Pick up where you left off
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 4).map((search, index) => (
                      <Link
                        key={`${search.origin}-${search.destination}-${search.departureDate}-${index}`}
                        href={buildRecentSearchHref(search)}
                        className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_70%,transparent)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:scale-[1.03] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
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
                </motion.div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/alerts"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  View saved alerts
                  <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/status"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Check flight status
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              <TravelerSearchForm variant="hero" submitLabel="Search flights" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── CARRIER MARQUEE ────────────────────────────────────── */}
      <section className="relative z-10 border-y border-[var(--border-muted)] bg-[color-mix(in_srgb,var(--bg-base)_92%,transparent)] py-7 backdrop-blur-sm">
        <div className="container-app">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-eyebrow text-[var(--text-muted)]">
              Carriers we surface
            </span>
            <span className="hidden text-[11px] text-[var(--text-muted)] sm:inline">
              Sample roster · India-first
            </span>
          </div>
          <Marquee duration="48s">
            {CARRIER_STRIP.map((carrier) => (
              <div
                key={carrier.code}
                className="group inline-flex items-center gap-3 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_72%,transparent)] px-4 py-2 transition-colors hover:border-[var(--border-strong)]"
              >
                <span className="font-mono-price text-sm font-semibold tracking-[0.08em] text-[var(--text-primary)]">
                  {carrier.code}
                </span>
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  {carrier.name}
                </span>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ───── PILLARS (3-up with glow accents) ──────────────────── */}
      <section className="container-app relative z-10 py-14 md:py-20">
        <div className="mb-10 grid items-end gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="section-kicker mb-4">
              <Plane className="h-3 w-3" aria-hidden="true" />
              Three jobs, one surface
            </div>
            <h2 className="max-w-2xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
              Built for the way you actually book.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            Search, alert, and track in one continuous surface. No tab-switching, no losing the route.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {HERO_PILLARS.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="surface-card gradient-border-kiss group relative overflow-hidden rounded-[28px] p-6 md:p-7"
            >
              <span
                aria-hidden="true"
                className="absolute -top-12 right-[-2rem] h-32 w-32 rounded-full blur-3xl transition-opacity duration-[var(--duration-slow)]"
                style={{
                  background:
                    pillar.glow === "cyan"
                      ? "color-mix(in srgb, var(--accent-cyan) 28%, transparent)"
                      : pillar.glow === "amber"
                        ? "color-mix(in srgb, var(--accent-amber) 28%, transparent)"
                        : "color-mix(in srgb, var(--accent-cta) 22%, transparent)",
                  opacity: 0.5,
                }}
              />
              <div className="relative z-10">
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:scale-110 group-hover:rotate-[-6deg]">
                  <pillar.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {pillar.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ───── DIFFERENTIATORS (split layout, asymmetric) ────────── */}
      <section className="container-app relative z-10 border-t border-[var(--border-muted)] py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="section-kicker mb-4">Why it feels different</div>
            <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-5xl">
              Engineered for the
              <br />
              <span className="text-gradient-soft">India traveller.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
              Three commitments baked into every render — speed, honesty, and wallet awareness.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {HIGHLIGHTS.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="surface-card hover-lift group flex gap-5 rounded-[28px] p-6 md:p-7"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:rotate-[-6deg] group-hover:bg-[color-mix(in_srgb,var(--accent-cta)_8%,var(--bg-elevated)_92%)]">
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
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TOOL GRID ─────────────────────────────────────────── */}
      <section className="container-app relative z-10 border-t border-[var(--border-muted)] py-14 md:py-20">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-kicker mb-4">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              More tools
            </div>
            <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
              More ways to use TheWingScan.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            Create alerts, check flight status, and keep your profile ready for the next trip.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SURFACE_BENEFITS.map((benefit, index) => (
            <motion.article
              key={benefit.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="surface-card hover-lift gradient-border-kiss group relative overflow-hidden rounded-[28px] p-6 md:p-7"
            >
              <div className="relative z-10">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:rotate-[-6deg]">
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
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ───── FINAL CTA ─────────────────────────────────────────── */}
      <section className="container-app relative z-10 pb-20 pt-10 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="surface-hero relative overflow-hidden rounded-[36px] p-10 md:p-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 55%), radial-gradient(circle at 82% 100%, color-mix(in srgb, var(--accent-amber) 16%, transparent), transparent 55%)",
            }}
          />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="section-kicker mb-4">
                <Zap className="h-3 w-3" aria-hidden="true" />
                Ready when you are
              </div>
              <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl">
                Start your next trip in <span className="text-gradient-soft">three seconds.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                One search, every source. Live prices, wallet-aware, citation-stamped. Nothing else to
                configure.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Link
                href="/"
                className="gloss-sweep ring-cinematic group inline-flex items-center gap-2 rounded-full bg-[var(--accent-cta)] px-6 py-4 text-base font-semibold text-[var(--text-inverse)] shadow-[var(--depth-elevated)] transition-[transform,box-shadow,filter] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:scale-[1.04] hover:shadow-[var(--depth-hero)] hover:brightness-[1.05] active:scale-[0.97]"
              >
                Start a search
                <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-1" />
              </Link>
              <Link
                href="/alerts"
                className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Or set a price alert first
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

