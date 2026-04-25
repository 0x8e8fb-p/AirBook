"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { searchAirports } from "@/lib/airports";
import { getIntelligenceCombined } from "@/app/actions/intelligenceActions";
import {
  TrendingUp, Brain, CalendarDays, Search, ArrowRight,
  Sparkles, Loader2, Zap, TrendingDown,
} from "lucide-react";

function IntelligenceContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!from || !to || !date) return;
    setLoading(true);
    const data = await getIntelligenceCombined(from, to, date);
    setResult(data);
    setLoading(false);
  }

  const originLabel = searchAirports(from, 1)[0];
  const destLabel = searchAirports(to, 1)[0];

  return (
    <div className="min-h-[100dvh] pt-24 pb-20">
      <div className="container-app max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-[var(--accent-cta)]" />
            <h1 className="text-2xl font-bold">Flight Intelligence</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            ML-powered price prediction, optimal booking windows, and route trends.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-5 mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">From</label>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="DEL"
                className="ghost-input w-full text-lg font-semibold py-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">To</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="BOM"
                className="ghost-input w-full text-lg font-semibold py-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="ghost-input w-full text-lg font-semibold py-1 [color-scheme:dark]"
              />
            </div>
          </div>
          <button
            onClick={analyze}
            disabled={!from || !to || !date || loading}
            className="mt-4 w-full py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analyzing…" : "Analyze Route"}
          </button>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Predicted Price */}
            {result.prediction && (
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">ML Price Prediction</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold font-mono-price">₹{Math.round(result.prediction.predicted_price ?? 0).toLocaleString()}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Predicted</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[var(--accent-green)]">₹{Math.round(result.prediction.confidence_low ?? 0).toLocaleString()}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Low</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[var(--accent-red)]">₹{Math.round(result.prediction.confidence_high ?? 0).toLocaleString()}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">High</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-[var(--text-secondary)]">
                  Model: {result.prediction.model_version} · {result.prediction.training_samples.toLocaleString()} training samples
                </div>
              </div>
            )}

            {/* Booking Advice */}
            {result.advice && (
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">Best Time to Book</h3>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className={`w-5 h-5 ${result.advice.price_trend === "rising" ? "text-[var(--accent-red)]" : result.advice.price_trend === "falling" ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"}`} />
                  <div>
                    <div className="text-sm font-medium">{result.advice.recommendation}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Price trend: <span className="capitalize font-medium">{result.advice.price_trend}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-xs text-[var(--text-secondary)]">
                    Cheapest day: <span className="text-[var(--text-primary)] font-medium">{result.advice.cheapest_day_of_week}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    Cheapest month: <span className="text-[var(--text-primary)] font-medium">{result.advice.cheapest_month}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Forecast */}
            {result.forecast && (
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-cta)]" />
                  <h3 className="text-sm font-semibold">30-Day Forecast</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{result.forecast.median ? `₹${Math.round(result.forecast.median).toLocaleString()}` : "—"}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Median</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{result.forecast.p75 ? `₹${Math.round(result.forecast.p75).toLocaleString()}` : "—"}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">P75</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-[var(--text-secondary)]">
                  Recommendation: <span className="capitalize font-medium">{result.forecast.recommendation?.replace(/_/g, " ")}</span>
                  {result.forecast.sample_size ? ` · ${result.forecast.sample_size} samples` : ""}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push(`/search?from=${from}&to=${to}&date=${date}&adults=1`)}
              className="w-full py-3 bg-[var(--accent-primary-dim)] border border-[var(--accent-cta)]/20 text-[var(--accent-cta)] font-semibold rounded-[var(--radius-md)] hover:bg-[var(--accent-cta)] hover:text-[var(--text-inverse)] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Search This Route <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense>
      <IntelligenceContent />
    </Suspense>
  );
}
