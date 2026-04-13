"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";
import { POPULAR_ROUTES, formatPrice, AIRLINES } from "@/lib/constants";
import {
  Search,
  ArrowRightLeft,
  Plane,
  Calendar,
  Users,
  ChevronDown,
  Sparkles,
  TrendingDown,
  Zap,
  Shield,
  MapPin,
  ArrowRight,
} from "lucide-react";

/* ─── Airport Autocomplete Input ─────────────────────── */
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
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
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
        className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider"
      >
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
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
          className="input-field pl-10 text-base font-medium"
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        >
          {suggestions.map((airport) => (
            <button
              key={airport.iata}
              onClick={() => handleSelect(airport)}
              className="w-full text-left px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center gap-3 border-b border-[var(--border-primary)] last:border-0"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-glow)] flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                {airport.iata}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                  {airport.city}
                  <span className="text-[var(--text-tertiary)] ml-1.5">
                    {airport.cityHi}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-tertiary)] truncate">
                  {airport.name}
                </div>
              </div>
              {airport.country !== "IN" && (
                <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded">
                  {airport.country}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Search Bar Component ───────────────────────────── */
function SearchBar() {
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
    isSearching,
    setSearching,
  } = useSearchStore();

  const [showPassengers, setShowPassengers] = useState(false);

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) return;
    setSearching(true);
    const params = new URLSearchParams({
      from: origin,
      to: destination,
      date: departureDate,
      ...(returnDate && { return: returnDate }),
      adults: adults.toString(),
      children: childCount.toString(),
      infants: infants.toString(),
      cabin: cabinClass,
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="glass-card p-4 sm:p-6 w-full max-w-4xl mx-auto animate-glow">
      {/* Origin / Destination Row */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-4">
        <AirportInput
          id="origin"
          label="From"
          value={origin}
          onChange={setOrigin}
          placeholder="Delhi, दिल्ली, DEL"
        />

        <button
          onClick={swapAirports}
          className="self-center sm:self-end sm:mb-0.5 w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-surface-hover)] hover:border-[var(--color-primary)] transition-all group shrink-0"
          aria-label="Swap airports"
        >
          <ArrowRightLeft className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
        </button>

        <AirportInput
          id="destination"
          label="To"
          value={destination}
          onChange={setDestination}
          placeholder="Mumbai, मुंबई, BOM"
        />
      </div>

      {/* Date / Passengers Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label
            htmlFor="departure-date"
            className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider"
          >
            Departure
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              id="departure-date"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="input-field pl-10 font-medium"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="flex-1">
          <label
            htmlFor="return-date"
            className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider"
          >
            Return <span className="text-[var(--text-tertiary)]">(optional)</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              id="return-date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="input-field pl-10 font-medium"
              min={departureDate}
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">
            Travellers
          </label>
          <button
            onClick={() => setShowPassengers(!showPassengers)}
            className="input-field flex items-center gap-2 min-w-[140px] font-medium"
          >
            <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span>
              {adults + childCount + infants}{" "}
              {adults + childCount + infants === 1 ? "Traveller" : "Travellers"}
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] ml-auto" />
          </button>

          {showPassengers && (
            <div className="absolute z-50 right-0 top-full mt-2 w-64 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4 shadow-2xl animate-scale-in">
              {[
                { label: "Adults", sublabel: "12+ years", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                { label: "Children", sublabel: "2-12 years", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                { label: "Infants", sublabel: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
              ].map(({ label, sublabel, val, set, min, max }) => (
                <div key={label} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{sublabel}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => val > min && set(val - 1)}
                      disabled={val <= min}
                      className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center text-sm disabled:opacity-30 hover:border-[var(--color-primary)]"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold">{val}</span>
                    <button
                      onClick={() => val < max && set(val + 1)}
                      disabled={val >= max}
                      className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center text-sm disabled:opacity-30 hover:border-[var(--color-primary)]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowPassengers(false)}
                className="w-full mt-3 btn-primary text-sm py-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={!origin || !destination || !departureDate || isSearching}
        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-40"
      >
        {isSearching ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Searching across all sources...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Flights
          </>
        )}
      </button>
    </div>
  );
}

/* ─── Trending Route Card ────────────────────────────── */
function TrendingRouteCard({
  origin,
  destination,
  label,
}: {
  origin: string;
  destination: string;
  label: string;
}) {
  const router = useRouter();
  const { setOrigin, setDestination } = useSearchStore();

  // Generate a pseudo-random price based on route
  const hash = (origin + destination).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const price = 2000 + (hash % 5) * 800;

  return (
    <button
      onClick={() => {
        setOrigin(origin);
        setDestination(destination);
      }}
      className="glass-card glass-card-hover p-4 text-left flex items-center gap-3 group"
    >
      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
        <Plane className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">
          From {formatPrice(price)}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
    </button>
  );
}

/* ─── Homepage ───────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="gradient-hero min-h-screen">
      {/* Header */}
      <header className="container-app py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-[var(--font-space)]">
            Fare<span className="gradient-text">Cracker</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-sm text-[var(--text-tertiary)]">
            🇮🇳 India
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-app pt-12 sm:pt-20 pb-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-[var(--font-space)] mb-4 leading-tight">
            Har flight ka{" "}
            <span className="gradient-text">jugaad</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Compare every airline &amp; OTA. Auto-apply coupons. Optimize your
            credit card. Find the{" "}
            <span className="text-[var(--color-savings-light)] font-semibold">
              TRUE cheapest fare
            </span>
            . One search.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 text-sm text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[var(--color-primary)]" />
            <span>
              <strong className="text-[var(--text-primary)]">12,340</strong>{" "}
              deals found today
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-[var(--color-savings)]" />
            <span>
              <strong className="text-[var(--text-primary)]">₹8.2 Cr</strong>{" "}
              saved by users
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>
              <strong className="text-[var(--text-primary)]">9</strong> airlines
              compared
            </span>
          </div>
        </div>
      </section>

      {/* Airline Logos Strip */}
      <section className="container-app py-8">
        <div className="flex items-center justify-center gap-6 sm:gap-10 opacity-40 flex-wrap">
          {Object.entries(AIRLINES)
            .slice(0, 8)
            .map(([code, info]) => (
              <div
                key={code}
                className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                {info.name}
              </div>
            ))}
        </div>
      </section>

      {/* Trending Routes */}
      <section className="container-app py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-space)] mb-6">
          <Sparkles className="w-5 h-5 inline-block text-[var(--color-primary)] mr-2" />
          Trending Routes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {POPULAR_ROUTES.slice(0, 9).map((route) => (
            <TrendingRouteCard
              key={`${route.origin}-${route.destination}`}
              origin={route.origin}
              destination={route.destination}
              label={route.label}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container-app py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-space)] mb-10 text-center">
          How FareCracker Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            {
              step: "1",
              title: "Search Once",
              desc: "Enter your route. We search every airline, OTA, and metasearch engine simultaneously.",
              icon: "🔍",
            },
            {
              step: "2",
              title: "Compare Everything",
              desc: "See every option ranked by TRUE effective price — with coupons, cashback, and card offers applied.",
              icon: "📊",
            },
            {
              step: "3",
              title: "Save Maximum",
              desc: "Book the best deal directly. Track savings, set alerts, and never overpay for a flight again.",
              icon: "💰",
            },
          ].map(({ step, title, desc, icon }) => (
            <div
              key={step}
              className="text-center glass-card p-6"
            >
              <div className="text-4xl mb-4">{icon}</div>
              <div className="text-xs font-bold text-[var(--color-primary)] mb-2">
                STEP {step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-8">
        <div className="container-app text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              Fare<span className="gradient-text">Cracker</span>
            </span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            Har flight ka jugaad. Every deal. One search. 🇮🇳
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            © 2026 FareCracker. Made with ❤️ in India
          </p>
        </div>
      </footer>
    </div>
  );
}
