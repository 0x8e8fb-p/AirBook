"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import type { FlightResult, SortOption, CabinClass } from "@/lib/types";
import { sortFlights } from "@/lib/api/search-orchestrator";
import { getAirportDisplay } from "@/lib/airports";
import { AIRLINES, SORT_OPTIONS, formatPrice, formatDuration, formatTime } from "@/lib/constants";
import {
  Plane, ArrowLeft, ArrowRight, SlidersHorizontal,
  X, ExternalLink, AlertCircle, Loader2,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";

/* ─── Loading ──── */
function SearchingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border border-[var(--border-strong)] border-t-[var(--text-secondary)] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Plane className="w-4 h-4 text-[var(--text-muted)] -rotate-45" />
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">Searching fares...</p>
    </div>
  );
}

/* ─── Skeleton ──── */
function SkeletonCard() {
  return (
    <div className="border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--border-muted)]" />
        <div className="flex-1 space-y-2"><div className="h-4 bg-[var(--border-muted)] rounded w-28" /><div className="h-3 bg-[var(--border-muted)] rounded w-20" /></div>
        <div className="h-6 bg-[var(--border-muted)] rounded w-20" />
      </div>
    </div>
  );
}

/* ─── Flight Card ──────── */
function FlightCard({ flight, index, isCheapest }: { flight: FlightResult; index: number; isCheapest: boolean }) {
  const router = useRouter();
  const airlineInfo = AIRLINES[flight.airline];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
    >
      <div className={`relative border rounded-[var(--radius-lg)] p-5 hover:border-[var(--border-strong)] transition-colors ${
        isCheapest ? "border-[var(--text-muted)]/30 bg-[var(--accent-primary-dim)]" : "border-[var(--border-default)]"
      }`}>
        {isCheapest && (
          <div className="absolute -top-2.5 left-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest bg-[var(--bg-base)] border border-[var(--border-strong)] px-2.5 py-0.5 rounded-full text-[var(--text-secondary)]">Best Price</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Airline */}
          <div className="flex items-center gap-3 sm:w-40 shrink-0">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: airlineInfo?.color || "#3F3F46" }}>
              {flight.airline}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{flight.airlineName}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">{flight.flightNumber}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-center shrink-0">
              <div className="text-base font-semibold font-mono-price">{formatTime(flight.departureTime)}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{flight.origin}</div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1 px-1">
              <div className="text-[10px] text-[var(--text-muted)] font-mono">{formatDuration(flight.durationMinutes)}</div>
              <div className="w-full h-px bg-[var(--border-strong)] relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
              </div>
              <div className="text-[10px] font-medium">
                {flight.stops === 0 ? (
                  <span className="text-[var(--accent-green)]">Direct</span>
                ) : (
                  <span className="text-[var(--text-muted)]">
                    {flight.stops} stop{flight.stops > 1 ? "s" : ""}
                    {flight.stopCities.length > 0 && ` · ${flight.stopCities.join(", ")}`}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className="text-base font-semibold font-mono-price">{formatTime(flight.arrivalTime)}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{flight.destination}</div>
            </div>
          </div>

          {/* Price */}
          <div className="sm:w-36 flex flex-col sm:items-end shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-muted)] pt-4 sm:pt-0 sm:pl-5">
            <div className="text-xl font-semibold font-mono-price mb-1">{formatPrice(flight.price)}</div>
            <div className="flex gap-1.5 mb-3">
              {flight.baggage.checked.included && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary-dim)] text-[var(--text-muted)] font-medium">Bag</span>}
              {flight.refundable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary-dim)] text-[var(--text-muted)] font-medium">Refundable</span>}
            </div>
            <button
              onClick={() => router.push(`/checkout?id=${flight.id}`)}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              Select <ExternalLink className="w-3 h-3 opacity-50" />
            </button>
          </div>
        </div>

        {flight.seatsRemaining && flight.seatsRemaining <= 4 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-muted)]">
            <span className="text-[11px] text-[var(--accent-red)] font-medium">
              {flight.seatsRemaining} seat{flight.seatsRemaining > 1 ? "s" : ""} left
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Sort ──── */
function SortBar({ sortBy, onSort, totalResults }: { sortBy: SortOption; onSort: (v: SortOption) => void; totalResults: number }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <span className="text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)] font-semibold">{totalResults}</strong> flights
      </span>
      <div className="flex gap-0.5 p-0.5 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.value;
          return (
            <button key={opt.value} onClick={() => onSort(opt.value as SortOption)}
              className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[var(--radius-sm)] transition-colors ${
                active ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {active && <motion.div layoutId="sortPill" className="absolute inset-0 bg-[var(--accent-cta)] rounded-[var(--radius-sm)]" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Filters ──── */
function FilterPanel({ flights, onFilter, show, onClose }: { flights: FlightResult[]; onFilter: (f: FlightResult[]) => void; show: boolean; onClose: () => void }) {
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

  const airlines = useMemo(() => {
    const map = new Map<string, number>();
    flights.forEach((f) => map.set(f.airline, (map.get(f.airline) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [flights]);

  useEffect(() => {
    let filtered = [...flights];
    if (maxStops !== null) filtered = filtered.filter((f) => f.stops <= maxStops);
    if (selectedAirlines.length > 0) filtered = filtered.filter((f) => selectedAirlines.includes(f.airline));
    onFilter(filtered);
  }, [maxStops, selectedAirlines, flights, onFilter]);

  const toggleAirline = (code: string) => setSelectedAirlines((p) => p.includes(code) ? p.filter((c) => c !== code) : [...p, code]);

  const content = (
    <>
      <div className="mb-6">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Stops</h4>
        <div className="flex flex-wrap gap-1.5">
          {[{ val: null, label: "Any" }, { val: 0, label: "Non-stop" }, { val: 1, label: "1 Stop" }].map(({ val, label }) => (
            <button key={String(val)} onClick={() => setMaxStops(val)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-[var(--radius-sm)] border transition-colors ${
                maxStops === val
                  ? "bg-[var(--accent-cta)] border-transparent text-[var(--text-inverse)]"
                  : "bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Airlines</h4>
        {airlines.map(([code, count]) => (
          <button key={code} onClick={() => toggleAirline(code)} className="w-full flex items-center justify-between p-2 rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-dim)] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[8px] ${
                selectedAirlines.includes(code) ? "bg-[var(--accent-cta)] border-transparent text-[var(--text-inverse)]" : "border-[var(--border-strong)]"
              }`}>{selectedAirlines.includes(code) && "✓"}</div>
              <span className="text-[13px]">{AIRLINES[code]?.name || code}</span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{count}</span>
          </button>
        ))}
      </div>

      <button onClick={() => { setMaxStops(null); setSelectedAirlines([]); }}
        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] w-full text-center py-2 border border-[var(--border-default)] rounded-[var(--radius-sm)] transition-colors"
      >Reset</button>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-32 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
          {content}
        </div>
      </aside>

      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute right-0 top-0 bottom-0 w-[80vw] max-w-xs bg-[var(--bg-base)] border-l border-[var(--border-default)] p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-sm">Filters</span>
                <button onClick={onClose}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
              </div>
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main ──── */
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setOrigin, setDestination } = useSearchStore();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const returnDate = searchParams.get("return") || "";
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const infants = parseInt(searchParams.get("infants") || "0");
  const cabin = (searchParams.get("cabin") || "economy") as CabinClass;

  const [allFlights, setAllFlights] = useState<FlightResult[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { if (from) setOrigin(from); if (to) setDestination(to); }, [from, to, setOrigin, setDestination]);

  useEffect(() => {
    if (!from || !to || !date) return;
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: from, destination: to, departureDate: date, returnDate: returnDate || undefined, passengers: { adults, children, infants }, cabinClass: cabin }),
        });
        if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
        const data = await res.json();
        setAllFlights(data.flights || []);
        setFilteredFlights(data.flights || []);
      } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
      finally { setIsLoading(false); }
    };
    fetchResults();
  }, [from, to, date, returnDate, adults, children, infants, cabin]);

  const sortedFlights = useMemo(() => sortFlights(filteredFlights, sortBy), [filteredFlights, sortBy]);
  const handleFilter = useCallback((f: FlightResult[]) => setFilteredFlights(f), []);

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Header */}
      <header className="bg-[var(--bg-base)]/90 backdrop-blur-xl border-b border-[var(--border-default)] sticky top-14 z-30">
        <div className="container-app py-3 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] flex items-center justify-center hover:bg-[var(--accent-primary-dim)]" aria-label="Back">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="truncate">{getAirportDisplay(from)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{getAirportDisplay(to)}</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              {date && new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {adults + children + infants} traveller{adults + children + infants > 1 ? "s" : ""}
            </div>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden p-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:bg-[var(--accent-primary-dim)]" aria-label="Filters">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="container-app py-6">
        <div className="flex gap-8">
          <FilterPanel flights={allFlights} onFilter={handleFilter} show={showFilters} onClose={() => setShowFilters(false)} />

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="max-w-3xl mx-auto">
                <SearchingAnimation />
                <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto text-center py-16">
                <AlertCircle className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Search Error</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">{error}</p>
                <button onClick={() => router.push("/")} className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] text-sm font-medium">New Search</button>
              </div>
            ) : sortedFlights.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-16">
                <Plane className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No flights found</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Try different dates or airports.</p>
                <button onClick={() => router.push("/")} className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] text-sm font-medium">New Search</button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <SortBar sortBy={sortBy} onSort={setSortBy} totalResults={sortedFlights.length} />
                <div className="space-y-3">
                  {sortedFlights.map((flight, i) => (
                    <FlightCard key={flight.id} flight={flight} index={i} isCheapest={i === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
