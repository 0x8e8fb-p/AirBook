"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarRange,
  CreditCard,
  ShieldCheck,
  TicketPercent,
  TrendingUp,
} from "lucide-react";

import { getDealsPageData } from "@/app/actions/dealsActions";
import { formatPrice } from "@/lib/constants";

type DealsData = Awaited<ReturnType<typeof getDealsPageData>>;
type CheapestRoute = NonNullable<NonNullable<DealsData["trends"]>["top_cheapest_routes"]>[number];
type ActiveAirline = NonNullable<NonNullable<DealsData["trends"]>["most_active_airlines"]>[number];
type BankOffer = DealsData["bankOffers"][number];

function buildRouteSlug(from: string, to: string) {
  return `${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

function formatCarrierName(value?: string | null) {
  const cleaned = (value ?? "").trim();
  if (!cleaned || /^TP$/i.test(cleaned) || /travelpayouts/i.test(cleaned)) {
    return "Carrier varies";
  }
  return cleaned;
}

function formatPaymentMethodLabel(value?: string | null) {
  const cleaned = (value ?? "").trim();
  if (!cleaned || /travelpayouts/i.test(cleaned)) {
    return "Eligible payment method";
  }
  return cleaned;
}

function formatOfferValue(offer: BankOffer) {
  return offer.discount_type === "PERCENTAGE"
    ? `${offer.discount_value}% off`
    : `${formatPrice(offer.discount_value)} off`;
}

function DealsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="surface-card animate-pulse rounded-[30px] p-5 md:p-6">
          <div className="h-3 w-28 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-4 h-8 w-48 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((__, cardIndex) => (
              <div key={cardIndex} className="rounded-[22px] border border-[var(--border-default)] p-4">
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

export default function DealsPage() {
  const [data, setData] = useState<DealsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDeals() {
      setLoading(true);
      setError(null);

      try {
        const response = await getDealsPageData();
        if (cancelled) return;
        setData(response);
      } catch {
        if (cancelled) return;
        setData(null);
        setError("Recent route context is temporarily unavailable. Please try again shortly.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDeals();

    return () => {
      cancelled = true;
    };
  }, []);

  const routeCards = data?.trends?.top_cheapest_routes?.slice(0, 9) ?? [];
  const activeCarriers = data?.trends?.most_active_airlines?.slice(0, 8) ?? [];
  const offers = data?.bankOffers?.slice(0, 6) ?? [];
  const hasAnyContent = routeCards.length > 0 || activeCarriers.length > 0 || offers.length > 0;

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-kicker mb-4">
                <TicketPercent className="h-3.5 w-3.5" />
                Route watchlist
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Watch recent fare pockets and payment perks without mistaking them for live inventory.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                This page is built for route inspiration and planning. Recent fare context helps you decide what to watch next, while live search confirms whether a fare is currently ready to book.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: TrendingUp,
                    title: "Recent route context",
                    body: "Use route watchlists as a planning tool, not as a direct promise that the same fare is live right now.",
                  },
                  {
                    icon: CreditCard,
                    title: "Payment perks",
                    body: "Scan card and wallet offers worth checking before you pay on the final booking page.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Live search next",
                    body: "Move into the main search experience when you are ready to confirm actual availability and checkout readiness.",
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
                How to use this page
              </div>

              <div className="rounded-[26px] border border-[var(--accent-cta)]/18 bg-[var(--accent-primary-dim)] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                  <div>
                    <div className="text-sm font-semibold">Reference context first</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      Route prices here are a recent market read. Open the fare calendar to explore dates, then use live search when you are ready to confirm a current fare.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                >
                  Start live search
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/alerts"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                >
                  <BellRing className="h-4 w-4" />
                  Create fare alerts
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-6" aria-live="polite">
          {loading ? <DealsSkeleton /> : null}

          {!loading && (error || !hasAnyContent) ? (
            <div className="rounded-[30px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-red)]">Route watchlist unavailable</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-red)]/90">
                    {error ?? "We do not have enough recent route context to populate this page right now."}
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Start live search
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && hasAnyContent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                  <div>
                    <div className="text-sm font-semibold">Use this page to choose what to explore next</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      Route prices below show recent market context, not checkout-ready inventory. Open the fare calendar for date exploration, and confirm live availability on the main search page before you book.
                    </p>
                  </div>
                </div>
              </div>

              <section className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--accent-cta)]" />
                  <h2 className="text-lg font-semibold">Routes worth watching</h2>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Open a route calendar to see where the softer dates are clustering before you jump into live search.
                </p>

                {routeCards.length > 0 ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {routeCards.map((route: CheapestRoute, index: number) => (
                      <Link
                        key={`${route.source_airport}-${route.destination_airport}-${index}`}
                        href={`/calendar/${buildRouteSlug(route.source_airport, route.destination_airport)}`}
                        className="group rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 transition-colors hover:border-[var(--border-strong)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-muted)]">
                            Reference context
                          </span>
                          <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
                        </div>

                        <div className="mt-4 text-sm font-semibold">
                          {route.source_airport} → {route.destination_airport}
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                          Often seen with {formatCarrierName(route.airline)}
                        </div>

                        <div className="mt-4 text-2xl font-semibold font-mono-price text-[var(--accent-green)]">
                          {formatPrice(route.price)}
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                          Recent visible fare · open the route calendar next
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                    No route watchlist is ready yet. Try live search or come back shortly.
                  </div>
                )}
              </section>

              <section className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-[var(--accent-cta)]" />
                  <h2 className="text-lg font-semibold">Carriers appearing most often in recent fare signals</h2>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  A quick read on which carriers are showing up frequently across recent route context.
                </p>

                {activeCarriers.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeCarriers.map((airline: ActiveAirline, index: number) => (
                      <span
                        key={`${airline.airline}-${index}`}
                        className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
                      >
                        {formatCarrierName(airline.airline)}
                        <span className="ml-2 text-[var(--text-muted)]">{airline.samples} fare signals</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                    Carrier activity will appear here once we have a broader spread of recent route context.
                  </div>
                )}
              </section>

              <section className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[var(--accent-cta)]" />
                  <h2 className="text-lg font-semibold">Payment offers worth checking</h2>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Treat these as guidance for the payment step and confirm the full terms on the final booking page before you pay.
                </p>

                {offers.length > 0 ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {offers.map((offer: BankOffer, index: number) => (
                      <div
                        key={`${offer.title}-${index}`}
                        className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold leading-relaxed">{offer.title}</div>
                          <div className="rounded-full border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-green)]">
                            {formatOfferValue(offer)}
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                          {formatPaymentMethodLabel(offer.bank_name)} · {offer.card_type || "Selected cards"}
                        </div>
                        {offer.min_spend ? (
                          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                            Minimum spend {formatPrice(offer.min_spend)}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                    No payment perks are standing out right now.
                  </div>
                )}
              </section>

              <section className="surface-panel rounded-[30px] p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="text-lg font-semibold">Turn route inspiration into a live search</div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      Save a route with alerts if you are waiting, or move straight into live search when you are ready to confirm fresh pricing.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/alerts"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                    >
                      <BellRing className="h-4 w-4" />
                      Create fare alert
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                    >
                      Start live search
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
