"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";
import { POPULAR_ROUTES, formatPrice } from "@/lib/constants";
import {
  ArrowRightLeft, Plane, Calendar, Users, ChevronDown,
  TrendingDown, Zap, Shield, MapPin, Search, Bell, ArrowRight,
} from "lucide-react";

import { MagneticButton } from "@/components/ui/MagneticButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Badge } from "@/components/ui/Badge";
import { Footer } from "@/components/layout/Footer";

const ParticleBackground = dynamic(() => import("@/components/ui/ParticleBackground"), {
  ssr: false,
});

/* ================================================================
   AIRPORT AUTOCOMPLETE INPUT
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
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--accent-primary)] mb-2 uppercase tracking-[0.15em]">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { setDisplayValue(""); if (suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--accent-primary)] transition-colors placeholder:text-[var(--text-muted)] truncate"
          autoComplete="off"
        />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 w-full mt-3 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            {suggestions.map((airport, i) => (
              <motion.button
                key={airport.iata}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-[var(--border-muted)] last:border-0"
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-primary-dim)] border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-mono text-xs tracking-wide font-bold">
                  {airport.iata}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{airport.city}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{airport.name}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   SEARCH PANEL (HERO)
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
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    swapAirports();
    setTimeout(() => setIsSwapping(false), 400);
  };

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
    <GlassCard className="p-6 md:p-8 w-full max-w-5xl mx-auto z-20">
      {/* Origin / Destination */}
      <div className="flex flex-col md:flex-row items-stretch gap-8 mb-8 relative">
        <AirportInput id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Delhi, DEL" />

        <div className="flex items-center justify-center -my-4 md:-mx-4 md:my-0 z-10">
          <MagneticButton onClick={handleSwap} className="w-12 h-12 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--bg-base)] flex items-center justify-center shrink-0 hover:border-[var(--accent-primary)] transition-colors">
            <motion.div animate={isSwapping ? { rotate: 180 } : { rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <ArrowRightLeft className="w-5 h-5 text-[var(--accent-primary)]" />
            </motion.div>
          </MagneticButton>
        </div>

        <AirportInput id="destination" label="To" value={destination} onChange={setDestination} placeholder="Mumbai, BOM" />
      </div>

      {/* Date + Passengers */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
          <label htmlFor="dep-date" className="block text-xs font-semibold text-[var(--accent-primary)] mb-2 uppercase tracking-[0.15em]">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input id="dep-date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer [color-scheme:dark]" />
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="ret-date" className="block text-xs font-semibold text-[var(--accent-primary)] mb-2 uppercase tracking-[0.15em]">Return</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input id="ret-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={departureDate} className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer placeholder:text-[var(--text-muted)] [color-scheme:dark]" />
          </div>
        </div>

        {/* Passenger Selector */}
        <div className="relative flex-1">
          <label className="block text-xs font-semibold text-[var(--accent-primary)] mb-2 uppercase tracking-[0.15em]">Travellers</label>
          <button onClick={() => setShowPassengers(!showPassengers)} className="w-full bg-transparent border-b border-[var(--border-strong)] pb-2 pl-10 text-xl font-bold focus:outline-none focus:border-[var(--accent-primary)] transition-colors text-left flex items-center justify-between relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <span>{adults + childCount + infants} <span className="font-medium opacity-60 text-lg">Seat(s)</span></span>
            <motion.div animate={{ rotate: showPassengers ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showPassengers && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-50 right-0 left-0 top-full mt-3 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-lg)]"
              >
                {[
                  { label: "Adults", sub: "12+ years", val: adults, set: (v: number) => setPassengers(v, childCount, infants), min: 1, max: 9 },
                  { label: "Children", sub: "2-11 years", val: childCount, set: (v: number) => setPassengers(adults, v, infants), min: 0, max: 8 },
                  { label: "Infants", sub: "Under 2", val: infants, set: (v: number) => setPassengers(adults, childCount, v), min: 0, max: adults },
                ].map(({ label, sub, val, set, min, max }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-[var(--border-muted)] last:border-0">
                    <div>
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => val > min && set(val - 1)} disabled={val <= min} className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-30 hover:border-[var(--accent-primary)] transition-colors text-sm">−</button>
                      <span className="w-4 text-center font-mono text-base">{val}</span>
                      <button onClick={() => val < max && set(val + 1)} disabled={val >= max} className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--border-strong)] flex items-center justify-center disabled:opacity-30 hover:border-[var(--accent-primary)] transition-colors text-sm">+</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search CTA */}
      <MagneticButton
        onClick={handleSearch}
        disabled={!origin || !destination || !departureDate || isSearching}
        className="w-full relative overflow-hidden group bg-[var(--accent-amber)] disabled:opacity-40 rounded-[var(--radius-lg)] py-4"
      >
        <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        <span className="relative z-10 flex items-center justify-center gap-2.5 text-lg font-bold text-[var(--text-inverse)]">
          {isSearching ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Find Deals
            </>
          )}
        </span>
      </MagneticButton>
    </GlassCard>
  );
}

/* ================================================================
   FEATURED DEAL CARD
   ================================================================ */
function FeaturedDealCard({ route }: { route: typeof POPULAR_ROUTES[number] }) {
  const basePrice = 2800 + Math.floor(Math.random() * 4000);
  return (
    <div className="min-w-[280px] snap-start bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden group hover:border-[var(--border-strong)] transition-all duration-300">
      {/* Image placeholder — gradient */}
      <div className="h-36 bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 flex items-center justify-center">
        <Plane className="w-10 h-10 text-[var(--accent-primary)]/30" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{route.label}</span>
          <Badge variant="warning">Hot Deal</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono-price text-xl font-bold text-[var(--accent-amber)]">
            {formatPrice(basePrice)}
          </span>
          <button className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1">
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   HOMEPAGE
   ================================================================ */
export default function HomePage() {
  return (
    <div className="min-h-[100dvh] relative font-[family-name:var(--font-dm-sans)]">
      {/* Particle Background (Three.js) */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <ParticleBackground />
      </div>

      {/* ── HERO ── */}
      <section className="relative z-10 container-app pt-20 pb-12 flex flex-col items-center justify-center min-h-[90dvh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <AnimatedText
            text="Find Flights. Break the Price."
            className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tighter text-center justify-center"
            staggerDelay={0.06}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto text-center leading-relaxed mb-12"
        >
          Real-time fare tracking, price drop alerts, and deal discovery.
          Stop overpaying for flights.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full"
        >
          <SearchPanel />
        </motion.div>

        {/* Live Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-14 text-[var(--text-muted)] uppercase tracking-[0.1em] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full animate-pulse" />
            <PriceTicker value={12340} duration={2.5} prefix="" className="text-[var(--text-secondary)]" />
            <span>searches today</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--accent-amber)] rounded-full" />
            <PriceTicker value={82} duration={2.5} prefix="₹" suffix="L" className="text-[var(--accent-amber)]" />
            <span>saved</span>
          </div>
        </div>
      </section>

      {/* Fade gradient */}
      <div className="relative z-10 h-24 bg-gradient-to-b from-transparent to-[var(--bg-base)]" />

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 bg-[var(--bg-base)] py-24">
        <div className="container-app">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">
              How AirBook Works
            </h2>
            <p className="text-[var(--text-secondary)] text-center max-w-md mx-auto mb-16">
              Three steps to never overpay for a flight again.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Search", desc: "Enter your route and dates. We scan multiple sources in real-time." },
              { icon: TrendingDown, title: "Compare", desc: "See fares from every airline, sorted by price, speed, or value." },
              { icon: Bell, title: "Track", desc: "Set alerts for any route. Get notified the moment prices drop." },
            ].map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.1}>
                <div className="text-center p-8 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-subtle)]/40 hover:border-[var(--border-strong)] transition-colors">
                  <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--accent-primary-dim)] border border-[var(--accent-primary)]/20 flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED DEALS ── */}
      <section className="relative z-10 bg-[var(--bg-base)] py-24">
        <div className="container-app">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Featured Deals</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Popular routes with the best prices right now.</p>
              </div>
              <button className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-primary)] hover:underline">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </ScrollReveal>

          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin scrollbar-thumb-[var(--border-strong)] scrollbar-track-transparent -mx-1 px-1">
            {POPULAR_ROUTES.slice(0, 6).map((route, i) => (
              <ScrollReveal key={route.label} delay={i * 0.05}>
                <FeaturedDealCard route={route} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALERT CTA ── */}
      <section className="relative z-10 bg-[var(--bg-base)] py-24">
        <div className="container-app">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg-elevated)]">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent-primary)]/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[var(--accent-amber)]/5 rounded-full blur-[80px]" />

              <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <Badge variant="deal" pulse className="mb-4">Price Alerts</Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                    Set an Alert,<br />Save Money.
                  </h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed max-w-md">
                    Track any route. We check prices every hour and notify you the moment
                    fares drop below your target. Never miss a deal.
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="px-5 py-3.5 bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors min-w-[240px]"
                    />
                    <button className="px-6 py-3.5 bg-[var(--accent-amber)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-lg)] hover:brightness-110 transition-all flex items-center gap-2 justify-center whitespace-nowrap">
                      <Bell className="w-4 h-4" />
                      Get Alerts
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-3">Free forever. No spam. Unsubscribe anytime.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── WHY AIRBOOK ── */}
      <section className="relative z-10 bg-[var(--bg-base)] py-24">
        <div className="container-app">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center tracking-tight mb-14">
              Why AirBook
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Real-Time Data", desc: "Prices updated every 15 minutes from multiple sources." },
              { icon: Shield, title: "No Hidden Fees", desc: "The price you see is the price you pay. Always." },
              { icon: TrendingDown, title: "Price Prediction", desc: "Historical data helps you decide the best time to book." },
              { icon: Plane, title: "All Airlines", desc: "IndiGo, Air India, SpiceJet, Akasa, and 50+ more." },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.08}>
                <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-subtle)]/30 hover:border-[var(--border-strong)] transition-colors">
                  <item.icon className="w-5 h-5 text-[var(--accent-primary)] mb-4" />
                  <h3 className="font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="relative z-10 bg-[var(--bg-base)]">
        <Footer />
      </div>
    </div>
  );
}
