"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowRightLeft,
  Brain,
  CalendarDays,
  ChevronDown,
  Globe2,
  Layers,
  Plane,
  Search,
  Shield,
  Sparkles,
  TicketPercent,
  TrendingDown,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { getPlatformStats } from "@/app/actions/flightActions";
import { getTrendingRoutes } from "@/app/actions/intelligenceActions";
import { Footer } from "@/components/layout/Footer";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { searchAirports } from "@/lib/airports";
import type { Airport, CabinClass } from "@/lib/types";
import { useSearchStore } from "@/stores/search-store";

const TODAY_INPUT_VALUE = new Date().toISOString().split("T")[0];
const SEVEN_DAYS_FROM_NOW = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

const CABIN_OPTIONS: Array<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const QUICK_ROUTES = [
  { from: "DEL", to: "BOM", label: "Delhi → Mumbai" },
  { from: "BLR", to: "DEL", label: "Bengaluru → Delhi" },
  { from: "BOM", to: "GOI", label: "Mumbai → Goa" },
  { from: "MAA", to: "DXB", label: "Chennai → Dubai" },
];

type TrendingDrop = {
  route: string;
  drop_pct: number;
  week_avg: number;
  current_price: number;
};

function buildSearchHref(from: string, to: string, date: string, cabin: CabinClass = "economy") {
  const params = new URLSearchParams({
    from,
    to,
    date,
    adults: "1",
    cabin,
  });

  return `/search?${params.toString()}`;
}

function formatLakhs(val: number) {
  if (val === 0) return "₹0";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

function AirportInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  highlight,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  highlight: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (raw: string) => {
    const upper = raw.toUpperCase().replace(/[^A-Z ]/g, "");
    onChange(upper);
    if (upper.length >= 1) {
      setResults(searchAirports(upper).slice(0, 6));
      setDropdownOpen(true);
    } else {
      setResults([]);
      setDropdownOpen(false);
    }
  };

  const selectAirport = (airport: Airport) => {
    onChange(airport.iata);
    setDropdownOpen(false);
    inputRef.current?.blur();
    setFocused(false);
  };

  const displayValue = value || "";
  const showLabel = focused || !!displayValue;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
          showLabel
            ? "top-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]"
            : "top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]"
        }`}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={dropdownOpen}
        aria-autocomplete="list"
        value={displayValue}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={showLabel ? "" : placeholder}
        className={`ghost-input w-full h-[56px] rounded-[22px] bg-[var(--bg-elevated)] px-4 pt-3.5 pb-1 text-[15px] font-medium font-[var(--font-mono)] tracking-wider transition-all duration-200 border ${
          dropdownOpen
            ? "border-[var(--border-strong)] shadow-[0_0_0_4px_rgba(255,255,255,0.03)]"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
        } ${highlight ? "!border-[var(--accent-cta)]/40 shadow-[0_0_0_4px_rgba(250,250,250,0.04)]" : ""}`}
      />

      <AnimatePresence>
        {dropdownOpen && results.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-[60px] z-30 rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] py-2 shadow-[var(--shadow-lg)] max-h-[260px] overflow-y-auto backdrop-blur-xl"
            role="listbox"
          >
            {results.map((airport) => (
              <li key={airport.iata}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => selectAirport(airport)}
                  className="w-full text-left px-5 py-3 hover:bg-[var(--accent-primary-dim)] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{airport.city}, {airport.country}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{airport.name}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--accent-primary-dim)] px-2.5 py-1 text-[11px] font-bold font-mono">
                    {airport.iata}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SearchPanel() {
  const router = useRouter();
  const { origin, setOrigin, destination, setDestination, cabinClass, setCabinClass } = useSearchStore();

  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [showPassengers, setShowPassengers] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const passengerLabel = useMemo(() => {
    const total = adults + children + infants;
    return `${total} traveller${total > 1 ? "s" : ""}`;
  }, [adults, children, infants]);

  const setPassengers = useCallback((a: number, c: number, i: number) => {
    const total = a + c + i;
    if (total <= 9 && a >= 1 && c <= 8 && i <= a) {
      setAdults(a);
      setChildren(c);
      setInfants(i);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!origin || !destination || !departureDate) return;
    setIsSearching(true);

    const params = new URLSearchParams({
      from: origin,
      to: destination,
      date: departureDate,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      cabin: cabinClass,
    });

    if (returnDate && showReturn) {
      params.set("return", returnDate);
    }

    router.push(`/search?${params.toString()}`);
  }, [origin, destination, departureDate, returnDate, adults, children, infants, cabinClass, showReturn, router]);

  const todayStr = TODAY_INPUT_VALUE;

  return (
    <div className="w-full surface-panel rounded-[32px] p-5 md:p-7 shadow-[var(--shadow-xl)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-cyan)]/3 via-transparent to-[var(--accent-purple)]/3 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent-cta)_30%,transparent)] to-transparent" />

      <div className="relative z-10 space-y-4 md:space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <AirportInput
            id="origin"
            label="From"
            value={origin}
            onChange={setOrigin}
            placeholder="City or airport"
            highlight={!origin}
          />
          <div className="relative">
            <AirportInput
              id="destination"
              label="To"
              value={destination}
              onChange={setDestination}
              placeholder="City or airport"
              highlight={!destination}
            />
            <button
              type="button"
              onClick={() => {
                const temp = origin;
                setOrigin(destination);
                setDestination(temp);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary-dim)] transition-colors shadow-[var(--shadow-sm)]"
              aria-label="Swap origin and destination"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <label
              htmlFor="departureDate"
              className="absolute left-4 top-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] z-10 pointer-events-none"
            >
              Departure
            </label>
            <input
              id="departureDate"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={todayStr}
              className="ghost-input w-full h-[56px] rounded-[22px] bg-[var(--bg-elevated)] px-4 pt-3.5 pb-1 text-[15px] font-medium transition-all duration-200 border border-[var(--border-default)] hover:border-[var(--border-strong)]"
            />
          </div>

          <div className="relative">
            {showReturn ? (
              <>
                <label
                  htmlFor="returnDate"
                  className="absolute left-4 top-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] z-10 pointer-events-none"
                >
                  Return
                </label>
                <input
                  id="returnDate"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || todayStr}
                  className="ghost-input w-full h-[56px] rounded-[22px] bg-[var(--bg-elevated)] px-4 pt-3.5 pb-1 text-[15px] font-medium transition-all duration-200 border border-[var(--border-default)] hover:border-[var(--border-strong)]"
                />
                <button
                  type="button"
                  onClick={() => { setShowReturn(false); setReturnDate(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--accent-primary-dim)] transition-colors"
                  aria-label="Remove return date"
                >
                  <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowReturn(true)}
                className="w-full h-[56px] rounded-[22px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/50 flex items-center justify-center gap-2 text-[12px] text-[var(--text-muted)] hover:border-[var(--accent-cta)]/30 hover:text-[var(--text-secondary)] transition-all duration-200"
              >
                <span>+ Add return date</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <label className="absolute left-4 top-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] z-10 pointer-events-none">
              Passengers
            </label>
            <button
              type="button"
              onClick={() => setShowPassengers(!showPassengers)}
              className="ghost-input w-full h-[56px] rounded-[22px] bg-[var(--bg-elevated)] px-4 pt-3.5 pb-1 text-[15px] font-medium transition-all duration-200 border border-[var(--border-default)] hover:border-[var(--border-strong)] flex items-center justify-between"
            >
              <span>{passengerLabel}</span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${showPassengers ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showPassengers ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-[60px] z-30 rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-lg)]"
                >
                  {[
                    { label: "Adults", sub: "12+ years", val: adults, set: (v: number) => setPassengers(v, children, infants), min: 1, max: 9 },
                    { label: "Children", sub: "2–11 years", val: children, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                    { label: "Infants", sub: "Under 2", val: infants, set: (v: number) => setPassengers(adults, children, v), min: 0, max: adults },
                  ].map(({ label, sub, val, set, min, max }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-[var(--border-muted)] last:border-0">
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{sub}</div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button type="button" onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-20 text-xs hover:bg-[var(--accent-primary-dim)] transition-colors">−</button>
                        <span className="w-5 text-center font-mono text-sm">{val}</span>
                        <button type="button" onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-20 text-xs hover:bg-[var(--accent-primary-dim)] transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="relative flex-1">
            <label className="absolute left-4 top-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] z-10 pointer-events-none">
              Cabin
            </label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as CabinClass)}
              className="ghost-input w-full h-[56px] rounded-[22px] bg-[var(--bg-elevated)] px-4 pt-3.5 pb-1 text-[15px] font-medium transition-all duration-200 border border-[var(--border-default)] hover:border-[var(--border-strong)] appearance-none cursor-pointer"
            >
              {CABIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
          Compare effective fares with nearby-date opportunities and bank-offer-aware pricing.
        </p>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!origin || !destination || !departureDate || isSearching}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3.5 text-[15px] font-semibold text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-30 transition-opacity min-w-[220px]"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search Flights
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ searchesToday: 0, moneySavedMonth: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [trending, setTrending] = useState<{ biggest_drops?: TrendingDrop[] } | null>(null);

  useEffect(() => {
    let mounted = true;

    getPlatformStats()
      .then((data) => {
        if (!mounted) return;
        setStats({
          searchesToday: data.searchesToday,
          moneySavedMonth: data.moneySavedMonth,
        });
      })
      .finally(() => {
        if (mounted) setStatsLoading(false);
      });

    getTrendingRoutes()
      .then((data) => {
        if (mounted) setTrending(data ?? null);
      })
      .catch(() => {
        if (mounted) setTrending(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const featuredDrops = trending?.biggest_drops?.slice(0, 6) ?? [];

  return (
    <div className="min-h-[100dvh] relative">
      {/* Particle canvas background */}
      <ParticleBackground />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[2]">
          <div className="absolute top-[-20%] left-[-5%] w-[60%] h-[70%] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_8%,transparent)] blur-[160px]" />
          <div className="absolute top-[10%] right-[-8%] w-[50%] h-[60%] rounded-full bg-[color-mix(in_srgb,var(--accent-purple)_7%,transparent)] blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[25%] w-[40%] h-[30%] rounded-full bg-[color-mix(in_srgb,var(--accent-amber)_4%,transparent)] blur-[100px]" />
        </div>

        {/* Hero grid overlay */}
        <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-[0.12] z-[3]" />

        <div className="container-app relative z-10 pt-28 md:pt-36 pb-16 md:pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            {/* Left: Hero Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/12 bg-black/20 text-white/85 text-[11px] font-semibold uppercase tracking-widest mb-6 backdrop-blur-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Intelligent flight discovery
              </motion.div>

              <h1 className="max-w-3xl text-[3.2rem] sm:text-[4.2rem] md:text-[4.8rem] lg:text-[5.2rem] font-semibold font-[var(--font-display)] leading-[0.9] tracking-[-0.04em] text-white">
                Your flight.
                <br />
                <span className="text-gradient-soft">Your intelligence.</span>
              </h1>

              <p className="max-w-2xl text-white/72 text-base sm:text-lg leading-relaxed mt-6">
                Compare live fares with calendar-wide price signals, bank-offer savings, 
                and route intelligence — all from one search. No guessing, no overpaying.
              </p>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  { icon: Shield, label: "Server-side fare engine" },
                  { icon: Wallet, label: "Wallet-aware pricing" },
                  { icon: CalendarDays, label: "Calendar intelligence" },
                ].map((item) => (
                  <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3.5 py-2 text-xs text-white/78 backdrop-blur-md">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Searches tracked",
                    value: statsLoading ? "…" : stats.searchesToday.toLocaleString(),
                  },
                  {
                    label: "Savings recorded",
                    value: statsLoading ? "…" : formatLakhs(stats.moneySavedMonth),
                  },
                  {
                    label: "Experience focus",
                    value: "Search → Compare → Checkout",
                  },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="surface-card rounded-[24px] px-4 py-4 backdrop-blur-md bg-black/10 border-white/10"
                  >
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Search Panel */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <SearchPanel />
            </motion.div>
          </div>

          {/* Quick routes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-9 md:mt-11 flex flex-wrap items-center gap-2.5"
          >
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/45 mr-1">Popular routes</span>
            {QUICK_ROUTES.map((route) => (
              <Link
                key={route.label}
                href={buildSearchHref(route.from, route.to, SEVEN_DAYS_FROM_NOW)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/12 px-3.5 py-2 text-xs text-white/75 backdrop-blur-md hover:border-white/22 hover:text-white transition-all duration-200"
              >
                {route.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section className="container-app relative z-10 py-14 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Fare search with context",
              desc: "Enter any route and cabin — get calendar-aware pricing with nearby-date signals and wallet-matched savings.",
            },
            {
              icon: TrendingDown,
              title: "Decide before you book",
              desc: "Date flexibility signals, fare trend analysis, and route intelligence surface the best booking window.",
            },
            {
              icon: TicketPercent,
              title: "Effective-price clarity",
              desc: "See what your fare actually costs after bank offers and partner savings — before you click through.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.45 }}
              className="surface-card rounded-[28px] p-6 md:p-7 group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-dim)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-5 h-5 text-[var(--accent-cta)]" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
        <div className="mb-10 md:mb-12">
          <div className="section-kicker mb-4">
            <Zap className="w-3.5 h-3.5" />
            How it works
          </div>
          <h2 className="text-2xl md:text-4xl font-semibold font-[var(--font-display)] max-w-2xl leading-tight">
            Less uncertainty before you reach the booking page.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Search,
              title: "Search with intent",
              desc: "Enter your route, date, and passenger mix. The engine fetches live fares while preserving your search context.",
            },
            {
              step: "02",
              icon: Brain,
              title: "Read the intelligence",
              desc: "Nearby date prices, fare predictions, bank-offer matches, and route signals — all in one view.",
            },
            {
              step: "03",
              icon: Plane,
              title: "Checkout with confidence",
              desc: "Choose your fare, review the savings breakdown, and continue to a secure booking handoff.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="surface-card rounded-[28px] p-6 md:p-7 group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{item.step}</span>
                <item.icon className="w-4 h-4 text-[var(--accent-cta)] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe2, title: "Global route coverage", desc: "Airport identities and cached fare calendars for faster discovery across routes." },
            { icon: Shield, title: "Token-safe architecture", desc: "All provider credentials and tokens stay server-side — never exposed to the browser." },
            { icon: CalendarDays, title: "Flexible-date clarity", desc: "Cheaper nearby dates surface automatically so you never overpay for a rigid choice." },
            { icon: Layers, title: "Production-grade surfaces", desc: "Shared design system, refined motion, and clear states across every screen." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="surface-card rounded-[24px] p-5 transition-all duration-300 hover:-translate-y-1 group"
            >
              <item.icon className="w-5 h-5 text-[var(--accent-cta)] mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature surfaces */}
      <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <div className="section-kicker mb-4">
              <Layers className="w-3.5 h-3.5" />
              Explore the platform
            </div>
            <h2 className="text-2xl md:text-4xl font-semibold font-[var(--font-display)] max-w-2xl leading-tight">
              Go beyond a single fare list.
            </h2>
          </div>
          <p className="max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
            Each surface answers a different question: when to fly, when to book, how to compare, 
            and how to keep savings visible through checkout.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarDays, href: "/deals", title: "Price calendar", desc: "Cheapest known fares by route and day across the month." },
            { icon: Brain, href: "/intelligence", title: "Fare intelligence", desc: "Price predictions, median ranges, and booking window advice." },
            { icon: Layers, href: "/compare", title: "Route compare", desc: "Airline and provider-level comparisons for any route pair." },
            { icon: TicketPercent, href: "/aggregator", title: "Booking handoff", desc: "Generate the buy link only when you are ready to commit." },
          ].map((feature, i) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group surface-card rounded-[28px] p-5 transition-all hover:border-[var(--border-strong)] hover:-translate-y-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.4 }}
              >
                <feature.icon className="w-5 h-5 text-[var(--accent-cta)] mb-5 transition-transform group-hover:scale-110" />
                <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                  {feature.title}
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending price drops */}
      {featuredDrops.length > 0 ? (
        <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <div className="section-kicker mb-4">
                <TrendingDown className="w-3.5 h-3.5" />
                Trending price drops
              </div>
              <h2 className="text-2xl md:text-4xl font-semibold font-[var(--font-display)] leading-tight">
                Routes with visible downward movement.
              </h2>
            </div>
            <p className="max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
              Use these as entry points — then validate with date flexibility, route context, and bank-offer-aware comparisons.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDrops.map((drop, index) => {
              const [from, to] = drop.route.split("-");
              return (
                <Link
                  key={`${drop.route}-${index}`}
                  href={buildSearchHref(from, to, SEVEN_DAYS_FROM_NOW)}
                  className="group surface-card rounded-[28px] p-5 transition-all hover:border-[var(--border-strong)] hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">{from} → {to}</span>
                    <span className="rounded-full bg-[var(--accent-green)]/12 text-[var(--accent-green)] px-2.5 py-1 text-[11px] font-semibold">
                      {Math.round(drop.drop_pct)}% lower
                    </span>
                  </div>
                  <div className="text-3xl font-semibold font-mono-price tracking-tight mb-2">
                    ₹{Math.round(drop.current_price).toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Weekly avg ₹{Math.round(drop.week_avg).toLocaleString()} → now ₹{Math.round(drop.current_price).toLocaleString()}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    Open search
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}