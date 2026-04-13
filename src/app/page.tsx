"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";
import { POPULAR_ROUTES, formatPrice, AIRLINES } from "@/lib/constants";
import {
  Search, ArrowRightLeft, Plane, Calendar, Users, ChevronDown,
  Sparkles, TrendingDown, Zap, Shield, MapPin, ArrowRight,
  Globe, CreditCard, Bell
} from "lucide-react";

/* ================================================================
   ANIMATED BACKGROUND — Floating particles + gradient orbs
   ================================================================ */
function AnimatedBackground() {
  return <div className="aurora-bg" />;
}

/* ================================================================
   TYPEWRITER EFFECT — Cycles through taglines
   ================================================================ */
const TAGLINES = [
  "Fluid spatial computing.",
  "Every airline. One elegant search.",
  "Immersive cinematic booking.",
  "Experience atmospheric travel.",
];

function TypewriterText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = TAGLINES[currentIndex];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && displayText === current) {
      const pause = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pause);
    }

    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % TAGLINES.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? current.substring(0, displayText.length - 1)
          : current.substring(0, displayText.length + 1)
      );
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="inline-flex items-center">
      <span className="gradient-text">{displayText}</span>
      <span className="typewriter-cursor" />
    </span>
  );
}

/* ================================================================
   ANIMATED COUNTER — Numbers roll up from 0
   ================================================================ */
function AnimatedCounter({
  end,
  prefix = "",
  suffix = "",
  duration = 2000,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref} className="tabular-nums font-bold text-[var(--text-primary)]">
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ================================================================
   AIRPORT AUTOCOMPLETE — With animated dropdown
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
          className="input-spatial pl-[2.75rem] font-medium truncate"
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
            className="absolute z-50 w-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden"
          >
            {suggestions.map((airport, i) => (
              <motion.button
                key={airport.iata}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center gap-3 border-b border-[var(--border-primary)] last:border-0"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  className="w-10 h-10 rounded-lg bg-[var(--color-primary-glow)] flex items-center justify-center text-[var(--color-primary)] font-bold text-sm"
                >
                  {airport.iata}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                    {airport.city}
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
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   SEARCH BAR — With glow animation and micro-interactions
   ================================================================ */
function SearchBar() {
  const router = useRouter();
  const {
    origin, destination, departureDate, returnDate,
    adults, children: childCount, infants, cabinClass,
    setOrigin, setDestination, swapAirports, setDepartureDate,
    setReturnDate, setPassengers, isSearching, setSearching,
  } = useSearchStore();

  const [showPassengers, setShowPassengers] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
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
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-gradient p-4 sm:p-6 w-full max-w-4xl mx-auto animate-glow"
    >
      <div className="flex flex-col md:flex-row items-stretch gap-6 mb-6">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi, DEL" />

        <motion.button
          onClick={handleSwap}
          animate={isSwapping ? { rotate: 180, scale: 1.2 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.15, borderColor: "rgba(0,229,255,0.5)" }}
          whileTap={{ scale: 0.9 }}
          className="self-center md:self-end md:mb-2 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 hover:bg-white/5"
          aria-label="Swap airports"
        >
          <ArrowRightLeft className="w-5 h-5 text-white/70" />
        </motion.button>

        <AirportInput id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai, BOM" />
      </div>

      {/* Date / Passengers */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="flex-1">
          <label htmlFor="departure-date" className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input id="departure-date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="input-spatial text-lg pl-[2.75rem] font-medium" min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="return-date" className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">Return <span className="text-[var(--text-tertiary)]">(optional)</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="input-spatial text-lg pl-[2.75rem] font-medium" min={departureDate} />
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">Travellers</label>
          <button onClick={() => setShowPassengers(!showPassengers)} className="input-spatial text-lg pl-[2.75rem] flex items-center justify-between min-w-[140px] font-medium !border-b-2 bg-transparent w-full">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="truncate pr-4">{adults + childCount + infants} {adults + childCount + infants === 1 ? "Traveller" : "Travellers"}</span>
            <motion.div animate={{ rotate: showPassengers ? 180 : 0 }} className="absolute right-0 top-1/2 -translate-y-1/2" transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showPassengers && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-50 right-0 top-full mt-2 w-64 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4 shadow-2xl"
              >
                {[
                  { label: "Adults", sublabel: "12+ years", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                  { label: "Children", sublabel: "2-12 years", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                  { label: "Infants", sublabel: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
                ].map(({ label, sublabel, val, set, min, max }) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-[var(--text-tertiary)]">{sublabel}</div></div>
                    <div className="flex items-center gap-3">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center text-sm disabled:opacity-30 hover:border-[var(--color-primary)]">−</motion.button>
                      <motion.span key={val} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center font-semibold">{val}</motion.span>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center text-sm disabled:opacity-30 hover:border-[var(--color-primary)]">+</motion.button>
                    </div>
                  </div>
                ))}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPassengers(false)} className="w-full mt-3 btn-primary text-sm py-2">Done</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Button */}
      <motion.button
        onClick={handleSearch}
        disabled={!origin || !destination || !departureDate || isSearching}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-40"
      >
        {isSearching ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
            Searching across all sources...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Flights
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

/* ================================================================
   TRENDING ROUTE CARD — With hover glow + micro-animation
   ================================================================ */
function TrendingRouteCard({
  origin, destination, label, index,
}: {
  origin: string; destination: string; label: string; index: number;
}) {
  const { setOrigin, setDestination } = useSearchStore();
  const hash = (origin + destination).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const price = 2000 + (hash % 5) * 800;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => { setOrigin(origin); setDestination(destination); }}
      className="spatial-container !p-5 text-left flex items-center gap-4 group cursor-pointer"
    >
      <motion.div
        whileHover={{ rotate: 12, scale: 1.1 }}
        className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0"
      >
        <Plane className="w-6 h-6 text-white" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium truncate">{label}</div>
        <div className="text-sm text-[var(--text-secondary)]">From {formatPrice(price)}</div>
      </div>
      <motion.div
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
      </motion.div>
    </motion.button>
  );
}

/* ================================================================
   FEATURE CARD — How it works section with entrance animation
   ================================================================ */
function FeatureCard({
  step, title, desc, icon, index,
}: {
  step: string; title: string; desc: string; icon: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="text-center spatial-container border-transparent relative overflow-hidden group"
    >
      {/* Glow overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-[rgba(0,229,255,0.03)] to-transparent pointer-events-none" />
      
      <motion.div
        className="text-4xl mb-4 relative z-10"
        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <div className="text-sm font-bold text-[var(--color-primary)] mb-3 tracking-widest">STEP {step}</div>
      <h3 className="text-xl font-medium mb-3">{title}</h3>
      <p className="text-base text-[var(--text-secondary)] leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ================================================================
   VALUE PROP CARDS — Animated on scroll
   ================================================================ */
function ValueProps() {
  const props = [
    { icon: <Globe className="w-6 h-6" />, title: "Every Airline", desc: "IndiGo, Air India, SpiceJet, Vistara, Akasa — all in one search", color: "#3B82F6" },
    { icon: <CreditCard className="w-6 h-6" />, title: "Card Optimization", desc: "HDFC, ICICI, SBI, Axis — auto-apply the best credit card cashback", color: "#10B981" },
    { icon: <Bell className="w-6 h-6" />, title: "Price Alerts", desc: "Get notified when fares drop on your tracked routes", color: "#F59E0B" },
  ];

  return (
    <section className="container-app py-12 sm:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {props.map((prop, i) => (
          <motion.div
            key={prop.title}
            initial={{ opacity: 0, x: i === 0 ? -30 : i === 2 ? 30 : 0, y: i === 1 ? 30 : 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            className="glass-card p-5 flex items-start gap-4 border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-colors"
          >
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${prop.color}15`, color: prop.color }}
            >
              {prop.icon}
            </motion.div>
            <div>
              <h3 className="font-semibold mb-1">{prop.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{prop.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ================================================================
   AIRLINE TICKER — Horizontal scrolling airline strip
   ================================================================ */
function AirlineTicker() {
  const airlineList = Object.entries(AIRLINES).slice(0, 9);
  const doubled = [...airlineList, ...airlineList]; // double for seamless loop

  return (
    <section className="container-app py-8 overflow-hidden">
      <motion.div
        className="flex items-center gap-10"
        animate={{ x: [0, -(airlineList.length * 130)] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map(([code, info], i) => (
          <div
            key={`${code}-${i}`}
            className="flex items-center gap-2 shrink-0 opacity-30 hover:opacity-60 transition-opacity"
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
            <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{info.name}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* ================================================================
   HOMEPAGE — Full page with all animations
   ================================================================ */
export default function HomePage() {
  return (
    <div className="gradient-hero min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container-app py-4 flex items-center justify-between relative z-20"
      >
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
        >
          <motion.div
            className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 12 }}
          >
            <Plane className="w-5 h-5 text-black" />
          </motion.div>
          <span className="text-2xl font-bold tracking-tight px-1">Atmos</span>
        </motion.div>
        <span className="hidden sm:inline-block text-sm font-medium tracking-widest text-[var(--text-secondary)]">V1.0</span>
      </motion.header>

      {/* Hero */}
      <section className="container-app pt-12 sm:pt-20 pb-8 relative z-20">
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight"
            style={{ fontFamily: "var(--font-space), system-ui" }}
          >
            <TypewriterText />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed font-light"
          >
            The world's most elegant flight orchestrator. No ads, no popups. Just pure, immersive travel intelligence.
          </motion.p>
        </div>

        <SearchBar />

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 text-sm text-[var(--text-tertiary)]"
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[var(--color-primary)]" />
            <span><AnimatedCounter end={12340} /> deals found today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-[var(--color-savings)]" />
            <span><AnimatedCounter end={82} prefix="₹" suffix=" Lakhs" /> saved by users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-400" />
            <span><AnimatedCounter end={9} /> airlines compared</span>
          </div>
        </motion.div>
      </section>

      {/* Airline Ticker */}
      <AirlineTicker />

      {/* Trending Routes */}
      <section className="container-app py-8 sm:py-12 relative z-10">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold mb-6"
          style={{ fontFamily: "var(--font-space), system-ui" }}
        >
          <Sparkles className="w-5 h-5 inline-block text-[var(--color-primary)] mr-2 animate-glow-breathe" />
          Trending Routes
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {POPULAR_ROUTES.slice(0, 9).map((route, i) => (
            <TrendingRouteCard
              key={`${route.origin}-${route.destination}`}
              origin={route.origin}
              destination={route.destination}
              label={route.label}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Value Props */}
      <ValueProps />

      {/* How It Works */}
      <section className="container-app py-12 sm:py-20 relative z-10">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xl sm:text-2xl font-bold mb-10 text-center"
          style={{ fontFamily: "var(--font-space), system-ui" }}
        >
          How Atmos Works
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { step: "1", title: "Search Once", desc: "Enter your route. We search every airline, OTA, and metasearch engine simultaneously.", icon: "🔍" },
            { step: "2", title: "Compare Everything", desc: "See every option ranked by TRUE effective price — with coupons, cashback, and card offers applied.", icon: "📊" },
            { step: "3", title: "Save Maximum", desc: "Book the best deal directly. Track savings, set alerts, and never overpay for a flight again.", icon: "💰" },
          ].map((f, i) => (
            <FeatureCard key={f.step} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-white/5 py-12 relative z-10 mt-12"
      >
        <div className="container-app text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium tracking-wide">Atmos</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">The world's most elegant flight orchestration.</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-4 opacity-50">© 2026 Atmos.</p>
        </div>
      </motion.footer>
    </div>
  );
}
