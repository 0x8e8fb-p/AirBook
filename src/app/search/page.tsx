"use client";

import { useEffect, useState, useMemo, useCallback, Suspense, useRef } from "react";
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

import { MagneticButton } from "@/components/ui/MagneticButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { gsap } from "@/lib/gsap";

/* ─── Loading Animation ──── */
function SearchingAnimation() {
  return (
    <GlassCard className="p-8 mb-6 overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative w-20 h-20 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-white/10 border-t-[var(--color-accent-cyan)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-8 h-8 text-[var(--color-accent-cyan)] -rotate-45" />
          </motion.div>
        </div>
      </div>
      <h3 className="text-xl font-bold font-display mb-2">Analyzing Vectors</h3>
      <p className="text-sm text-white/50 text-center font-mono">Comparing millions of potential itineraries...</p>
    </GlassCard>
  );
}

/* ─── Skeleton Loader ────────────────────────────────── */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-3 flex flex-col sm:flex-row gap-4 animate-pulse relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      <div className="flex items-center gap-3 sm:w-44">
        <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-3 bg-white/10 rounded w-16" />
        </div>
      </div>
      <div className="flex-1 flex items-center gap-4">
        <div className="w-12 h-6 bg-white/10 rounded shrink-0" />
        <div className="flex-1 h-0.5 bg-white/10 rounded" />
        <div className="w-12 h-6 bg-white/10 rounded shrink-0" />
      </div>
      <div className="sm:w-36 flex flex-col items-end gap-2 pr-2">
        <div className="h-6 bg-white/10 rounded w-24" />
        <div className="h-10 bg-white/10 rounded w-full mt-2" />
      </div>
    </motion.div>
  );
}

/* ─── Flight Result Card (using GSAP 3D inside) ──────── */
function FlightCard({ flight, index, isCheapest }: { flight: FlightResult; index: number; isCheapest: boolean }) {
  const router = useRouter();
  const airlineInfo = AIRLINES[flight.airline];
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll stagger entry using GSAP
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 40, rotateX: 8 },
        {
          opacity: 1, y: 0, rotateX: 0,
          duration: 0.8,
          delay: Math.min(index * 0.1, 0.4),
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top bottom-=50",
            toggleActions: "play none none none"
          }
        }
      );
    }
  }, [index]);

  return (
    <div ref={cardRef}>
      <GlassCard className={`p-5 group cursor-pointer ${isCheapest ? "border-[var(--color-accent-amber)]/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : "border-white/10"}`}>
        {/* Cheapest badge wrapping animated property for border rotation trick */}
        <AnimatePresence>
          {isCheapest && (
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="absolute -top-3 left-6 bg-[var(--color-accent-amber)] text-black px-3 py-0.5 rounded-full text-xs font-bold font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10"
            >
              Top Pick
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
          
          {/* Airline */}
          <div className="flex items-center gap-4 sm:w-48 shrink-0">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg"
              style={{ backgroundColor: airlineInfo?.color || "#4B5563" }}
            >
              {flight.airline}
            </motion.div>
            <div className="min-w-0">
              <div className="text-base font-bold truncate">{flight.airlineName}</div>
              <div className="text-xs text-white/50 font-mono mt-1">{flight.flightNumber}</div>
            </div>
          </div>

          {/* Timeline visualization */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 px-2 sm:px-6">
            <div className="text-center shrink-0">
              <div className="text-xl sm:text-2xl font-bold font-mono">{formatTime(flight.departureTime)}</div>
              <div className="text-xs text-[var(--color-accent-cyan)] font-bold tracking-widest uppercase mt-1">{flight.origin}</div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1.5 px-2">
              <div className="text-[10px] text-white/50 font-mono uppercase tracking-widest">{formatDuration(flight.durationMinutes)}</div>
              <div className="w-full relative h-[2px] bg-white/10 flex items-center justify-between">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)]" />
                {flight.stops > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-amber)]" />}
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-violet)]" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider mt-1">
                {flight.stops === 0 ? (
                  <span className="text-[var(--color-accent-cyan)]">Direct Sequence</span>
                ) : (
                  <span className="text-[var(--color-accent-amber)]">
                    {flight.stops} Stop{flight.stops > 1 ? "s" : ""}
                    {flight.stopCities.length > 0 && <span className="text-white/40"> via {flight.stopCities.join(", ")}</span>}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className="text-xl sm:text-2xl font-bold font-mono">{formatTime(flight.arrivalTime)}</div>
              <div className="text-xs text-[var(--color-accent-violet)] font-bold tracking-widest uppercase mt-1">{flight.destination}</div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="sm:w-48 flex flex-col sm:items-end justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
            <div className="flex flex-col sm:items-end mb-4">
              <div className="text-[10px] text-white/50 uppercase tracking-widest">Effective Fare</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">
                <PriceTicker value={flight.price} prefix="₹" duration={0.8} />
              </div>
            </div>

            <MagneticButton
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/checkout?id=${flight.id}`);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-300"
            >
              Select <ExternalLink className="w-4 h-4 opacity-50" />
            </MagneticButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Sort Bar ───────────────────────────────────────── */
function SortBar({ sortBy, onSort, totalResults }: { sortBy: SortOption; onSort: (v: SortOption) => void; totalResults: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-between mb-6 flex-wrap gap-4"
    >
      <div className="text-sm font-mono text-white/50 tracking-wide">
        <strong className="text-white text-base">{totalResults}</strong> TRAJECTORIES FOUND
      </div>
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-white/5 rounded-xl border border-white/10 p-1">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSort(opt.value as SortOption)}
              className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${isActive ? "text-black" : "text-white/60 hover:text-white"}`}
            >
              {isActive && (
                <motion.div
                  layoutId="sortIndicator"
                  className="absolute inset-0 bg-[var(--color-accent-cyan)] rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </motion.div>
  );
}

/* ─── Filter Panel ───────────────────────────────────── */
function FilterPanel({ flights, onFilter, show, onClose }: { flights: FlightResult[]; onFilter: (filtered: FlightResult[]) => void; show: boolean; onClose: () => void; }) {
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
        <h4 className="text-xs font-bold mb-4 text-[var(--color-accent-cyan)] uppercase tracking-[0.2em]">Stops</h4>
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
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  active 
                    ? "bg-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)] text-black shadow-[0_0_10px_rgba(0,229,255,0.3)]" 
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Airlines */}
      <div className="mb-8">
        <h4 className="text-xs font-bold mb-4 text-[var(--color-accent-cyan)] uppercase tracking-[0.2em]">Airlines</h4>
        <div className="space-y-1">
          {airlines.map(([code, count]) => {
            const info = AIRLINES[code];
            const active = selectedAirlines.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleAirline(code)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    active ? "bg-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)]" : "border-white/20 bg-black/20 group-hover:border-white/50"
                  }`}>
                    {active && <span className="text-[10px] text-black">✓</span>}
                  </div>
                  <span className="text-sm font-medium text-white/90">{info?.name || code}</span>
                </div>
                <span className="text-xs text-white/40 font-mono">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => { setMaxStops(null); setSelectedAirlines([]); setPriceMax(maxPriceInResults); }}
        className="text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white w-full text-center py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
      >
        Reset Filters
      </button>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <GlassCard className="p-6 sticky top-24">
            <FilterContent />
          </GlassCard>
        </motion.div>
      </aside>

      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-[#080C14] border-l border-white/10 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-xl tracking-wide">Radar Filters</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
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
        if (!response.ok) throw new Error(`Search sequence failed: ${response.statusText}`);
        const data = await response.json();
        setAllFlights(data.flights || []);
        setFilteredFlights(data.flights || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to establish visual connections");
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
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pb-20">
      {/* Cinematic Header Overlay */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-black/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40"
      >
        <div className="container-app py-4 flex items-center gap-4">
          <MagneticButton
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full border border-white/20 hover:border-white/50 flex items-center justify-center shrink-0 bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </MagneticButton>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-lg font-bold font-display uppercase tracking-wide">
              <span className="truncate text-[var(--color-accent-cyan)]">{originDisplay}</span>
              <motion.div animate={{ x: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <ArrowRight className="w-5 h-5 text-white/30 shrink-0" />
              </motion.div>
              <span className="truncate text-[var(--color-accent-violet)]">{destDisplay}</span>
            </div>
            <div className="text-xs text-white/50 font-mono tracking-widest mt-1">
              {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              {" · "}{adults + children + infants} SEAT{adults + children + infants > 1 ? "S" : ""}
            </div>
          </div>

          <MagneticButton
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-3 rounded-lg border border-white/20 bg-white/5 hover:border-[var(--color-accent-cyan)]"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </MagneticButton>
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
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} delay={i * 0.1} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto">
                <GlassCard className="p-10 text-center flex flex-col items-center">
                  <AlertCircle className="w-16 h-16 text-[var(--color-accent-amber)] mb-6" />
                  <h3 className="text-2xl font-bold font-display tracking-wide mb-3">System Anomaly</h3>
                  <p className="text-white/50 mb-8 max-w-md mx-auto">{error}</p>
                  <MagneticButton onClick={() => router.push("/")} className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold border border-white/20">Reinitialize Search</MagneticButton>
                </GlassCard>
              </motion.div>
            ) : sortedFlights.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto">
                <GlassCard className="p-10 text-center flex flex-col items-center">
                  <Plane className="w-16 h-16 text-white/20 mb-6" />
                  <h3 className="text-2xl font-bold font-display tracking-wide mb-3">Void Space Detected</h3>
                  <p className="text-white/50 mb-8 max-w-md mx-auto">No orbital vectors available for these parameters. Try adjusting filters or dates.</p>
                  <MagneticButton onClick={() => router.push("/")} className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold border border-white/20">New Search</MagneticButton>
                </GlassCard>
              </motion.div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Visual Savings Bar */}
                {sortedFlights.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 p-4 rounded-xl backdrop-blur-md bg-gradient-to-r from-[var(--color-accent-amber)]/20 to-transparent border border-[var(--color-accent-amber)]/30 flex items-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent-amber)]/20 flex items-center justify-center shrink-0">
                      <span className="text-xl">✨</span>
                    </div>
                    <div className="flex flex-col relative z-10">
                      <span className="text-xl font-bold font-mono text-[var(--color-accent-amber)] shadow-sm">
                        Max differential: <PriceTicker value={Math.max(...sortedFlights.map((f) => f.price)) - Math.min(...sortedFlights.map((f) => f.price))} prefix="₹" duration={1.5} />
                      </span>
                      <span className="text-xs text-white/60 tracking-widest uppercase">Between lowest and highest vectors</span>
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
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#080C14] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--color-accent-cyan)] animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
