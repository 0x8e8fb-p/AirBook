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
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 4 + Math.random() * 8,
      delay: Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.25,
    })),
    []
  );

  return (
    <div className="particles-container">
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 107, 0, 0.08), transparent 70%)",
          top: "-200px",
          left: "30%",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 10, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(30, 64, 175, 0.06), transparent 70%)",
          bottom: "10%",
          right: "10%",
        }}
        animate={{
          x: [0, -20, 15, 0],
          y: [0, 15, -10, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -(200 + Math.random() * 300)],
            x: [0, (Math.random() - 0.5) * 60],
            opacity: [0, p.opacity, p.opacity, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ================================================================
   FLOATING AIRPLANE — Crosses the hero section
   ================================================================ */
function FloatingPlane() {
  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      initial={{ x: "-10vw", y: "20vh", rotate: -8 }}
      animate={{ x: "110vw", y: "8vh", rotate: -8 }}
      transition={{ duration: 18, repeat: Infinity, repeatDelay: 8, ease: "linear" }}
    >
      <div className="relative">
        <Plane className="w-6 h-6 text-[var(--color-primary)] opacity-20" />
        {/* Contrail */}
        <motion.div
          className="absolute top-1/2 right-full h-[1px] bg-gradient-to-l from-[rgba(255,107,0,0.15)] to-transparent"
          style={{ width: 120 }}
        />
      </div>
    </motion.div>
  );
}

/* ================================================================
   TYPEWRITER EFFECT — Cycles through taglines
   ================================================================ */
const TAGLINES = [
  "Har flight ka jugaad",
  "हर फ्लाइट का जुगाड़",
  "Every deal. One search.",
  "Save ₹₹₹ on every booking",
  "Compare 9 airlines instantly",
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
          className="input-field pl-10 text-base font-medium"
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
                    <span className="text-[var(--text-tertiary)] ml-1.5 text-xs">
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
      {/* Origin / Destination */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-4">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi, दिल्ली, DEL" />

        <motion.button
          onClick={handleSwap}
          animate={isSwapping ? { rotate: 180, scale: 1.2 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.15, borderColor: "rgba(255,107,0,0.5)" }}
          whileTap={{ scale: 0.9 }}
          className="self-center sm:self-end sm:mb-0.5 w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center shrink-0"
          aria-label="Swap airports"
        >
          <ArrowRightLeft className="w-4 h-4 text-[var(--text-secondary)]" />
        </motion.button>

        <AirportInput id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai, मुंबई, BOM" />
      </div>

      {/* Date / Passengers */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="departure-date" className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input id="departure-date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="input-field pl-10 font-medium" min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="return-date" className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">Return <span className="text-[var(--text-tertiary)]">(optional)</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="input-field pl-10 font-medium" min={departureDate} />
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5 uppercase tracking-wider">Travellers</label>
          <button onClick={() => setShowPassengers(!showPassengers)} className="input-field flex items-center gap-2 min-w-[140px] font-medium">
            <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span>{adults + childCount + infants} {adults + childCount + infants === 1 ? "Traveller" : "Travellers"}</span>
            <motion.div animate={{ rotate: showPassengers ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] ml-auto" />
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
      className="glass-card p-4 text-left flex items-center gap-3 group border border-[var(--border-primary)] hover:border-[var(--border-accent)] transition-colors"
    >
      <motion.div
        whileHover={{ rotate: 12, scale: 1.1 }}
        className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0"
      >
        <Plane className="w-5 h-5 text-white" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">From {formatPrice(price)}</div>
      </div>
      <motion.div
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
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
      className="text-center glass-card p-6 border border-[var(--border-primary)] hover:border-[var(--border-accent)] transition-colors relative overflow-hidden group"
    >
      {/* Glow overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-[rgba(255,107,0,0.03)] to-transparent pointer-events-none" />
      
      <motion.div
        className="text-4xl mb-4 relative z-10"
        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <div className="text-xs font-bold text-[var(--color-primary)] mb-2 tracking-widest">STEP {step}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
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
      <FloatingPlane />

      {/* Header */}
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
            className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 12 }}
          >
            <Plane className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold">
            Fare<span className="gradient-text">Cracker</span>
          </span>
        </motion.div>
        <span className="hidden sm:inline-block text-sm text-[var(--text-tertiary)]">🇮🇳 India</span>
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
            className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
          >
            Compare every airline &amp; OTA. Auto-apply coupons. Optimize your credit card. Find the{" "}
            <span className="text-[var(--color-savings-light)] font-semibold">TRUE cheapest fare</span>. One search.
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
          How FareCracker Works
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
        className="border-t border-[var(--border-primary)] py-8 relative z-10"
      >
        <div className="container-app text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Fare<span className="gradient-text">Cracker</span></span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">Har flight ka jugaad. Every deal. One search. 🇮🇳</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">© 2026 FareCracker. Made with ❤️ in India</p>
        </div>
      </motion.footer>
    </div>
  );
}
