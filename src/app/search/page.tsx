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

import { GlassCard } from "@/components/ui/GlassCard";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { Badge } from "@/components/ui/Badge";
import { FareCardSkeleton } from "@/components/ui/Skeleton";
import { Footer } from "@/components/layout/Footer";

/* ─── Loading Animation ──── */
function SearchingAnimation() {
  return (
    <GlassCard className="p-8 mb-6 overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
      <div className="relative w-16 h-16 mb-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-6 h-6 text-[var(--accent-primary)] -rotate-45" />
          </motion.div>
        </div>
      </div>
      <h3 className="text-lg font-bold mb-1">Searching Fares</h3>
      <p className="text-sm text-[var(--text-secondary)]">Comparing prices across multiple sources...</p>
    </GlassCard>
  );
}

/* ─── Flight Result Card ──────── */
function FlightCard({
  flight,
  index,
  isCheapest,
}: {
  flight: FlightResult;
  index: number;
  isCheapest: boolean;
}) {
  const router = useRouter();
  const airlineInfo = AIRLINES[flight.airline];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`relative bg-[var(--bg-subtle)] border rounded-[var(--radius-lg)] p-5 group hover:border-[var(--border-strong)] transition-all duration-200 ${
          isCheapest
            ? "border-[var(--accent-amber)]/30 shadow-[var(--shadow-glow-amber)]"
            : "border-[var(--border-default)]"
        }`}
      >
        {/* Best price badge */}
        {isCheapest && (
          <div className="absolute -top-3 left-5">
            <Badge variant="warning">Best Price</Badge>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Airline */}
          <div className="flex items-center gap-3 sm:w-44 shrink-0">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: airlineInfo?.color || "#4B5563" }}
            >
              {flight.airline}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{flight.airlineName}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{flight.flightNumber}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-center shrink-0">
              <div className="text-lg font-bold font-mono-price">{formatTime(flight.departureTime)}</div>
              <div className="text-xs font-semibold text-[var(--accent-primary)] tracking-wider mt-0.5">{flight.origin}</div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1 px-2">
              <div className="text-[10px] text-[var(--text-muted)] font-mono">{formatDuration(flight.durationMinutes)}</div>
              <div className="w-full relative h-px bg-[var(--border-strong)] flex items-center justify-between">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                {flight.stops > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]" />}
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]" />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider">
                {flight.stops === 0 ? (
                  <span className="text-[var(--accent-green)]">Direct</span>
                ) : (
                  <span className="text-[var(--accent-amber)]">
                    {flight.stops} Stop{flight.stops > 1 ? "s" : ""}
                    {flight.stopCities.length > 0 && (
                      <span className="text-[var(--text-muted)]"> via {flight.stopCities.join(", ")}</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className="text-lg font-bold font-mono-price">{formatTime(flight.arrivalTime)}</div>
              <div className="text-xs font-semibold text-[var(--accent-secondary)] tracking-wider mt-0.5">{flight.destination}</div>
            </div>
          </div>

          {/* Price + Action */}
          <div className="sm:w-40 flex flex-col sm:items-end justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-muted)] pt-4 sm:pt-0 sm:pl-5">
            <div className="flex flex-col sm:items-end mb-3">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Fare</div>
              <div className="text-2xl font-bold font-mono-price text-[var(--text-primary)] mt-0.5">
                <PriceTicker value={flight.price} prefix="₹" duration={0.6} />
              </div>
            </div>

            {/* Baggage + Refund pills */}
            <div className="flex gap-1.5 mb-3">
              {flight.baggage.checked.included && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-green)]/10 text-[var(--accent-green)] font-semibold">Checked Bag</span>
              )}
              {flight.refundable && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold">Refundable</span>
              )}
            </div>

            <button
              onClick={() => router.push(`/checkout?id=${flight.id}`)}
              className="w-full sm:w-auto px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent-amber)] text-[var(--text-inverse)] text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
            >
              Select <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Seats remaining */}
        {flight.seatsRemaining && flight.seatsRemaining <= 5 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-muted)]">
            <span className="text-xs text-[var(--accent-red)] font-semibold">
              Only {flight.seatsRemaining} seat{flight.seatsRemaining > 1 ? "s" : ""} left at this price
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Sort Bar ───────────────────────────────────────── */
function SortBar({
  sortBy,
  onSort,
  totalResults,
}: {
  sortBy: SortOption;
  onSort: (v: SortOption) => void;
  totalResults: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex items-center justify-between mb-6 flex-wrap gap-4"
    >
      <div className="text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)] text-base font-bold">{totalResults}</strong> flights found
      </div>
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-default)]">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSort(opt.value as SortOption)}
              className={`relative px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-md)] transition-colors ${
                isActive ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sortIndicator"
                  className="absolute inset-0 bg-[var(--accent-primary)] rounded-[var(--radius-md)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Filter Panel ───────────────────────────────────── */
function FilterPanel({
  flights,
  onFilter,
  show,
  onClose,
}: {
  flights: FlightResult[];
  onFilter: (filtered: FlightResult[]) => void;
  show: boolean;
  onClose: () => void;
}) {
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState<number>(100000);

  const airlines = useMemo(() => {
    const map = new Map<string, number>();
    flights.forEach((f) => map.set(f.airline, (map.get(f.airline) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [flights]);

  const maxPriceInResults = useMemo(() => Math.max(...flights.map((f) => f.price), 10000), [flights]);

  useEffect(() => { setPriceMax(maxPriceInResults); }, [maxPriceInResults]);

  useEffect(() => {
    let filtered = [...flights];
    if (maxStops !== null) filtered = filtered.filter((f) => f.stops <= maxStops);
    if (selectedAirlines.length > 0) filtered = filtered.filter((f) => selectedAirlines.includes(f.airline));
    if (priceMax < maxPriceInResults) filtered = filtered.filter((f) => f.price <= priceMax);
    onFilter(filtered);
  }, [maxStops, selectedAirlines, priceMax, flights, maxPriceInResults, onFilter]);

  const toggleAirline = (code: string) => {
    setSelectedAirlines((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };

  const FilterContent = () => (
    <>
      {/* Stops */}
      <div className="mb-8">
        <h4 className="text-xs font-semibold mb-3 text-[var(--accent-primary)] uppercase tracking-[0.15em]">Stops</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { val: null, label: "Any" },
            { val: 0, label: "Non-stop" },
            { val: 1, label: "1 Stop" },
            { val: 2, label: "2+ Stops" },
          ].map(({ val, label }) => {
            const active = maxStops === val;
            return (
              <button
                key={String(val)}
                onClick={() => setMaxStops(val)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-md)] border transition-all ${
                  active
                    ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-inverse)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Airlines */}
      <div className="mb-8">
        <h4 className="text-xs font-semibold mb-3 text-[var(--accent-primary)] uppercase tracking-[0.15em]">Airlines</h4>
        <div className="space-y-1">
          {airlines.map(([code, count]) => {
            const info = AIRLINES[code];
            const active = selectedAirlines.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleAirline(code)}
                className="w-full flex items-center justify-between p-2.5 rounded-[var(--radius-md)] hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      active
                        ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]"
                        : "border-[var(--border-strong)] bg-transparent group-hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {active && <span className="text-[10px] text-[var(--text-inverse)]">✓</span>}
                  </div>
                  <span className="text-sm">{info?.name || code}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => { setMaxStops(null); setSelectedAirlines([]); setPriceMax(maxPriceInResults); }}
        className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] w-full text-center py-3 border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-white/5 transition-colors"
      >
        Reset Filters
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <GlassCard className="p-6 sticky top-24">
            <FilterContent />
          </GlassCard>
        </motion.div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-[var(--bg-base)] border-l border-[var(--border-default)] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={onClose} className="p-2 rounded-[var(--radius-md)] hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Search Content ─────────────────────────────────── */
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

  useEffect(() => {
    if (from) setOrigin(from);
    if (to) setDestination(to);
  }, [from, to, setOrigin, setDestination]);

  useEffect(() => {
    if (!from || !to || !date) return;
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: from,
            destination: to,
            departureDate: date,
            returnDate: returnDate || undefined,
            passengers: { adults, children, infants },
            cabinClass: cabin,
          }),
        });
        if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
        const data = await response.json();
        setAllFlights(data.flights || []);
        setFilteredFlights(data.flights || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [from, to, date, returnDate, adults, children, infants, cabin]);

  const sortedFlights = useMemo(() => sortFlights(filteredFlights, sortBy), [filteredFlights, sortBy]);
  const handleFilter = useCallback((filtered: FlightResult[]) => { setFilteredFlights(filtered); }, []);

  const originDisplay = getAirportDisplay(from);
  const destDisplay = getAirportDisplay(to);

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Search Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-default)] sticky top-16 z-30"
      >
        <div className="container-app py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] hover:border-[var(--border-strong)] flex items-center justify-center shrink-0 bg-[var(--bg-subtle)] transition-colors"
            aria-label="Back to search"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-base font-bold tracking-tight">
              <span className="truncate text-[var(--accent-primary)]">{originDisplay}</span>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <span className="truncate text-[var(--accent-secondary)]">{destDisplay}</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
              {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              {" · "}{adults + children + infants} traveller{adults + children + infants > 1 ? "s" : ""}
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-2.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:border-[var(--accent-primary)]"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container-app py-8">
        <div className="flex gap-8">
          <FilterPanel flights={allFlights} onFilter={handleFilter} show={showFilters} onClose={() => setShowFilters(false)} />

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="max-w-3xl mx-auto">
                <SearchingAnimation />
                <div className="space-y-4">
                  <FareCardSkeleton />
                  <FareCardSkeleton />
                  <FareCardSkeleton />
                </div>
              </div>
            ) : error ? (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto">
                <GlassCard className="p-10 text-center flex flex-col items-center">
                  <AlertCircle className="w-12 h-12 text-[var(--accent-amber)] mb-5" />
                  <h3 className="text-xl font-bold mb-2">Search Error</h3>
                  <p className="text-[var(--text-secondary)] mb-6 max-w-md">{error}</p>
                  <button onClick={() => router.push("/")} className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-[var(--text-inverse)] font-semibold hover:brightness-110 transition-all">
                    New Search
                  </button>
                </GlassCard>
              </motion.div>
            ) : sortedFlights.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto">
                <GlassCard className="p-10 text-center flex flex-col items-center">
                  <Plane className="w-12 h-12 text-[var(--text-muted)] mb-5" />
                  <h3 className="text-xl font-bold mb-2">No Flights Found</h3>
                  <p className="text-[var(--text-secondary)] mb-6 max-w-md">No flights match your criteria. Try adjusting filters or dates.</p>
                  <button onClick={() => router.push("/")} className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-[var(--text-inverse)] font-semibold hover:brightness-110 transition-all">
                    New Search
                  </button>
                </GlassCard>
              </motion.div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Savings bar */}
                {sortedFlights.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/15 flex items-center gap-4"
                  >
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent-amber)]/10 flex items-center justify-center shrink-0">
                      <span className="text-lg">✨</span>
                    </div>
                    <div>
                      <span className="text-base font-bold font-mono-price text-[var(--accent-amber)]">
                        Save up to <PriceTicker value={Math.max(...sortedFlights.map((f) => f.price)) - Math.min(...sortedFlights.map((f) => f.price))} prefix="₹" duration={1.2} />
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block mt-0.5">Price difference between cheapest and most expensive option</span>
                    </div>
                  </motion.div>
                )}

                <SortBar sortBy={sortBy} onSort={setSortBy} totalResults={sortedFlights.length} />

                <div className="space-y-4">
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
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
