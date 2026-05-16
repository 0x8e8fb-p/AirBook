"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CreditCard,
  Radar,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  Wallet,
} from "lucide-react";

import { getPlatformStats } from "@/app/actions/flightActions";
import { Footer } from "@/components/layout/Footer";
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
    title: "Bookable live fares stay clear",
    body: "Ready-to-book options remain distinct from route context, so you never mistake guidance for a checkout-ready fare.",
  },
  {
    icon: Wallet,
    title: "Final totals feel trustworthy",
    body: "Card-aware pricing, clearer savings language, and calm hierarchy keep the payable amount easy to understand.",
  },
  {
    icon: CalendarDays,
    title: "Flexibility is easy to read",
    body: "Nearby-date context and route guidance appear without crowding the search-first experience.",
  },
];

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Start with a route",
    body: "Enter airports, dates, travellers, and cabin in a search form designed to stay clear on every screen size.",
  },
  {
    step: "02",
    title: "Review the route with confidence",
    body: "Use fare states, nearby-date cues, and savings guidance to understand the trip before you commit.",
  },
  {
    step: "03",
    title: "Continue only when the fare is ready",
    body: "Checkout stays reserved for fares that can genuinely hand off to the final booking page.",
  },
];

const SURFACE_BENEFITS = [
  {
    icon: BellRing,
    title: "Track routes without noise",
    body: "Save alerts for the moments when live availability or your target fare returns.",
    href: "/alerts",
    cta: "View alerts",
  },
  {
    icon: Radar,
    title: "Check flight status quickly",
    body: "Use a traveller-friendly status screen for fast operational lookups and regional live-aircraft context.",
    href: "/status",
    cta: "Open tracker",
  },
  {
    icon: CreditCard,
    title: "Keep payment choices visible",
    body: "Wallet-aware pricing and cleaner offer guidance make it easier to compare the real amount you will pay.",
    href: "/profile",
    cta: "Open wallet",
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
        label: "Searches tracked today",
        value: statsLoading ? "…" : stats.searchesToday.toLocaleString(),
      },
      {
        label: "Visible savings this month",
        value: statsLoading ? "…" : formatLakhs(stats.moneySavedMonth),
      },
      {
        label: "Traveller promise",
        value: "Search first, clarity always",
      },
    ],
    [stats.moneySavedMonth, stats.searchesToday, statsLoading],
  );

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <ParticleBackground />

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
          <div className="absolute left-[-6%] top-[-18%] h-[32rem] w-[32rem] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_11%,transparent)] blur-[160px]" />
          <div className="absolute right-[-5%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[color-mix(in_srgb,var(--accent-purple)_10%,transparent)] blur-[150px]" />
          <div className="absolute bottom-[-12%] left-[18%] h-[18rem] w-[40rem] rounded-full bg-[color-mix(in_srgb,var(--accent-amber)_6%,transparent)] blur-[130px]" />
        </div>

        <div aria-hidden="true" className="hero-grid absolute inset-0 z-[3] opacity-[0.14]" />

        <div className="container-app relative z-10 pb-20 pt-24 sm:pt-28 md:pt-32 lg:pb-20">
          <div className="grid gap-10 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Premium flight booking, grounded in clarity
              </div>

              <h1 className="max-w-4xl text-balance font-[var(--font-display)] text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white sm:text-[4rem] md:text-[4.8rem] lg:text-[5.2rem]">
                Search with confidence.
                <br />
                <span className="text-gradient-soft">Book only when the fare is truly ready.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/74 sm:text-lg">
                AirBook’s traveller path is built for real booking confidence: premium visuals, clearer route context, calmer motion, and fares that stay honest about whether they can continue to checkout.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  "Live bookable fares clearly marked",
                  "Reference-only context when availability is limited",
                  "Responsive from phone to ultra-wide desktop",
                ].map((label) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3.5 py-2 text-xs text-white/78 backdrop-blur-md"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
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
                    transition={{ delay: 0.15 * index, duration: 0.45 }}
                    className="surface-card rounded-[24px] border-white/10 bg-black/12 px-4 py-4 backdrop-blur-md"
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
                  </motion.div>
                ))}
              </div>

              {recentSearches.length > 0 ? (
                <div className="mt-8 max-w-3xl rounded-[28px] border border-white/10 bg-black/12 p-4 backdrop-blur-md">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Recent searches from this session
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 4).map((search, index) => (
                      <Link
                        key={`${search.origin}-${search.destination}-${search.departureDate}-${index}`}
                        href={buildRecentSearchHref(search)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/16 px-3 py-2 text-xs text-white/78 transition-colors hover:border-white/18 hover:text-white"
                      >
                        <span>
                          {search.origin} → {search.destination}
                        </span>
                        <span className="text-white/40">•</span>
                        <span>{formatSearchDate(search.departureDate)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/alerts"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/16 px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/18 hover:text-white"
                >
                  View saved alerts
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/status"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/16 px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/18 hover:text-white"
                >
                  Check flight status
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              <TravelerSearchForm
                variant="hero"
                title="Search with clarity"
                description="Plan a trip with a search form that keeps route editing effortless and fare states easy to understand on every device."
                submitLabel="Search flights"
                helperText="Ready-to-book options stay distinct from route context, so you always know when checkout can genuinely continue."
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container-app relative z-10 py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {HERO_PILLARS.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
              className="surface-card rounded-[28px] p-6 md:p-7"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--accent-cta)]">
                <pillar.icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{pillar.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container-app relative z-10 border-t border-[var(--border-muted)] py-14 md:py-16">
        <div className="mb-10 max-w-3xl">
          <div className="section-kicker mb-4">
            <TicketPercent className="h-3.5 w-3.5" />
            Main traveller path
          </div>
          <h2 className="text-balance text-2xl font-semibold leading-tight md:text-4xl">
            Every screen now keeps the route, the fare, and the next step easy to read.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            The premium redesign focuses on the moments that matter most: entering a route, scanning results, reviewing trust, and continuing only when the booking handoff is ready.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {JOURNEY_STEPS.map((step, index) => (
            <motion.article
              key={step.step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
              className="surface-card rounded-[28px] p-6 md:p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{step.step}</span>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container-app relative z-10 border-t border-[var(--border-muted)] py-14 md:py-16">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-kicker mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Shared traveller surfaces
            </div>
            <h2 className="text-balance text-2xl font-semibold leading-tight md:text-4xl">
              Alerts, status, and wallet-aware pricing feel like one polished journey.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            The shared chrome, motion, backgrounds, and surfaces are tuned to feel premium without getting in the way of the primary booking task.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SURFACE_BENEFITS.map((benefit, index) => (
            <motion.article
              key={benefit.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
              className="surface-card rounded-[28px] p-6 md:p-7"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--accent-cta)]">
                <benefit.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{benefit.body}</p>
              <Link
                href={benefit.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cta)] transition-colors hover:text-[var(--text-primary)]"
              >
                {benefit.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container-app relative z-10 py-4 md:py-8">
        <div className="surface-panel rounded-[34px] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="section-kicker mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Built for calm booking decisions
              </div>
              <h2 className="text-balance text-2xl font-semibold leading-tight md:text-4xl">
                Premium visuals are only useful when they make the next choice easier.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Search-first hierarchy, tactile surfaces, reduced-motion care, mobile ergonomics, and cleaner copy now work together to keep the traveller experience polished and grounded.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                "Improved layout rhythm on every device",
                "Calmer gradients, shadows, and articulated backgrounds",
                "Clearer checkout trust and summary structure",
              ].map((item) => (
                <div key={item} className="surface-card rounded-[22px] px-4 py-4 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-green)]" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
