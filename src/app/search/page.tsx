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
  Plane, ArrowLeft, ArrowRight, Luggage, SlidersHorizontal,
  X, ChevronDown, ExternalLink, AlertCircle, Loader2,
} from "lucide-react";

/* ─── Loading Animation: Airplane flying with trail ──── */
function SearchingAnimation() {
  return (
    <div className="glass-card p-6 mb-6 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-[var(--border-primary)] border-t-[var(--color-primary)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Plane className="w-5 h-5 text-[var(--color-primary)]" />
            </motion.div>
          </div>
        </div>
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-medium"
          >
            Searching across all airlines & OTAs...
          </motion.p>
          <div className="flex items-center gap-2 mt-1">
            {["IndiGo", "Air India", "SpiceJet", "Akasa"].map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                className="text-xs text-[var(--text-tertiary)]"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "85%" }}
          transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ─── Skeleton Card with shimmer ─────────────────────── */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flight-card"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg skeleton" />
        <div className="flex-1">
          <div className="h-4 w-32 skeleton mb-2" />
          <div className="h-3 w-20 skeleton" />
        </div>
        <div className="text-right">
          <div className="h-6 w-24 skeleton mb-1" />
          <div className="h-3 w-16 skeleton" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-16 skeleton" />
        <div className="flex-1 h-0.5 skeleton" />
        <div className="h-4 w-16 skeleton" />
      </div>
    </motion.div>
  );
}

/* ─── Flight Result Card — with hover FX ─────────────── */
function FlightCard({ flight, index, isCheapest }: { flight: FlightResult; index: number; isCheapest: boolean }) {
  const airlineInfo = AIRLINES[flight.airline];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.3 } }}
      className={`flight-card group relative ${isCheapest ? "flight-card-cheapest" : ""}`}
    >
      {/* Cheapest badge */}
      <AnimatePresence>
        {isCheapest && (
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="absolute -top-3 left-4 badge badge-savings text-[11px]"
          >
            🏆 Cheapest
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Airline */}
        <div className="flex items-center gap-3 sm:w-44 shrink-0">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: airlineInfo?.color || "#4B5563" }}
          >
            {flight.airline}
          </motion.div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{flight.airlineName}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{flight.flightNumber}</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="text-center shrink-0">
            <div className="text-lg sm:text-xl font-bold tabular-nums">{formatTime(flight.departureTime)}</div>
            <div className="text-xs text-[var(--text-tertiary)] font-medium">{flight.origin}</div>
          </div>

          {/* Route line with animated dot */}
          <div className="flex-1 flex flex-col items-center gap-1 px-1">
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">{formatDuration(flight.durationMinutes)}</div>
            <div className="stops-line w-full">
              <div className={`line-bg ${flight.stops === 0 ? "nonstop" : "has-stops"}`} />
              <div className="travel-dot" />
              {flight.stops > 0 && <div className="stop-dot" />}
            </div>
            <div className="text-[10px] font-medium">
              {flight.stops === 0 ? (
                <span className="text-[var(--color-savings)]">Non-stop</span>
              ) : (
                <span className="text-[var(--fare-average)]">
                  {flight.stops} stop{flight.stops > 1 ? "s" : ""}
                  {flight.stopCities.length > 0 && (
                    <span className="text-[var(--text-tertiary)]"> via {flight.stopCities.join(", ")}</span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="text-center shrink-0">
            <div className="text-lg sm:text-xl font-bold tabular-nums">{formatTime(flight.arrivalTime)}</div>
            <div className="text-xs text-[var(--text-tertiary)] font-medium">{flight.destination}</div>
          </div>
        </div>

        {/* Badges */}
        <div className="hidden sm:flex flex-col gap-1 shrink-0 w-28">
          {flight.baggage.checked.included && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
              <Luggage className="w-3 h-3" /><span>{flight.baggage.checked.weight || 15}kg bag</span>
            </div>
          )}
          {flight.refundable && <div className="text-[10px] text-[var(--color-savings)]">✓ Refundable</div>}
          {flight.seatsRemaining && flight.seatsRemaining <= 5 && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] text-[var(--fare-expensive)] font-medium"
            >
              {flight.seatsRemaining} seats left
            </motion.div>
          )}
        </div>

        {/* Price + Book */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0 sm:w-36 sm:text-right border-t sm:border-t-0 sm:border-l border-[var(--border-primary)] pt-3 sm:pt-0 sm:pl-4">
          <div>
            <motion.div
              initial={isCheapest ? { scale: 1.1 } : {}}
              animate={isCheapest ? { scale: [1.1, 1] } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`text-xl sm:text-2xl font-bold ${isCheapest ? "text-[var(--color-savings-light)] animate-price-flash" : "text-[var(--text-primary)]"}`}
            >
              {formatPrice(flight.price)}
            </motion.div>
            <div className="text-xs text-[var(--text-tertiary)]">per person</div>
          </div>
          <motion.a
            href={flight.bookingUrl || flight.deepLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-1.5 whitespace-nowrap"
          >
            Book <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Sort Bar ───────────────────────────────────────── */
function SortBar({ sortBy, onSort, totalResults }: { sortBy: SortOption; onSort: (s: SortOption) => void; totalResults: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-between mb-4 flex-wrap gap-2"
    >
      <div className="text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">{totalResults}</strong> flights found
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {SORT_OPTIONS.map((opt) => (
          <motion.button
            key={opt.value}
            onClick={() => onSort(opt.value as SortOption)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`sort-pill ${sortBy === opt.value ? "active" : ""}`}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Filter Panel ───────────────────────────────────── */
function FilterPanel({ flights, onFilter, show, onClose }: {
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

  // Desktop filter sidebar
  const FilterContent = () => (
    <>
      {/* Stops */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">Stops</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { val: null, label: "Any" },
            { val: 0, label: "Non-stop" },
            { val: 1, label: "1 Stop" },
            { val: 2, label: "2+ Stops" },
          ].map(({ val, label }) => (
            <motion.button
              key={label}
              onClick={() => setMaxStops(val)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                maxStops === val
                  ? "border-[var(--color-primary)] bg-[rgba(255,107,0,0.1)] text-[var(--color-primary)]"
                  : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Airlines */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">Airlines</h4>
        <div className="space-y-2">
          {airlines.map(([code, count]) => {
            const info = AIRLINES[code];
            return (
              <label key={code} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={selectedAirlines.length === 0 || selectedAirlines.includes(code)} onChange={() => toggleAirline(code)} className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-surface)] accent-[var(--color-primary)]" />
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: info?.color || "#6B7280" }} />
                <span className="text-sm flex-1 group-hover:text-[var(--text-primary)]">{info?.name || code}</span>
                <span className="text-xs text-[var(--text-tertiary)]">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">Max Price</h4>
        <input type="range" min={0} max={maxPriceInResults} step={500} value={priceMax} onChange={(e) => setPriceMax(parseInt(e.target.value))} className="w-full accent-[var(--color-primary)]" />
        <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
          <span>₹0</span>
          <span className="text-[var(--text-primary)] font-medium">{formatPrice(priceMax)}</span>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setMaxStops(null); setSelectedAirlines([]); setPriceMax(maxPriceInResults); }}
        className="btn-secondary w-full text-sm"
      >
        Reset Filters
      </motion.button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:block w-64 shrink-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <FilterContent />
        </motion.div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] overflow-y-auto p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">Filters</h3>
                <motion.button whileTap={{ rotate: 90 }} onClick={onClose}><X className="w-5 h-5" /></motion.button>
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
            origin: from, destination: to, departureDate: date,
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
        setError(err instanceof Error ? err.message : "Failed to search flights");
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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-40"
      >
        <div className="container-app py-3 flex items-center gap-3">
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="truncate">{originDisplay}</span>
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              </motion.div>
              <span className="truncate">{destDisplay}</span>
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              {" · "}{adults + children + infants} traveller{adults + children + infants > 1 ? "s" : ""}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container-app py-4 sm:py-6">
        <div className="flex gap-6">
          <FilterPanel flights={allFlights} onFilter={handleFilter} show={showFilters} onClose={() => setShowFilters(false)} />

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div>
                <SearchingAnimation />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} delay={i * 0.08} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center"
              >
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                  <AlertCircle className="w-12 h-12 text-[var(--fare-expensive)] mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Search Error</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/")} className="btn-primary">Try Again</motion.button>
              </motion.div>
            ) : sortedFlights.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center"
              >
                <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Plane className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">No Flights Found</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Try different dates, airports, or adjust your filters.</p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/")} className="btn-primary">New Search</motion.button>
              </motion.div>
            ) : (
              <>
                {/* Savings Banner */}
                {sortedFlights.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-4 p-3 rounded-xl bg-[var(--color-savings-bg)] border border-[rgba(16,185,129,0.2)] flex items-center gap-3 overflow-hidden relative"
                  >
                    {/* Shimmer overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <span className="text-lg relative z-10">💰</span>
                    <div className="text-sm relative z-10">
                      <span className="font-semibold text-[var(--color-savings-light)]">
                        Save up to {formatPrice(Math.max(...sortedFlights.map((f) => f.price)) - Math.min(...sortedFlights.map((f) => f.price)))}
                      </span>{" "}
                      <span className="text-[var(--text-secondary)]">by comparing {sortedFlights.length} options</span>
                    </div>
                  </motion.div>
                )}

                <SortBar sortBy={sortBy} onSort={setSortBy} totalResults={sortedFlights.length} />

                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {sortedFlights.map((flight, i) => (
                      <FlightCard key={flight.id} flight={flight} index={i} isCheapest={i === 0} />
                    ))}
                  </div>
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Search Page ────────────────────────────────────── */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-8 h-8 text-[var(--color-primary)]" />
          </motion.div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
