"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { getFareComparePageData } from "@/app/actions/compareActions";
import { formatPrice } from "@/lib/constants";
import {
  Search, ArrowRightLeft, Building2, Plane, CreditCard, Loader2,
} from "lucide-react";
import Link from "next/link";

const THREE_DAYS_FROM_NOW = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

type CompareData = Awaited<ReturnType<typeof getFareComparePageData>>;
type OtaComparisonInfo = NonNullable<CompareData["ota"]>["comparison"][string];
type RankedAirline = NonNullable<CompareData["airline"]>["ranked_airlines"][number];

function CompareContent() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  async function compare() {
    if (!from || !to) return;
    setLoading(true);
    const res = await getFareComparePageData(from, to);
    setData(res);
    setLoading(false);
  }

  return (
    <div className="min-h-[100dvh] pt-24 pb-20">
      <div className="container-app max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-5 h-5 text-[var(--accent-cta)]" />
            <h1 className="text-2xl font-bold">Compare Fares</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Side-by-side OTA prices, airline comparison, and best card combos.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-5 mb-8"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">From</label>
              <input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} maxLength={3} placeholder="DEL" className="ghost-input w-full text-lg font-semibold py-1" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">To</label>
              <input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} maxLength={3} placeholder="BOM" className="ghost-input w-full text-lg font-semibold py-1" />
            </div>
          </div>
          <button onClick={compare} disabled={!from || !to || loading}
            className="mt-4 w-full py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Comparing…" : "Compare Fares"}
          </button>
        </motion.div>

        {data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* OTA Comparison */}
            {data.ota && data.ota.comparison && Object.keys(data.ota.comparison).length > 0 && (
              <section className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">OTA Comparison</h3>
                  {data.ota.cheapest_source && (
                    <span className="ml-auto text-[11px] text-[var(--accent-green)] font-medium">
                      Cheapest: {data.ota.cheapest_source}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {(Object.entries(data.ota.comparison) as [string, OtaComparisonInfo][]).map(([source, info]) => (
                    <div key={source} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)]">
                      <div>
                        <div className="text-sm font-medium capitalize">{source.replace(/_/g, " ")}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{info.count} fares · {info.airlines?.slice(0, 3).join(", ") || ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono-price">{formatPrice(info.cheapest)}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Avg: {formatPrice(info.average)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Airline Comparison */}
            {data.airline && data.airline.ranked_airlines && data.airline.ranked_airlines.length > 0 && (
              <section className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">By Airline</h3>
                </div>
                <div className="space-y-2">
                  {data.airline.ranked_airlines.map((airline: RankedAirline, i: number) => (
                    <div key={airline.airline} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)]">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-[var(--accent-green)] text-white" : "bg-[var(--border-muted)]"}`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{airline.airline}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{airline.count} fares</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono-price">{formatPrice(airline.cheapest)}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Avg: {formatPrice(airline.average)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bank Combo */}
            {data.combo && data.combo.all_combos && data.combo.all_combos.length > 0 && (
              <section className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">Best Bank + Card Combo</h3>
                </div>
                {data.combo.best_combo && (
                  <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30">
                    <div className="text-sm font-semibold text-[var(--accent-green)]">Best Combo</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      Base: {formatPrice(data.combo.best_combo.base_price)} · Savings: {formatPrice(data.combo.best_combo.bank_savings)} · Effective: {formatPrice(data.combo.best_combo.effective_price)}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                      Travelpayouts fare baseline with wallet savings ready.
                    </div>
                  </div>
                )}
              </section>
            )}

            <Link
              href={`/search?from=${from}&to=${to}&date=${THREE_DAYS_FROM_NOW}&adults=1`}
              className="block w-full py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] text-center text-sm hover:opacity-90 transition-opacity"
            >
              Search Flights on {from}–{to} →
            </Link>
          </motion.div>
        )}
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
