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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (iata: string) => void;
  placeholder: string;
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

  const handleSearch = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim().length >= 1) {
      const results = searchAirports(nextQuery, 6);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      return;
    }

    setSuggestions([]);
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (airport: Airport) => {
      onChange(airport.iata);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <label htmlFor={id} className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
        {label}
      </label>
      <div className="rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] px-4 py-3 transition-colors focus-within:border-[var(--border-strong)]">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={isFocused ? query : selectedLabel || query}
          onChange={(event) => handleSearch(event.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setQuery("");
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="ghost-input w-full text-base md:text-lg font-semibold placeholder:text-[var(--text-muted)]/50 truncate caret-[var(--text-secondary)]"
          autoComplete="off"
        />
        <div className={`h-px mt-2 transition-all duration-300 ${isFocused ? "bg-[var(--accent-cta)]" : "bg-[var(--border-strong)]"}`} />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute z-50 w-full mt-3 surface-panel rounded-[22px] overflow-hidden"
          >
            {suggestions.map((airport) => (
              <button
                key={airport.iata}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--accent-primary-dim)] transition-colors flex items-center gap-3 border-b border-[var(--border-muted)] last:border-0"
              >
                <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] w-8">{airport.iata}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{airport.city}</div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    {airport.name} · {airport.country}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchPanel() {
  const router = useRouter();
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults,
    children: childCount,
    infants,
    cabinClass,
    setOrigin,
    setDestination,
    swapAirports,
    setDepartureDate,
    setReturnDate,
    setPassengers,
    setCabinClass,
    isSearching,
    setSearching,
  } = useSearchStore();

  const [showPassengers, setShowPassengers] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearching(false);
  }, [setSearching]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (passRef.current && !passRef.current.contains(event.target as Node)) {
        setShowPassengers(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totalTravellers = adults + childCount + infants;

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) return;

    setSearching(true);
    const params = new URLSearchParams({
      from: origin,
      to: destination,
      date: departureDate,
      adults: adults.toString(),
      children: childCount.toString(),
      infants: infants.toString(),
      cabin: cabinClass,
      ...(returnDate ? { return: returnDate } : {}),
    });

    router.push(`/search?${params.toString()}`);
  };

  const handleSwap = () => {
    setIsSwapping(true);
    swapAirports();
    window.setTimeout(() => setIsSwapping(false), 300);
  };

  return (
    <div className="surface-panel rounded-[32px] p-5 md:p-6 lg:p-7 w-full max-w-3xl ml-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm font-semibold">Plan with flexibility</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Search cleaner fares, smarter dates, and wallet-aware effective prices.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CABIN_OPTIONS.map((option) => {
            const active = cabinClass === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCabinClass(option.value)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium border transition-colors ${
                  active
                    ? "bg-[var(--accent-cta)] text-[var(--text-inverse)] border-transparent"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi" />

        <div className="flex items-center justify-center lg:pt-6">
          <button
            type="button"
            onClick={handleSwap}
            className="w-10 h-10 rounded-full border border-[var(--border-strong)] bg-[var(--bg-base)] flex items-center justify-center shrink-0 hover:bg-[var(--bg-elevated)] transition-colors active:scale-95 group overflow-hidden relative"
            aria-label="Swap airports"
          >
            <motion.div
              animate={{ rotate: isSwapping ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative flex items-center justify-center"
            >
              <ArrowRightLeft className={`w-4 h-4 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)] ${isSwapping ? "opacity-50" : "opacity-100"}`} />
            </motion.div>

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

      <div className="glow-divider my-6" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="dep-date" className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
            Departure
          </label>
          <div className="rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] px-4 py-3">
            <input
              id="dep-date"
              type="date"
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
              min={TODAY_INPUT_VALUE}
              className="ghost-input w-full text-base font-semibold [color-scheme:dark] cursor-pointer"
            />
            <div className="h-px mt-2 bg-[var(--border-strong)]" />
          </div>
        </div>

        <div>
          <label htmlFor="ret-date" className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
            Return
            <span className="text-[var(--text-muted)]/60 ml-1 normal-case tracking-normal">optional</span>
          </label>
          <div className="rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] px-4 py-3 relative">
            <input
              id="ret-date"
              type="date"
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
              min={departureDate || TODAY_INPUT_VALUE}
              className="ghost-input w-full text-base font-semibold [color-scheme:dark] cursor-pointer pr-7"
            />
            {returnDate && (
              <button
                type="button"
                onClick={() => setReturnDate("")}
                className="absolute right-4 top-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--accent-primary-dim)] transition-colors"
                aria-label="Clear return date"
              >
                <X className="w-3 h-3 text-[var(--text-muted)]" />
              </button>
            )}
            <div className="h-px mt-2 bg-[var(--border-strong)]" />
          </div>
        </div>

        <div ref={passRef} className="relative">
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
            Travellers
          </label>
          <button
            type="button"
            onClick={() => setShowPassengers((current) => !current)}
            className="w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] px-4 py-3 text-left flex items-center justify-between gap-2"
          >
            <div>
              <div className="text-base font-semibold">
                {totalTravellers} {totalTravellers === 1 ? "Traveller" : "Travellers"}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 capitalize">{cabinClass.replace(/_/g, " ")}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${showPassengers ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showPassengers && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 right-0 left-0 top-full mt-3 surface-panel rounded-[24px] p-3"
              >
                {[
                  { label: "Adults", sub: "12+ years", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                  { label: "Children", sub: "2–11 years", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                  { label: "Infants", sub: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
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
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
          Search results highlight effective fares, nearby-date opportunities, and bank-offer-aware pricing without exposing provider credentials in the browser.
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
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(6,6,7,0.20) 0%, rgba(6,6,7,0.68) 46%, var(--bg-base) 88%), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_35%)]" aria-hidden="true" />

        <div className="container-app relative z-10 pt-24 md:pt-28 pb-16 md:pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-black/20 text-white/85 text-[11px] font-semibold uppercase tracking-widest mb-5 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                Production-first flight discovery
              </div>

              <h1 className="max-w-3xl text-5xl sm:text-6xl lg:text-[4.8rem] font-semibold font-[var(--font-display)] leading-[0.92] tracking-[-0.04em] text-white">
                Find the route.
                <br />
                <span className="text-gradient-soft">Break the price with context.</span>
              </h1>

              <p className="max-w-2xl text-white/76 text-base sm:text-lg leading-relaxed mt-5">
                TheWingsScan turns a raw fare lookup into a cleaner booking decision with flexible-date cues, bank-offer-aware pricing, route intelligence, and a calmer handoff to the booking partner.
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {[
                  { icon: Shield, label: "Server-side fare search" },
                  { icon: Wallet, label: "Wallet-aware pricing" },
                  { icon: CalendarDays, label: "Flexible date signals" },
                ].map((item) => (
                  <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/15 px-3 py-2 text-xs text-white/80 backdrop-blur-md">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
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
                  <div key={item.label} className="surface-card rounded-[24px] px-4 py-4 backdrop-blur-md bg-black/10 border-white/10">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <SearchPanel />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-8 md:mt-10 flex flex-wrap items-center gap-2.5"
          >
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/50 mr-1">Popular routes</span>
            {QUICK_ROUTES.map((route) => (
              <Link
                key={route.label}
                href={buildSearchHref(route.from, route.to, SEVEN_DAYS_FROM_NOW)}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/15 px-3.5 py-2 text-xs text-white/78 backdrop-blur-md hover:border-white/25 hover:text-white transition-colors"
              >
                {route.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="container-app relative z-10 py-14 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Cleaner search input",
              desc: "Enter a route, set your cabin, and keep the handoff light without losing useful pricing context.",
            },
            {
              icon: TrendingDown,
              title: "Signals before checkout",
              desc: "Use date flexibility, trend hints, and route-level intelligence before you decide where to book.",
            },
            {
              icon: TicketPercent,
              title: "Effective-price awareness",
              desc: "Compare what the fare really costs after eligible offer logic and partner-specific savings.",
            },
          ].map((item) => (
            <div key={item.title} className="surface-card rounded-[26px] p-5 md:p-6">
              <item.icon className="w-5 h-5 text-[var(--accent-cta)] mb-4" />
              <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
        <div className="mb-8 md:mb-10">
          <div className="section-kicker mb-4">
            <Zap className="w-3.5 h-3.5" />
            How it works
          </div>
          <h2 className="text-2xl md:text-4xl font-semibold font-[var(--font-display)] max-w-2xl leading-tight">
            Designed to reduce uncertainty before you reach the booking page.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Search,
              title: "Search with intent",
              desc: "Start with route, date, passenger mix, and cabin so the result page preserves the right context from the first click.",
            },
            {
              step: "02",
              icon: Brain,
              title: "Read the route",
              desc: "Check nearby dates, price dips, alternative itineraries, and route intelligence instead of guessing what is actually cheap.",
            },
            {
              step: "03",
              icon: Plane,
              title: "Book with confidence",
              desc: "Carry the selected fare into checkout with clearer savings, offer guidance, and a safer booking handoff.",
            },
          ].map((item) => (
            <div key={item.step} className="surface-card rounded-[28px] p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{item.step}</span>
                <item.icon className="w-4 h-4 text-[var(--accent-cta)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe2, title: "Global route data", desc: "Airports, airline identities, and cached fare calendars for faster discovery." },
            { icon: Shield, title: "Token-safe architecture", desc: "Provider credentials remain server-side behind actions and route handlers." },
            { icon: CalendarDays, title: "Flexible-date clarity", desc: "Let cheaper nearby dates surface before you overpay for a rigid choice." },
            { icon: Layers, title: "Production-ready surfaces", desc: "Shared layout, refined motion, and clearer states across search and checkout." },
          ].map((item) => (
            <div key={item.title} className="surface-card rounded-[24px] p-5 transition-transform duration-300 hover:-translate-y-1">
              <item.icon className="w-5 h-5 text-[var(--accent-cta)] mb-4" />
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="section-kicker mb-4">
              <Layers className="w-3.5 h-3.5" />
              Explore the platform
            </div>
            <h2 className="text-2xl md:text-4xl font-semibold font-[var(--font-display)] max-w-2xl leading-tight">
              Move beyond a single fare list and explore the decision space.
            </h2>
          </div>
          <p className="max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
            Each surface exists to answer a different question: when to fly, when to book, how to compare, and how to keep savings context visible through checkout.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarDays, href: "/deals", title: "Price calendar", desc: "Cheapest known fares by route and day." },
            { icon: Brain, href: "/intelligence", title: "Fare intelligence", desc: "Read price predictions, median ranges, and booking advice." },
            { icon: Layers, href: "/compare", title: "Route compare", desc: "View airline and provider level comparisons for the route." },
            { icon: TicketPercent, href: "/aggregator", title: "Booking handoff", desc: "Search now and generate the buy link only when needed." },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group surface-card rounded-[28px] p-5 transition-all hover:border-[var(--border-strong)] hover:-translate-y-1"
            >
              <feature.icon className="w-5 h-5 text-[var(--accent-cta)] mb-5 transition-transform group-hover:scale-110" />
              <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                {feature.title}
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {featuredDrops.length > 0 && (
        <section className="container-app relative z-10 py-14 md:py-16 border-t border-[var(--border-muted)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <div className="section-kicker mb-4">
                <TrendingDown className="w-3.5 h-3.5" />
                Trending price drops
              </div>
              <h2 className="text-2xl md:text-4xl font-semibold font-[var(--font-display)] leading-tight">
                Routes with visible downward movement right now.
              </h2>
            </div>
            <p className="max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
              Use these drops as entry points into the search experience, then validate with date flexibility, route context, and offer-aware fare comparisons.
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
                    Weekly average ₹{Math.round(drop.week_avg).toLocaleString()} → now ₹{Math.round(drop.current_price).toLocaleString()}
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
      )}

      <Footer />
    </div>
  );
}
