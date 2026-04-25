"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { searchAggregatorFlights, getAggregatorProviders } from "@/app/actions/aggregatorActions";
import { formatPrice, formatDuration } from "@/lib/constants";
import {
  Search, Layers, Loader2, ExternalLink, ChevronDown, ArrowRight,
} from "lucide-react";

function AggregatorContent() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  async function search() {
    if (!from || !to || !date) return;
    setLoading(true);
    const data = await searchAggregatorFlights(from, to, date);
    setResult(data);
    setLoading(false);
  }

  const cheapest = result?.cheapestOption;
  const alternatives = result?.results?.slice(1, 6) || [];

  return (
    <div className="min-h-[100dvh] pt-24 pb-20">
      <div className="container-app max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-[var(--accent-cta)]" />
            <h1 className="text-2xl font-bold">Aggregator Search</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Search across all Indian OTAs with real-time offers and fee adjustment.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-5 mb-8"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">From</label>
              <input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} maxLength={3} placeholder="DEL" className="ghost-input w-full text-lg font-semibold py-1" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">To</label>
              <input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} maxLength={3} placeholder="BOM" className="ghost-input w-full text-lg font-semibold py-1" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="ghost-input w-full text-lg font-semibold py-1 [color-scheme:dark]" />
            </div>
          </div>
          <button onClick={search} disabled={!from || !to || !date || loading}
            className="mt-4 w-full py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching all providers…" : "Search All OTAs"}
          </button>
        </motion.div>

        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {result.note && (
              <div className="text-xs text-[var(--text-muted)]">{result.note}</div>
            )}

            {result.summary && (
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4">
                <span><strong className="text-[var(--text-primary)]">{result.summary.totalOptions}</strong> options</span>
                <span><strong className="text-[var(--text-primary)]">{result.summary.providersCount}</strong> providers</span>
                <span>Cheapest: <strong className="text-[var(--text-primary)]">{formatPrice(result.summary.cheapestBasePrice)}</strong></span>
                {result.summary.dateAdjusted && <span className="text-[var(--accent-cta)]">Date auto-adjusted</span>}
              </div>
            )}

            {/* Best Deal */}
            {cheapest && (
              <div className="bg-[var(--bg-subtle)] border border-[var(--accent-cta)]/30 rounded-[var(--radius-lg)] p-5 relative">
                <div className="absolute -top-2.5 left-4 flex items-center gap-1.5 bg-[var(--bg-base)] border border-[var(--accent-cta)] px-2.5 py-0.5 rounded-full">
                  <ChevronDown className="w-3 h-3 text-[var(--accent-cta)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-cta)]">Best Deal</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2">
                  <div>
                    <div className="text-sm font-medium">{cheapest.flight.airline_name} · {cheapest.flight.flight_number}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {cheapest.flight.departure_display} → {cheapest.flight.arrival_display}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {cheapest.flight.duration} · {cheapest.flight.stops === 0 ? "Direct" : `${cheapest.flight.stops} stop${cheapest.flight.stops > 1 ? "s" : ""}`}
                    </div>
                    <div className="text-[11px] text-[var(--accent-cta)] mt-1">via {cheapest.provider}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono-price text-[var(--accent-green)]">
                      {formatPrice(cheapest.priceDetails.best_price)}
                    </div>
                    {cheapest.priceDetails.savings > 0 && (
                      <div className="text-[11px] text-[var(--accent-green)]">
                        Save {formatPrice(cheapest.priceDetails.savings)}
                      </div>
                    )}
                    {cheapest.priceDetails.applied_offer && (
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {cheapest.priceDetails.applied_offer.name}
                      </div>
                    )}
                  </div>
                </div>
                {cheapest.flight.source_url && (
                  <a href={cheapest.flight.source_url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--accent-cta)] hover:underline"
                  >
                    Book on {cheapest.provider} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Alternatives</h3>
                <div className="space-y-2">
                  {alternatives.map((alt: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)]">
                      <div>
                        <div className="text-sm font-medium">{alt.flight.airline_name} · {alt.flight.flight_number}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{alt.provider} · {alt.flight.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono-price">{formatPrice(alt.priceDetails.best_price)}</div>
                        {alt.priceDetails.savings > 0 && (
                          <div className="text-[10px] text-[var(--accent-green)]">Save {formatPrice(alt.priceDetails.savings)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function AggregatorPage() {
  return (
    <Suspense>
      <AggregatorContent />
    </Suspense>
  );
}
