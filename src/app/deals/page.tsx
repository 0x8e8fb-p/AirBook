"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDealsPageData } from "@/app/actions/dealsActions";
import { formatPrice } from "@/lib/constants";
import {
  TicketPercent, TrendingUp, Loader2, CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function DealsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDealsPageData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-[100dvh] pt-24 pb-20">
      <div className="container-app max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <TicketPercent className="w-5 h-5 text-[var(--accent-cta)]" />
            <h1 className="text-2xl font-bold">Deals & Offers</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Trending cheap routes, bank offers, and nearby airport savings.
          </p>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="w-8 h-8 text-[var(--text-muted)] animate-spin mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Loading deals…</p>
          </div>
        )}

        {!loading && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Trending Routes */}
            {data.trends && data.trends.top_cheapest_routes && (
              <section className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">Trending — Cheapest Routes</h3>
                </div>
                {data.trends.top_cheapest_routes.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {data.trends.top_cheapest_routes.slice(0, 8).map((route: any, i: number) => (
                      <Link
                        key={i}
                        href={`/search?from=${route.source_airport}&to=${route.destination_airport}&date=${new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}&adults=1`}
                        className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium">{route.source_airport} → {route.destination_airport}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{route.airline}</div>
                        </div>
                        <div className="font-bold font-mono-price text-[var(--accent-green)]">
                          {formatPrice(route.price)}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">No trending data yet.</p>
                )}
              </section>
            )}

            {/* Most Active Airlines */}
            {data.trends?.most_active_airlines && data.trends.most_active_airlines.length > 0 && (
              <section className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">Most Active Airlines</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.trends.most_active_airlines.slice(0, 6).map((airline: any) => (
                    <span key={airline.airline} className="px-3 py-1.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-default)] text-xs font-medium">
                      {airline.airline} <span className="text-[var(--text-muted)]">({airline.samples})</span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Bank Offers */}
            {data.bankOffers && data.bankOffers.length > 0 && (
              <section className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">Bank & Card Offers</h3>
                </div>
                <div className="space-y-2">
                  {data.bankOffers.slice(0, 5).map((offer: any, i: number) => (
                    <div key={i} className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">{offer.title}</div>
                        <div className="text-[11px] font-bold text-[var(--accent-green)]">
                          {offer.discount_type === "PERCENTAGE" ? `${offer.discount_value}%` : `₹${offer.discount_value}`} off
                        </div>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{offer.bank_name} · {offer.card_type || "All cards"}</div>
                      {offer.min_spend && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Min spend: ₹{offer.min_spend}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
