"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import type { FlightResult, SortOption, CabinClass } from "@/lib/types";
import { sortFlights } from "@/lib/api/search-orchestrator";
import { getAirportDisplay, getAirport } from "@/lib/airports";
import {
  AIRLINES,
  SORT_OPTIONS,
  formatPrice,
  formatDuration,
  formatTime,
} from "@/lib/constants";
import {
  Plane,
  ArrowLeft,
  ArrowRight,
  Clock,
  Luggage,
  Filter,
  SlidersHorizontal,
  X,
  Wifi,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";

/* ─── Skeleton Card ──────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="flight-card animate-pulse">
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
    </div>
  );
}

/* ─── Flight Result Card ─────────────────────────────── */
function FlightCard({
  flight,
  index,
}: {
  flight: FlightResult;
  index: number;
}) {
  const airlineInfo = AIRLINES[flight.airline];
  const isCheapest = index === 0;

  return (
    <div
      className="flight-card group relative"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Cheapest badge */}
      {isCheapest && (
        <div className="absolute -top-3 left-4 badge badge-savings text-[11px]">
          🏆 Cheapest
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Airline Info */}
        <div className="flex items-center gap-3 sm:w-44 shrink-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{
              backgroundColor: airlineInfo?.color || "#4B5563",
            }}
          >
            {flight.airline}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {flight.airlineName}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {flight.flightNumber}
            </div>
          </div>
        </div>

        {/* Flight Timeline */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Departure */}
          <div className="text-center shrink-0">
            <div className="text-lg sm:text-xl font-bold tabular-nums">
              {formatTime(flight.departureTime)}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] font-medium">
              {flight.origin}
            </div>
          </div>

          {/* Route Line */}
          <div className="flex-1 flex flex-col items-center gap-1 px-1">
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">
              {formatDuration(flight.durationMinutes)}
            </div>
            <div className="w-full relative h-[2px]">
              <div
                className={`w-full h-full rounded-full ${
                  flight.stops === 0
                    ? "bg-[var(--color-savings)]"
                    : "bg-[var(--border-primary)]"
                }`}
              />
              {flight.stops > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-[var(--color-primary)] bg-[var(--bg-surface)]" />
              )}
            </div>
            <div className="text-[10px] font-medium">
              {flight.stops === 0 ? (
                <span className="text-[var(--color-savings)]">Non-stop</span>
              ) : (
                <span className="text-[var(--fare-average)]">
                  {flight.stops} stop
                  {flight.stops > 1 ? "s" : ""}
                  {flight.stopCities.length > 0 && (
                    <span className="text-[var(--text-tertiary)]">
                      {" "}
                      via {flight.stopCities.join(", ")}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center shrink-0">
            <div className="text-lg sm:text-xl font-bold tabular-nums">
              {formatTime(flight.arrivalTime)}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] font-medium">
              {flight.destination}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="hidden sm:flex flex-col gap-1 shrink-0 w-28">
          {flight.baggage.checked.included && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
              <Luggage className="w-3 h-3" />
              <span>
                {flight.baggage.checked.weight || 15}kg bag
              </span>
            </div>
          )}
          {flight.refundable && (
            <div className="text-[10px] text-[var(--color-savings)]">
              ✓ Refundable
            </div>
          )}
          {flight.seatsRemaining && flight.seatsRemaining <= 5 && (
            <div className="text-[10px] text-[var(--fare-expensive)] font-medium">
              {flight.seatsRemaining} seats left
            </div>
          )}
        </div>

        {/* Price + Book */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0 sm:w-36 sm:text-right border-t sm:border-t-0 sm:border-l border-[var(--border-primary)] pt-3 sm:pt-0 sm:pl-4">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {formatPrice(flight.price)}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              per person
            </div>
          </div>
          <a
            href={flight.bookingUrl || flight.deepLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-1.5 whitespace-nowrap"
          >
            Book
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Sort Bar ───────────────────────────────────────── */
function SortBar({
  sortBy,
  onSort,
  totalResults,
}: {
  sortBy: SortOption;
  onSort: (s: SortOption) => void;
  totalResults: number;
}) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div className="text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">{totalResults}</strong>{" "}
        flights found
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSort(opt.value as SortOption)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              sortBy === opt.value
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
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

  // Get unique airlines from results
  const airlines = useMemo(() => {
    const map = new Map<string, number>();
    flights.forEach((f) => {
      map.set(f.airline, (map.get(f.airline) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [flights]);

  const maxPriceInResults = useMemo(
    () => Math.max(...flights.map((f) => f.price), 10000),
    [flights]
  );

  useEffect(() => {
    setPriceMax(maxPriceInResults);
  }, [maxPriceInResults]);

  // Apply filters
  useEffect(() => {
    let filtered = [...flights];

    if (maxStops !== null) {
      filtered = filtered.filter((f) => f.stops <= maxStops);
    }
    if (selectedAirlines.length > 0) {
      filtered = filtered.filter((f) =>
        selectedAirlines.includes(f.airline)
      );
    }
    if (priceMax < maxPriceInResults) {
      filtered = filtered.filter((f) => f.price <= priceMax);
    }

    onFilter(filtered);
  }, [maxStops, selectedAirlines, priceMax, flights, maxPriceInResults, onFilter]);

  const toggleAirline = (code: string) => {
    setSelectedAirlines((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 sm:static sm:inset-auto">
      {/* Overlay for mobile */}
      <div
        className="absolute inset-0 bg-black/60 sm:hidden"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-full sm:static bg-[var(--bg-primary)] sm:bg-transparent border-l sm:border-l-0 border-[var(--border-primary)] overflow-y-auto p-5 sm:p-0 animate-slide-up sm:animate-none">
        {/* Mobile close */}
        <div className="flex items-center justify-between mb-5 sm:hidden">
          <h3 className="font-bold text-lg">Filters</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stops */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">
            Stops
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { val: null, label: "Any" },
              { val: 0, label: "Non-stop" },
              { val: 1, label: "1 Stop" },
              { val: 2, label: "2+ Stops" },
            ].map(({ val, label }) => (
              <button
                key={label}
                onClick={() => setMaxStops(val)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  maxStops === val
                    ? "border-[var(--color-primary)] bg-[rgba(255,107,0,0.1)] text-[var(--color-primary)]"
                    : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Airlines */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">
            Airlines
          </h4>
          <div className="space-y-2">
            {airlines.map(([code, count]) => {
              const info = AIRLINES[code];
              return (
                <label
                  key={code}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedAirlines.length === 0 ||
                      selectedAirlines.includes(code)
                    }
                    onChange={() => toggleAirline(code)}
                    className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-surface)] accent-[var(--color-primary)]"
                  />
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: info?.color || "#6B7280" }}
                  />
                  <span className="text-sm flex-1 group-hover:text-[var(--text-primary)]">
                    {info?.name || code}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">
            Max Price
          </h4>
          <input
            type="range"
            min={0}
            max={maxPriceInResults}
            step={500}
            value={priceMax}
            onChange={(e) => setPriceMax(parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
            <span>₹0</span>
            <span className="text-[var(--text-primary)] font-medium">
              {formatPrice(priceMax)}
            </span>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setMaxStops(null);
            setSelectedAirlines([]);
            setPriceMax(maxPriceInResults);
          }}
          className="btn-secondary w-full text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
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

  // Set origin/destination in store for potential re-search
  useEffect(() => {
    if (from) setOrigin(from);
    if (to) setDestination(to);
  }, [from, to, setOrigin, setDestination]);

  // Fetch search results
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

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        setAllFlights(data.flights || []);
        setFilteredFlights(data.flights || []);
      } catch (err) {
        console.error("Search error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to search flights"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [from, to, date, returnDate, adults, children, infants, cabin]);

  // Sort when sort option changes
  const sortedFlights = useMemo(
    () => sortFlights(filteredFlights, sortBy),
    [filteredFlights, sortBy]
  );

  const handleFilter = useCallback((filtered: FlightResult[]) => {
    setFilteredFlights(filtered);
  }, []);

  const originDisplay = getAirportDisplay(from);
  const destDisplay = getAirportDisplay(to);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-40">
        <div className="container-app py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="truncate">{originDisplay}</span>
              <ArrowRight className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span className="truncate">{destDisplay}</span>
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {new Date(date).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {" · "}
              {adults + children + infants} traveller
              {adults + children + infants > 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors relative"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="container-app py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters (desktop) */}
          <aside className="hidden sm:block w-64 shrink-0">
            <FilterPanel
              flights={allFlights}
              onFilter={handleFilter}
              show={true}
              onClose={() => {}}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          <FilterPanel
            flights={allFlights}
            onFilter={handleFilter}
            show={showFilters}
            onClose={() => setShowFilters(false)}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div>
                <div className="flex items-center gap-3 mb-6 p-4 glass-card">
                  <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Searching across airlines and OTAs...
                  </span>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="glass-card p-8 text-center">
                <AlertCircle className="w-12 h-12 text-[var(--fare-expensive)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Search Error</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {error}
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            ) : sortedFlights.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Plane className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Flights Found
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Try different dates, airports, or adjust your filters.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="btn-primary"
                >
                  New Search
                </button>
              </div>
            ) : (
              <>
                {/* Savings banner */}
                {sortedFlights.length > 1 && (
                  <div className="mb-4 p-3 rounded-xl bg-[var(--color-savings-bg)] border border-[rgba(16,185,129,0.2)] flex items-center gap-3">
                    <span className="text-lg">💰</span>
                    <div className="text-sm">
                      <span className="font-semibold text-[var(--color-savings-light)]">
                        Save up to{" "}
                        {formatPrice(
                          Math.max(...sortedFlights.map((f) => f.price)) -
                            Math.min(...sortedFlights.map((f) => f.price))
                        )}
                      </span>{" "}
                      <span className="text-[var(--text-secondary)]">
                        by comparing {sortedFlights.length} options
                      </span>
                    </div>
                  </div>
                )}

                <SortBar
                  sortBy={sortBy}
                  onSort={setSortBy}
                  totalResults={sortedFlights.length}
                />

                <div className="space-y-3 stagger-children">
                  {sortedFlights.map((flight, i) => (
                    <FlightCard key={flight.id} flight={flight} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Search Page (Suspense wrapper) ─────────────────── */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
