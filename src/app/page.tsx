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
      <section className="container-app pt-12 pb-12 md:pt-16 md:pb-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="max-w-xl">
            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] md:text-4xl">
              Search flights
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] md:text-base">
              Route, date, travellers, cabin.
            </p>

            {recentSearches.length > 0 ? (
              <div className="mt-10">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Recent
                </div>
                <div className="flex flex-col gap-1.5">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <Link
                      key={`${search.origin}-${search.destination}-${search.departureDate}-${index}`}
                      href={buildRecentSearchHref(search)}
                      className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-[var(--border-default)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_50%,transparent)]"
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
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatSearchDate(search.departureDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-2">
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
          </div>

          <div>
            <TravelerSearchForm variant="hero" submitLabel="Search flights" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



