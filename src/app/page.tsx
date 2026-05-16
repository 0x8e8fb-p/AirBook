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
    title: "Search flights",
    body: "Search one-way or return trips by route, date, travellers, and cabin.",
  },
  {
    icon: Wallet,
    title: "Set fare alerts",
    body: "Save a route and come back when the price matches what you want to pay.",
  },
  {
    icon: CalendarDays,
    title: "Check nearby dates",
    body: "Use date and route guidance to spot better timing before you book.",
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
      },
      {
        label: "Savings this month",
        value: statsLoading ? "…" : formatLakhs(stats.moneySavedMonth),
      },
      {
        label: "Recent searches",
        value: recentSearches.length.toString(),
      },
    ],
    [recentSearches.length, stats.moneySavedMonth, stats.searchesToday, statsLoading],
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
              <h1 className="max-w-4xl text-balance font-[var(--font-display)] text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white sm:text-[4rem] md:text-[4.8rem] lg:text-[5.2rem]">
                Search flights, set alerts,
                <br />
                <span className="text-gradient-soft">and check status.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/74 sm:text-lg">
                Use TheWingScan to search routes, save price alerts, and track flights in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  "Search flights",
                  "Create price alerts",
                  "Track flight status",
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
              <TravelerSearchForm variant="hero" submitLabel="Search flights" />
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
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-kicker mb-4">More tools</div>
            <h2 className="text-balance text-2xl font-semibold leading-tight md:text-4xl">
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

      <Footer />
    </div>
  );
}
