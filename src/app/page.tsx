"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { TravelerSearchForm } from "@/components/ui/TravelerSearchForm";
import type { SearchParams } from "@/lib/types";
import { useSearchStore } from "@/stores/search-store";

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

export default function HomePage() {
  const recentSearches = useSearchStore((state) => state.recentSearches);

  return (
    <div className="relative min-h-[100dvh]">
      <section className="container-app pt-10 pb-16 md:pt-14 md:pb-20">
        {/* Title block ─ centered, breathable */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] md:text-5xl">
            Search flights
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-secondary)] md:text-base">
            Route, date, travellers, cabin.
          </p>
        </div>

        {/* Search form ─ the focal point */}
        <div className="mx-auto mt-10 max-w-4xl md:mt-12">
          <TravelerSearchForm variant="hero" submitLabel="Search flights" />
        </div>

        {/* Recent searches ─ optional, compact list */}
        {recentSearches.length > 0 ? (
          <div className="mx-auto mt-12 max-w-2xl md:mt-14">
            <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Recent
            </div>
            <ul className="flex flex-col gap-1">
              {recentSearches.slice(0, 5).map((search, index) => (
                <li key={`${search.origin}-${search.destination}-${search.departureDate}-${index}`}>
                  <Link
                    href={buildRecentSearchHref(search)}
                    className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-[var(--border-default)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_55%,transparent)]"
                  >
                    <span className="flex items-center gap-2 text-[var(--text-primary)]">
                      <span className="font-mono-price font-semibold tabular-nums">
                        {search.origin}
                      </span>
                      <span className="text-[var(--text-muted)]">→</span>
                      <span className="font-mono-price font-semibold tabular-nums">
                        {search.destination}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-[var(--text-muted)]">
                      {formatSearchDate(search.departureDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Secondary navigation ─ small inline links */}
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            Saved alerts
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            Flight status
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}



