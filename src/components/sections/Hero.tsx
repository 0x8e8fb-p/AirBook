"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import { getPlatformStats } from "@/app/actions/flightActions";
import type { Airport } from "@/lib/types";
import {
  ArrowRightLeft, ChevronDown, X,
  Search, Calendar, CalendarCheck, Users,
  PlaneTakeoff, PlaneLanding,
} from "lucide-react";
import { GlobeCanvas } from "@/components/globe/GlobeCanvas";

/* ================ AIRPORT INPUT ================ */
function AirportInput({
  id, label, value, onChange, placeholder, icon,
}: {
  id: string; label: string; value: string;
  onChange: (iata: string) => void; placeholder: string;
  icon: React.ReactNode;
}) {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const airport = searchAirports(value, 1)[0];
    if (!airport) return value;
    return `${airport.city} (${airport.iata})`;
  }, [value]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const results = searchAirports(q, 6);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  const handleSelect = useCallback((airport: Airport) => {
    onChange(airport.iata);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
        {icon}
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={isFocused ? query : (selectedLabel || query)}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { setIsFocused(true); setQuery(""); if (suggestions.length > 0) setIsOpen(true); }}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="ghost-input w-full text-[15px] font-medium placeholder:text-[var(--text-muted)]/40 truncate py-1 caret-[var(--aurora-gold)] text-[var(--text-primary)]"
        autoComplete="off"
      />
      <div className={`h-px mt-1 transition-all duration-300 ${isFocused ? "bg-[var(--aurora-gold)]/50" : "bg-[var(--glass-border)]"}`} />

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-3 bg-[var(--deep)]/95 border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-lg"
          >
            {suggestions.map((airport) => (
              <button
                key={airport.iata}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--aurora-gold)]/8 transition-colors flex items-center gap-3 border-b border-[var(--glass-border)]/50 last:border-0"
              >
                <span className="text-[11px] font-mono font-semibold text-[var(--aurora-gold)] w-10">{airport.iata}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{airport.city}</div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{airport.name}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================ SEARCH PANEL ================ */
function SearchPanel() {
  const router = useRouter();
  const {
    origin, destination, departureDate, returnDate,
    adults, children: childCount, infants,
    setOrigin, setDestination, swapAirports, setDepartureDate,
    setReturnDate, setPassengers, isSearching, setSearching,
  } = useSearchStore();

  const [tripType, setTripType] = useState<"one-way" | "round" | "multi">("one-way");
  const [showPassengers, setShowPassengers] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => { setSearching(false); }, [setSearching]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (passRef.current && !passRef.current.contains(e.target as Node)) setShowPassengers(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) return;
    setSearching(true);
    const params = new URLSearchParams({
      from: origin, to: destination, date: departureDate,
      ...(returnDate && tripType === "round" && { return: returnDate }),
      adults: adults.toString(), children: childCount.toString(),
      infants: infants.toString(),
    });
    router.push(`/search?${params.toString()}`);
  };

  const totalTravellers = adults + childCount + infants;

  const handleSwap = () => {
    setIsSwapping(true);
    swapAirports();
    setTimeout(() => setIsSwapping(false), 300);
  };

  return (
    <div id="search-card" className="glass-card rounded-[var(--radius-xl)] p-5 md:p-6 w-full">
      {/* Trip type tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-[var(--radius-md)] p-1 w-fit">
        {(["one-way", "round", "multi"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTripType(t)}
            className={`px-4 py-1.5 rounded-[calc(var(--radius-md)-2px)] text-[13px] font-medium transition-all ${
              tripType === t
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {t === "one-way" ? "One Way" : t === "round" ? "Round Trip" : "Multi-City"}
          </button>
        ))}
      </div>

      {/* Main search row */}
      <div className="flex flex-col gap-3">
        {/* Origin / Destination */}
        <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0 relative">
          <AirportInput
            id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi"
            icon={<PlaneTakeoff className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />}
          />
          <div className="flex items-center justify-center md:px-3 z-10">
            <button
              onClick={handleSwap}
              className="w-9 h-9 rounded-full border border-[var(--glass-border)] bg-[var(--surface)] flex items-center justify-center shrink-0 hover:bg-[var(--aurora-gold)] hover:text-[var(--text-inverse)] hover:border-[var(--aurora-gold)] transition-all active:scale-95 group"
              aria-label="Swap airports"
            >
              <motion.div
                animate={{ rotate: isSwapping ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-inverse)] transition-colors" />
              </motion.div>
            </button>
          </div>
          <AirportInput
            id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai"
            icon={<PlaneLanding className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />}
          />
        </div>

        <div className="h-px bg-[var(--glass-border)]/50" />

        {/* Date + Passengers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dep-date" className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />
              Depart
            </label>
            <input
              id="dep-date"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="ghost-input w-full text-[15px] font-medium py-1 [color-scheme:dark] cursor-pointer text-[var(--text-primary)]"
            />
            <div className="h-px mt-1 bg-[var(--glass-border)]" />
          </div>

          <div>
            <label htmlFor="ret-date" className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
              <CalendarCheck className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />
              Return
              <span className="text-[var(--text-muted)]/50 ml-1 normal-case tracking-normal">(optional)</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="ret-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || new Date().toISOString().split("T")[0]}
                className="ghost-input w-full text-[15px] font-medium py-1 [color-scheme:dark] cursor-pointer text-[var(--text-primary)]"
              />
              {returnDate && (
                <button
                  onClick={() => setReturnDate("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--aurora-gold)]/10 transition-colors"
                  aria-label="Clear return date"
                  type="button"
                >
                  <X className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
              )}
            </div>
            <div className="h-px mt-1 bg-[var(--glass-border)]" />
          </div>

          <div ref={passRef} className="relative">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
              <Users className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />
              Travellers
            </label>
            <button
              onClick={() => setShowPassengers(!showPassengers)}
              className="w-full bg-transparent border-none outline-none text-[15px] font-medium py-1 text-left flex items-center gap-2 cursor-pointer text-[var(--text-primary)]"
            >
              <span>{totalTravellers} {totalTravellers === 1 ? "Traveller" : "Travellers"}</span>
              <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${showPassengers ? "rotate-180" : ""}`} />
            </button>
            <div className="h-px mt-1 bg-[var(--glass-border)]" />

            <AnimatePresence>
              {showPassengers && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 right-0 left-0 top-full mt-2 bg-[var(--deep)]/95 border border-[var(--glass-border)] rounded-[var(--radius-lg)] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-lg"
                >
                  {[
                    { label: "Adults", sub: "12+", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                    { label: "Children", sub: "2-11", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                    { label: "Infants", sub: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
                  ].map(({ label, sub, val, set, min, max }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-[var(--glass-border)]/50 last:border-0">
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{sub}</div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-7 h-7 rounded-full border border-[var(--glass-border)] flex items-center justify-center disabled:opacity-20 text-xs hover:bg-[var(--aurora-gold)]/10 transition-colors text-[var(--text-primary)]">-</button>
                        <span className="w-4 text-center font-mono text-sm">{val}</span>
                        <button onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-7 h-7 rounded-full border border-[var(--glass-border)] flex items-center justify-center disabled:opacity-20 text-xs hover:bg-[var(--aurora-gold)]/10 transition-colors text-[var(--text-primary)]">+</button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-2">
          <button
            onClick={handleSearch}
            disabled={!origin || !destination || !departureDate || isSearching}
            className="w-full py-3.5 bg-gradient-to-r from-[var(--aurora-gold)] to-[var(--aurora-gold-dim)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:shadow-[var(--glow-gold)] disabled:opacity-30 transition-all flex items-center justify-center gap-2 text-[15px] active:scale-[0.99]"
          >
            {isSearching ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Searching...</>
            ) : (
              <><Search className="w-4 h-4" />Search Flights</>
            )}
          </button>
        </div>

        {/* Recent searches */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Recent:</span>
          {["DEL → BOM", "BLR → HYD", "CCU → DEL"].map((route) => (
            <button
              key={route}
              className="px-2.5 py-1 rounded-full border border-[var(--glass-border)] text-[12px] text-[var(--text-secondary)] font-[family-name:var(--font-data)] hover:border-[var(--aurora-gold)] hover:text-[var(--aurora-gold)] hover:bg-[var(--aurora-gold)]/8 transition-all"
            >
              {route}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================ STATS COUNTER ================ */
function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const duration = 2500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{prefix}{count.toLocaleString("en-IN")}</>;
}

/* ================ HERO SECTION ================ */
export function HeroSection() {
  const [stats, setStats] = useState({ searchesToday: 0, moneySavedMonth: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    getPlatformStats().then(data => {
      setStats({ searchesToday: data.searchesToday, moneySavedMonth: data.moneySavedMonth });
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));

    // Trigger animations after mount
    const timer = setTimeout(() => setHasAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="hero" className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-[var(--void)]">
      {/* Globe background - positioned with right bias */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-[30%] md:left-[45%] -translate-y-1/2 w-[120vw] md:w-[80vw] aspect-square">
          <GlobeCanvas />
        </div>
      </div>

      {/* Dark gradient overlay - text side */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg, var(--void) 0%, var(--void) 35%, transparent 65%),
            linear-gradient(to bottom, var(--void) 0%, transparent 15%, transparent 70%, var(--void) 100%)
          `,
        }}
      />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--void)] to-transparent z-[1] pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-[5] flex flex-col justify-center flex-1 px-4 sm:px-6 lg:px-12 xl:px-16 max-w-[750px]">
        {/* Badge */}
        <div className={`mb-5 transition-all duration-700 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--aurora-teal)]/10 text-[var(--aurora-teal)] border border-[var(--aurora-teal)]/25">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--aurora-teal)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--aurora-teal)]" />
            </span>
            Live: 892 flights tracked
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-5">
          <span className={`block text-[clamp(40px,6vw,80px)] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)] font-[family-name:var(--font-display)] transition-all duration-700 delay-100 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            Find Your
          </span>
          <span className={`block text-[clamp(40px,6vw,80px)] font-bold leading-[1.05] tracking-[-0.03em] font-[family-name:var(--font-display)] transition-all duration-700 delay-200 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <em className="text-[var(--aurora-gold)] italic">Perfect</em> Flight
          </span>
          <span className={`block text-[clamp(40px,6vw,80px)] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)] font-[family-name:var(--font-display)] transition-all duration-700 delay-300 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            At The Best Price
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`text-[clamp(15px,1.8vw,18px)] text-[var(--text-secondary)] leading-relaxed mb-8 max-w-[480px] transition-all duration-700 delay-400 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          Real-time fares across 6 Indian OTAs. ML-powered price predictions.
          Verified bank offers. One API.
        </p>

        {/* Search panel */}
        <div className={`w-full max-w-[700px] mb-8 transition-all duration-700 delay-500 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <SearchPanel />
        </div>

        {/* Stats */}
        <div className={`flex items-center gap-6 md:gap-8 transition-all duration-700 delay-600 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <div className="text-center">
            <span className="block text-[22px] md:text-[26px] font-semibold text-[var(--aurora-gold)] font-[family-name:var(--font-data)] leading-none mb-1">
              <AnimatedCounter value={6} />
            </span>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.08em]">OTAs Compared</span>
          </div>
          <div className="w-px h-8 bg-[var(--mist)]" />
          <div className="text-center">
            <span className="block text-[22px] md:text-[26px] font-semibold text-[var(--aurora-gold)] font-[family-name:var(--font-data)] leading-none mb-1">
              <AnimatedCounter value={450} />
            </span>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.08em]">Indian Airports</span>
          </div>
          <div className="w-px h-8 bg-[var(--mist)]" />
          <div className="text-center">
            <span className="block text-[22px] md:text-[26px] font-semibold text-[var(--aurora-gold)] font-[family-name:var(--font-data)] leading-none mb-1">
              ₹<AnimatedCounter value={1200} />
            </span>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.08em]">Avg. Savings</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[5] flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${hasAnimated ? "opacity-100" : "opacity-0"}`}>
        <div
          className="w-px h-12"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--aurora-gold))",
            animation: "scrollPulse 2s ease-in-out infinite",
          }}
        />
        <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-muted)]">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
