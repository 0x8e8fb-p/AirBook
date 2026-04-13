"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";
import { POPULAR_ROUTES, formatPrice, AIRLINES } from "@/lib/constants";
import {
  Search, ArrowRightLeft, Plane, Calendar, Users, ChevronDown,
  Sparkles, TrendingDown, Zap, Shield, MapPin, ArrowRight,
  Globe, CreditCard, Bell
} from "lucide-react";

import { MagneticButton } from "@/components/ui/MagneticButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { AnimatedText } from "@/components/ui/AnimatedText";

// Dynamically import Three.js scene to avoid SSR mismatch
const ParticleBackground = dynamic(() => import("@/components/ui/ParticleBackground"), {
  ssr: false,
});

/* ================================================================
   TYPEWRITER SYNC TRIGGER — Cycles through taglines with GSAP text
   ================================================================ */
const TAGLINES = [
  "Global flight discovery.",
  "Uncover hidden fare deals.",
  "Every flight. One search.",
];

function CyclingHeroText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TAGLINES.length);
    }, 4500); // give GSAP time to run in AnimatedText
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[120px] flex items-center justify-center relative w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <AnimatedText 
            text={TAGLINES[index]} 
            staggerDelay={0.05} 
            className="text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tighter text-center" 
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   AIRPORT AUTOCOMPLETE
   ================================================================ */
function AirportInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (iata: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const airport = searchAirports(value, 1)[0];
      if (airport) setDisplayValue(`${airport.city} (${airport.iata})`);
    }
  }, [value]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setDisplayValue(q);
    if (q.length >= 1) {
      const results = searchAirports(q, 8);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  const handleSelect = useCallback(
    (airport: Airport) => {
      onChange(airport.iata);
      setDisplayValue(`${airport.city} (${airport.iata})`);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[color:var(--color-accent-cyan)] mb-2 uppercase tracking-[0.2em]"
      >
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            setDisplayValue("");
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-white/20 pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors placeholder:text-white/20 truncate"
          autoComplete="off"
        />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 w-full mt-4 backdrop-blur-xl bg-[var(--color-bg)]/80 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {suggestions.map((airport, i) => (
              <motion.button
                key={airport.iata}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/30 flex items-center justify-center text-[var(--color-accent-cyan)] font-mono text-sm tracking-wide">
                  {airport.iata}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate">
                    {airport.city}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {airport.name}
                  </div>
                </div>
                {airport.country !== "IN" && (
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
                    {airport.country}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   SEARCH BAR — Velocity Re-design
   ================================================================ */
function SearchBar() {
  const router = useRouter();
  const {
    origin, destination, departureDate, returnDate,
    adults, children: childCount, infants, cabinClass,
    setOrigin, setDestination, swapAirports, setDepartureDate,
    setReturnDate, setPassengers, isSearching, setSearching,
  } = useSearchStore();

  useEffect(() => {
    setSearching(false);
  }, [setSearching]);

  const [showPassengers, setShowPassengers] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    // Uses GSAP flipping visually via layout swaps logic but we handle standard data swap for now
    swapAirports();
    setTimeout(() => setIsSwapping(false), 500);
  };

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) return;
    setSearching(true);
    const params = new URLSearchParams({
      from: origin, to: destination, date: departureDate,
      ...(returnDate && { return: returnDate }),
      adults: adults.toString(), children: childCount.toString(),
      infants: infants.toString(), cabin: cabinClass,
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <GlassCard className="p-6 md:p-8 w-full max-w-5xl mx-auto z-20">
      <div className="flex flex-col md:flex-row items-stretch gap-8 mb-8 relative">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi, DEL" />

        <div className="flex items-center justify-center -my-4 md:-mx-4 md:my-0 z-10">
          <MagneticButton
            onClick={handleSwap}
            className="w-14 h-14 rounded-full border border-[var(--color-accent-cyan)]/30 bg-[var(--color-bg)] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:border-[var(--color-accent-cyan)] transition-colors"
          >
            <motion.div animate={isSwapping ? { rotate: 180, scale: 1.1 } : { rotate: 0, scale: 1 }} transition={{ type: "spring" }}>
              <ArrowRightLeft className="w-6 h-6 text-[var(--color-accent-cyan)]" />
            </motion.div>
          </MagneticButton>
        </div>

        <AirportInput id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai, BOM" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
          <label htmlFor="departure-date" className="block text-xs font-semibold text-[color:var(--color-accent-cyan)] mb-2 uppercase tracking-[0.2em]">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input id="departure-date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full bg-transparent border-b border-white/20 pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer" min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="return-date" className="block text-xs font-semibold text-[color:var(--color-accent-cyan)] mb-2 uppercase tracking-[0.2em]">Return</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full bg-transparent border-b border-white/20 pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer placeholder:text-white/20" placeholder="Optional" min={departureDate} />
          </div>
        </div>

        <div className="relative flex-1">
          <label className="block text-xs font-semibold text-[color:var(--color-accent-cyan)] mb-2 uppercase tracking-[0.2em]">Travellers</label>
          <button onClick={() => setShowPassengers(!showPassengers)} className="w-full bg-transparent border-b border-white/20 pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors text-left flex items-center justify-between">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <span className="truncate pr-4">{adults + childCount + infants} <span className="font-medium opacity-60 text-lg">Seat(s)</span></span>
            <motion.div animate={{ rotate: showPassengers ? 180 : 0 }} className="absolute right-0 top-1/2 -translate-y-1/2">
              <ChevronDown className="w-5 h-5 text-white/40" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showPassengers && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-50 right-0 left-0 top-full mt-4 backdrop-blur-xl bg-[var(--color-bg)]/80 border border-white/10 rounded-xl p-5 shadow-2xl origin-top"
              >
                {[
                  { label: "Adults", sub: "12+ years", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                  { label: "Children", sub: "2-11 years", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                  { label: "Infants", sub: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
                ].map(({ label, sub, val, set, min, max }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <div className="font-bold">{label}</div>
                      <div className="text-xs text-white/40 font-mono mt-0.5">{sub}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-8 h-8 rounded border border-white/20 flex items-center justify-center disabled:opacity-30 hover:border-[var(--color-accent-cyan)] transition-colors">−</button>
                      <span className="w-4 text-center font-mono text-lg">{val}</span>
                      <button onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-8 h-8 rounded border border-white/20 flex items-center justify-center disabled:opacity-30 hover:border-[var(--color-accent-cyan)] transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <MagneticButton
        onClick={handleSearch}
        disabled={!origin || !destination || !departureDate || isSearching}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] disabled:opacity-40 rounded-xl py-5"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        <span className="relative z-10 flex items-center justify-center gap-3 text-xl font-bold tracking-wide">
          {isSearching ? "Initializing Search Sequence..." : "EXECUTE SEARCH"}
        </span>
      </MagneticButton>
    </GlassCard>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] relative overflow-hidden font-sans">
      <ParticleBackground />
      
      {/* Cinematic Header Overlay */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="container-app py-6 flex items-center justify-between relative z-20 mix-blend-difference"
      >
        <div className="flex items-center gap-3">
          <Plane className="w-8 h-8 text-[var(--color-accent-cyan)]" />
          <span className="text-2xl font-bold tracking-tight px-1 font-display">ATMOS</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline-block text-xs font-semibold tracking-[0.2em] uppercase text-white/50">Engine: Velocity</span>
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse shadow-[0_0_10px_var(--color-accent-cyan)]" />
        </div>
      </motion.header>

      {/* Hero Content */}
      <section className="container-app pt-16 pb-12 relative z-20 flex flex-col items-center justify-center min-h-[90vh]">
        <CyclingHeroText />

        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto text-center leading-relaxed font-light mb-12"
        >
          The feeling of breaking the sound barrier to find the cheapest fare. 
          Uncompromised speed, precision, and architectural elegance.
        </motion.p>

        <SearchBar />

        {/* Live Counters */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-white/50 uppercase tracking-[0.1em] text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--color-accent-cyan)] rounded-full" />
            <PriceTicker value={12340} duration={3} /> <span className="ml-1">Queries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--color-accent-amber)] rounded-full" />
            <PriceTicker value={82} duration={3} prefix="₹" suffix="Lakhs" /> <span className="ml-1">Saved</span>
          </div>
        </div>
      </section>

      {/* Footer / Fade */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#080C14] to-transparent pointer-events-none z-10" />
    </div>
  );
}
