"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";
import { POPULAR_ROUTES, formatPrice } from "@/lib/constants";
import {
  ArrowRightLeft, Calendar, Users, ChevronDown,
  Search, ArrowRight, MapPin, TrendingDown, Shield, Zap, Plane,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";

/* ================================================================
   AIRPORT INPUT
   ================================================================ */
function AirportInput({
  id, label, value, onChange, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (iata: string) => void; placeholder: string;
}) {
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
    setDisplayValue(q);
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
    setDisplayValue(`${airport.city} (${airport.iata})`);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) { setIsOpen(false); }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <label htmlFor={id} className="block text-[11px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { setDisplayValue(""); if (suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-6 text-lg font-semibold focus:outline-none focus:border-[var(--text-secondary)] transition-colors placeholder:text-[var(--text-muted)] truncate"
          autoComplete="off"
        />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            {suggestions.map((airport) => (
              <button
                key={airport.iata}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors flex items-center gap-3 border-b border-[var(--border-muted)] last:border-0"
              >
                <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] w-8">{airport.iata}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{airport.city}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{airport.name}</div>
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

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 md:p-8 w-full max-w-4xl mx-auto">
      {/* Origin / Destination */}
      <div className="flex flex-col md:flex-row items-stretch gap-6 mb-6 relative">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi" />

        <div className="flex items-center justify-center -my-3 md:-mx-3 md:my-0 z-10">
          <button
            onClick={swapAirports}
            className="w-9 h-9 rounded-full border border-[var(--border-strong)] bg-[var(--bg-base)] flex items-center justify-center shrink-0 hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <AirportInput id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai" />
      </div>

      {/* Date + Passengers */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-1">
          <label htmlFor="dep-date" className="block text-[11px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-widest">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input id="dep-date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-6 text-lg font-semibold focus:outline-none focus:border-[var(--text-secondary)] transition-colors [color-scheme:dark]" />
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="ret-date" className="block text-[11px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-widest">Return</label>
          <div className="relative">
            <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input id="ret-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={departureDate} className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-6 text-lg font-semibold focus:outline-none focus:border-[var(--text-secondary)] transition-colors placeholder:text-[var(--text-muted)] [color-scheme:dark]" />
          </div>
        </div>

        {/* Passengers */}
        <div className="relative flex-1">
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-widest">Travellers</label>
          <button onClick={() => setShowPassengers(!showPassengers)} className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-6 text-lg font-semibold focus:outline-none transition-colors text-left flex items-center justify-between relative">
            <Users className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <span>{adults + childCount + infants}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${showPassengers ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showPassengers && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 right-0 left-0 top-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-lg)]"
              >
                {[
                  { label: "Adults", sub: "12+", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                  { label: "Children", sub: "2-11", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                  { label: "Infants", sub: "<2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
                ].map(({ label, sub, val, set, min, max }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-[var(--border-muted)] last:border-0">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-[var(--text-muted)]">{sub}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-7 h-7 rounded-[var(--radius-sm)] border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-20 text-sm hover:bg-white/[0.04]">−</button>
                      <span className="w-4 text-center font-mono text-sm">{val}</span>
                      <button onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-7 h-7 rounded-[var(--radius-sm)] border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-20 text-sm hover:bg-white/[0.04]">+</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleSearch}
        disabled={!origin || !destination || !departureDate || isSearching}
        className="w-full py-3.5 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2 text-[15px]"
      >
        {isSearching ? (
          <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Searching...</>
        ) : (
          <><Search className="w-4 h-4" />Search Flights</>
        )}
      </button>
    </div>
  );
}

/* ================================================================
   ROUTE CARD
   ================================================================ */
function RouteCard({ route }: { route: typeof POPULAR_ROUTES[number] }) {
  // Deterministic price from route label — avoids hydration mismatch
  let hash = 0;
  for (let i = 0; i < route.label.length; i++) {
    hash = ((hash << 5) - hash + route.label.charCodeAt(i)) | 0;
  }
  const price = 2800 + Math.abs(hash % 4000);

  return (
    <div className="min-w-[240px] snap-start border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--border-strong)] transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">{route.label}</span>
        <ArrowRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
      </div>
      <span className="font-mono-price text-lg font-semibold">{formatPrice(price)}</span>
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
      <section className="container-app pt-24 pb-16 flex flex-col items-center min-h-[85dvh] justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tighter mb-4">
            Find the cheapest<br />flights, instantly.
          </h1>
          <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Compare fares across airlines. Track prices. Never overpay.
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

        {/* Subtle stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-6 mt-12 text-[var(--text-muted)] text-xs font-mono"
        >
          <span>12,340 searches today</span>
          <span className="w-px h-3 bg-[var(--border-strong)]" />
          <span>₹82L saved this month</span>
        </motion.div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="container-app py-20 border-t border-[var(--border-muted)]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Popular Routes</h2>
          <button className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">View all</button>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
          {POPULAR_ROUTES.slice(0, 6).map((route) => (
            <RouteCard key={route.label} route={route} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-app py-20 border-t border-[var(--border-muted)]">
        <h2 className="text-xl font-semibold tracking-tight mb-10">How it works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Search", desc: "Enter your route and dates. We check multiple sources in real-time." },
            { icon: TrendingDown, title: "Compare", desc: "See every option sorted by price, duration, or value." },
            { icon: Zap, title: "Book", desc: "Pick the best deal and book directly with the airline." },
          ].map((step) => (
            <div key={step.title} className="space-y-3">
              <step.icon className="w-5 h-5 text-[var(--text-muted)]" />
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="container-app py-20 border-t border-[var(--border-muted)]">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: "Real-time", desc: "Prices updated every 15 minutes." },
            { icon: Shield, title: "No hidden fees", desc: "What you see is what you pay." },
            { icon: TrendingDown, title: "Price history", desc: "Know if now is the right time to book." },
            { icon: Plane, title: "All airlines", desc: "IndiGo, Air India, SpiceJet, and more." },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
              <item.icon className="w-4 h-4 text-[var(--text-muted)] mb-3" />
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
