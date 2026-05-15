"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import { getPlatformStats } from "@/app/actions/flightActions";
import { getTrendingRoutes } from "@/app/actions/intelligenceActions";
import type { Airport } from "@/lib/types";
import {
  ArrowRightLeft, ChevronDown, X,
  Search, TrendingDown, Shield, Zap, Plane,
  Brain, Layers, ArrowRight, TicketPercent, CalendarDays, Globe2,
} from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";

const TODAY_INPUT_VALUE = new Date().toISOString().split("T")[0];
const SEVEN_DAYS_FROM_NOW = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

type TrendingDrop = {
  route: string;
  drop_pct: number;
  week_avg: number;
  current_price: number;
};

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
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    swapAirports();
    setTimeout(() => setIsSwapping(false), 300); // Reset animation state
  };

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 md:p-8 w-full max-w-4xl mx-auto">
      {/* Origin / Destination — side by side, no borders */}
      <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0 mb-8 relative">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi" />

        <div className="flex items-center justify-center md:px-4 z-10">
          <button
            onClick={handleSwap}
            className="w-8 h-8 rounded-full border border-[var(--border-strong)] bg-[var(--bg-base)] flex items-center justify-center shrink-0 hover:bg-[var(--bg-elevated)] transition-colors active:scale-95 group overflow-hidden relative"
            aria-label="Swap airports"
          >
            <motion.div
              animate={{ rotate: isSwapping ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative flex items-center justify-center"
            >
              <ArrowRightLeft className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)] ${isSwapping ? 'opacity-50' : 'opacity-100'}`} />
            </motion.div>
            
            {/* Ripple effect on click */}
            <AnimatePresence>
              {isSwapping && (
                <motion.span
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 bg-[var(--accent-cta)] rounded-full pointer-events-none"
                />
              )}
            </AnimatePresence>
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
              min={TODAY_INPUT_VALUE}
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
              min={departureDate || TODAY_INPUT_VALUE}
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
  const [stats, setStats] = useState({ searchesToday: 0, moneySavedMonth: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [trending, setTrending] = useState<{ biggest_drops?: TrendingDrop[] } | null>(null);

  useEffect(() => {
    getPlatformStats().then(data => {
      setStats({
        searchesToday: data.searchesToday,
        moneySavedMonth: data.moneySavedMonth
      });
      setStatsLoading(false);
    });
    getTrendingRoutes().then(data => {
      setTrending(data ?? null);
    }).catch(() => setTrending(null));
  }, []);

  const formatLakhs = (val: number) => {
    if (val === 0) return "₹0";
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  };

  return (
    <div className="min-h-[100dvh] relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-[42rem] bg-cover bg-center opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.42), var(--bg-base) 88%), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=80')",
          }}
          aria-hidden="true"
        />
        <div className="container-app pt-28 pb-12 flex flex-col items-center min-h-[84dvh] justify-center bg-transparent relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-black/20 text-white/85 text-[11px] font-semibold uppercase tracking-widest mb-5 backdrop-blur-md">
            <Plane className="w-3.5 h-3.5" />
            Travelpayouts-ready fare scanner
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-[4.75rem] font-bold leading-[0.95] mb-5 text-white">
            TheWingsScan
          </h1>
          <p className="text-white/78 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A clean, fast flight intelligence page for scanning Travelpayouts fare data, flexible-date prices, airline signals, and secure affiliate booking handoffs.
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
          {statsLoading ? (
            <span className="animate-pulse bg-[var(--border-strong)] w-32 h-4 rounded"></span>
          ) : (
            <span>{stats.searchesToday.toLocaleString()} Searches Tracked</span>
          )}
          <span className="w-px h-3 bg-[var(--border-strong)]" />
          {statsLoading ? (
            <span className="animate-pulse bg-[var(--border-strong)] w-32 h-4 rounded"></span>
          ) : (
            <span>{formatLakhs(stats.moneySavedMonth)} Recorded Savings</span>
          )}
        </motion.div>
        </div>
      </section>



      {/* HOW IT WORKS */}
      <section className="container-app py-16 border-t border-[var(--border-muted)] relative z-10">
        <h2 className="text-lg font-semibold mb-8">How it works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Scan", desc: "Enter a route and date. The server reads Travelpayouts fare data without exposing your token." },
            { icon: TrendingDown, title: "Read signals", desc: "Compare prices, nearby dates, calendar lows, and route intelligence before deciding." },
            { icon: Zap, title: "Open booking", desc: "Real-time bookings generate the Travelpayouts agency link only after you click." },
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
      <section className="container-app py-16 border-t border-[var(--border-muted)] relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Globe2, title: "Global data", desc: "Airports, airlines, popular routes, and cached fare calendars." },
            { icon: Shield, title: "Secret-safe", desc: "Travelpayouts token stays server-side behind actions and route handlers." },
            { icon: TrendingDown, title: "Flexible dates", desc: "Calendar prices help customers avoid expensive departure days." },
            { icon: Plane, title: "Search-ready", desc: "Prepared for Aviasales real-time search with marker-based redirects." },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
              <item.icon className="w-4 h-4 text-[var(--text-muted)] mb-2.5" />
              <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE DISCOVERY */}
      <section className="container-app py-16 border-t border-[var(--border-muted)] relative z-10">
        <h2 className="text-lg font-semibold mb-8">Travelpayouts Surface Area</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: CalendarDays, href: "/deals", title: "Price calendar", desc: "Cheapest known fares by day and route" },
            { icon: Brain, href: "/intelligence", title: "Fare intelligence", desc: "Median, range, and booking-window guidance" },
            { icon: Layers, href: "/compare", title: "Route compare", desc: "Airline and cached-provider comparison" },
            { icon: TicketPercent, href: "/aggregator", title: "Affiliate handoff", desc: "Search now, generate buy link on click" },
          ].map((feat) => (
            <Link
              key={feat.title}
              href={feat.href}
              className="group p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-strong)] transition-all"
            >
              <feat.icon className="w-4 h-4 text-[var(--accent-cta)] mb-2.5 transition-transform group-hover:scale-110" />
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1">
                {feat.title}
                <ArrowRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING ROUTES */}
      {trending && trending.biggest_drops && trending.biggest_drops.length > 0 && (
        <section className="container-app py-16 border-t border-[var(--border-muted)] relative z-10">
          <h2 className="text-lg font-semibold mb-8">Trending Price Drops</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trending.biggest_drops.slice(0, 6).map((drop: TrendingDrop, i: number) => (
              <Link
                key={i}
                href={`/search?from=${drop.route.split("-")[0]}&to=${drop.route.split("-")[1]}&date=${SEVEN_DAYS_FROM_NOW}&adults=1`}
                className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-strong)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{drop.route.split("-")[0]} → {drop.route.split("-")[1]}</span>
                  <span className="text-[11px] font-bold text-[var(--accent-green)]">from ₹{Math.round(drop.current_price).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>₹{Math.round(drop.week_avg).toLocaleString()} → ₹{Math.round(drop.current_price).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
