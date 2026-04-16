"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";
import {
  ArrowRightLeft, ChevronDown, X,
  Search, TrendingDown, Shield, Zap, Plane,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";

/* ================================================================
   AIRPORT INPUT — borderless, ghost-style
   ================================================================ */
function AirportInput({
  id, label, value, onChange, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (iata: string) => void; placeholder: string;
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
    <div ref={wrapperRef} className="relative flex-1">
      <label htmlFor={id} className="block text-[11px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">
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
        className="ghost-input w-full text-xl font-semibold placeholder:text-[var(--text-muted)]/40 truncate py-1 caret-[var(--text-secondary)]"
        autoComplete="off"
      />
      {/* Text line indicator — always visible, brightens on focus */}
      <div className={`h-px mt-1 transition-all duration-300 ${isFocused ? "bg-[var(--text-secondary)]" : "bg-[var(--border-strong)]"}`} />

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-3 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            {suggestions.map((airport) => (
              <button
                key={airport.iata}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--accent-primary-dim)] transition-colors flex items-center gap-3 border-b border-[var(--border-muted)] last:border-0"
              >
                <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] w-8">{airport.iata}</span>
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

/* ================================================================
   SEARCH PANEL
   ================================================================ */
function SearchPanel() {
  const router = useRouter();
  const {
    origin, destination, departureDate, returnDate,
    adults, children: childCount, infants,
    setOrigin, setDestination, swapAirports, setDepartureDate,
    setReturnDate, setPassengers, isSearching, setSearching,
  } = useSearchStore();

  useEffect(() => { setSearching(false); }, [setSearching]);
  const [showPassengers, setShowPassengers] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  // Close passengers on outside click
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
      ...(returnDate && { return: returnDate }),
      adults: adults.toString(), children: childCount.toString(),
      infants: infants.toString(),
    });
    router.push(`/search?${params.toString()}`);
  };

  const totalTravellers = adults + childCount + infants;

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 md:p-8 w-full max-w-4xl mx-auto">
      {/* Origin / Destination — side by side, no borders */}
      <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0 mb-8 relative">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi" />

        <div className="flex items-center justify-center md:px-4 z-10">
          <button
            onClick={swapAirports}
            className="w-8 h-8 rounded-full border border-[var(--border-strong)] bg-[var(--bg-base)] flex items-center justify-center shrink-0 hover:bg-[var(--bg-elevated)] transition-colors active:scale-95"
            aria-label="Swap airports"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
        </div>

        <AirportInput id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai" />
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border-default)] mb-6" />

      {/* Date + Passengers — ghost inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Departure */}
        <div>
          <label htmlFor="dep-date" className="block text-[11px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">
            Departure
          </label>
          <div className="relative">
            <input
              id="dep-date"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="ghost-input w-full text-base font-semibold py-1 [color-scheme:dark] cursor-pointer"
            />
            <div className="h-px mt-1 bg-[var(--border-strong)]" />
          </div>
        </div>

        {/* Return — with clear button */}
        <div>
          <label htmlFor="ret-date" className="block text-[11px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">
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
              className="ghost-input w-full text-base font-semibold py-1 [color-scheme:dark] cursor-pointer"
            />
            {returnDate && (
              <button
                onClick={() => setReturnDate("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--accent-primary-dim)] transition-colors"
                aria-label="Clear return date"
                type="button"
              >
                <X className="w-3 h-3 text-[var(--text-muted)]" />
              </button>
            )}
            <div className="h-px mt-1 bg-[var(--border-strong)]" />
          </div>
        </div>

        {/* Passengers */}
        <div ref={passRef} className="relative">
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">
            Travellers
          </label>
          <button
            onClick={() => setShowPassengers(!showPassengers)}
            className="w-full bg-transparent border-none outline-none text-base font-semibold py-1 text-left flex items-center gap-2 cursor-pointer"
          >
            <span>{totalTravellers} {totalTravellers === 1 ? "Traveller" : "Travellers"}</span>
            <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${showPassengers ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showPassengers && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 right-0 left-0 top-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] p-3 shadow-[var(--shadow-lg)]"
              >
                {[
                  { label: "Adults", sub: "12+", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                  { label: "Children", sub: "2–11", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                  { label: "Infants", sub: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
                ].map(({ label, sub, val, set, min, max }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-[var(--border-muted)] last:border-0">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{sub}</div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-7 h-7 rounded-full border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-20 text-xs hover:bg-[var(--accent-primary-dim)] transition-colors">−</button>
                      <span className="w-4 text-center font-mono text-sm">{val}</span>
                      <button onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-7 h-7 rounded-full border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-20 text-xs hover:bg-[var(--accent-primary-dim)] transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <button
          onClick={handleSearch}
          disabled={!origin || !destination || !departureDate || isSearching}
          className="w-full py-3.5 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2 text-[15px] active:scale-[0.99]"
        >
          {isSearching ? (
            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Searching...</>
          ) : (
            <><Search className="w-4 h-4" />Search Flights</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   HOMEPAGE
   ================================================================ */
export default function HomePage() {
  return (
    <div className="min-h-[100dvh]">
      {/* HERO */}
      <section className="container-app pt-20 pb-12 flex flex-col items-center min-h-[80dvh] justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tighter mb-4">
            Find the cheapest<br />flights, instantly.
          </h1>
          <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Find the absolute lowest fares and apply all Indian credit card offers automatically to get your true effective price.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full"
        >
          <SearchPanel />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-10 text-[var(--text-muted)] text-xs font-mono"
        >
          <span>12,340 searches today</span>
          <span className="w-px h-3 bg-[var(--border-strong)]" />
          <span>₹82L saved this month</span>
        </motion.div>
      </section>



      {/* HOW IT WORKS */}
      <section className="container-app py-16 border-t border-[var(--border-muted)]">
        <h2 className="text-lg font-semibold tracking-tight mb-8">How it works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Search", desc: "Enter your route and dates. We check multiple sources in real-time." },
            { icon: TrendingDown, title: "Compare", desc: "See every option sorted by price, duration, or value." },
            { icon: Zap, title: "Book", desc: "Pick the best deal and book directly with the airline." },
          ].map((step) => (
            <div key={step.title} className="space-y-2.5">
              <step.icon className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="font-semibold text-[15px]">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="container-app py-16 border-t border-[var(--border-muted)]">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Zap, title: "Real-time", desc: "Prices updated every 15 minutes." },
            { icon: Shield, title: "No hidden fees", desc: "What you see is what you pay." },
            { icon: TrendingDown, title: "Price history", desc: "Know if now is the right time to book." },
            { icon: Plane, title: "All airlines", desc: "IndiGo, Air India, Akasa Air, Vistara and more." },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
              <item.icon className="w-4 h-4 text-[var(--text-muted)] mb-2.5" />
              <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
