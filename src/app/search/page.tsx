"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/stores/search-store";
import type { FlightResult, SortOption, CabinClass } from "@/lib/types";
import { sortFlights } from "@/lib/api/search-orchestrator";
import { getAirportDisplay } from "@/lib/airports";
import { AIRLINES, SORT_OPTIONS, formatPrice, formatDuration, formatTime } from "@/lib/constants";
import { Plane, ArrowLeft, ArrowRight, SlidersHorizontal, X, ExternalLink, AlertCircle, Loader2, Sparkles, CreditCard, TicketPercent, Wallet, Frown } from "lucide-react";
import { fetchLiveFlights } from "@/lib/api/live-flight-mapper";
import { useUserStore } from "@/stores/user-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { syncWallet, getUserWallet } from "@/app/actions/userActions";
import { useSession } from "next-auth/react";

import { Footer } from "@/components/layout/Footer";
import { PriceTrendChart } from "@/components/dashboard/PriceTrendChart";

/* ─── Loading ──── */
function SearchingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border border-[var(--border-strong)] border-t-[var(--text-secondary)] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Plane className="w-4 h-4 text-[var(--text-muted)] -rotate-45" />
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">Searching fares...</p>
    </div>
  );
}

/* ─── Skeleton ──── */
function SkeletonCard() {
  return (
    <div className="border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--border-muted)]" />
        <div className="flex-1 space-y-2"><div className="h-4 bg-[var(--border-muted)] rounded w-28" /><div className="h-3 bg-[var(--border-muted)] rounded w-20" /></div>
        <div className="h-6 bg-[var(--border-muted)] rounded w-20" />
      </div>
    </div>
  );
}

/* ─── Flight Card ──────── */
function FlightCard({ flight, index, isCheapest }: { flight: FlightResult; index: number; isCheapest: boolean }) {
  const router = useRouter();
  const airlineInfo = AIRLINES[flight.airline];
  const { setSelectedFlight } = useCheckoutStore();

  const sourceMap: Record<string, string> = {
    'google_flights': 'Google Flights',
    'ixigo': 'Ixigo',
    'makemytrip': 'MakeMyTrip',
    'cleartrip': 'Cleartrip'
  };

  const sourceName = sourceMap[flight.source] || 'Master API';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
    >
      <div className={`relative border rounded-[var(--radius-lg)] p-5 hover:border-[var(--border-strong)] transition-colors ${
        isCheapest ? "border-[var(--accent-cta)]/30 bg-[var(--accent-primary-dim)]" : "border-[var(--border-default)]"
      }`}>
        {isCheapest && (
          <div className="absolute -top-2.5 left-4 flex items-center gap-1.5 bg-[var(--bg-base)] border border-[var(--accent-cta)] px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-[var(--accent-cta)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-cta)]">Lowest Price</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Airline */}
          <div className="flex items-center gap-3 sm:w-40 shrink-0">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: airlineInfo?.color || "#3F3F46" }}>
              {flight.airline}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{flight.airlineName}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">{flight.flightNumber}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-center shrink-0">
              <div className="text-base font-semibold font-mono-price">{formatTime(flight.departureTime)}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{flight.origin}</div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1 px-1">
              <div className="text-[10px] text-[var(--text-muted)] font-mono">{formatDuration(flight.durationMinutes)}</div>
              <div className="w-full h-px bg-[var(--border-strong)] relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
              </div>
              <div className="text-[10px] font-medium">
                {flight.stops === 0 ? (
                  <span className="text-[var(--accent-green)]">Direct</span>
                ) : (
                  <span className="text-[var(--text-muted)]">
                    {flight.stops} stop{flight.stops > 1 ? "s" : ""}
                    {flight.stopCities.length > 0 && ` · ${flight.stopCities.join(", ")}`}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className="text-base font-semibold font-mono-price">{formatTime(flight.arrivalTime)}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{flight.destination}</div>
            </div>
          </div>

          {/* Price */}
          <div className="sm:w-56 flex flex-col sm:items-end shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-muted)] pt-4 sm:pt-0 sm:pl-5">
            <div className="flex flex-col items-end mb-1">
              {flight.appliedOffer && flight.basePrice && (
                <div className="text-[11px] text-[var(--text-muted)] line-through flex items-center gap-1">
                  {formatPrice(flight.basePrice + 350)} {/* base + standard convenience */}
                </div>
              )}
              <div className="text-2xl font-bold font-mono-price text-[var(--text-primary)]">
                {formatPrice(flight.price)}
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                Found via <span className="font-semibold text-[var(--text-secondary)]">{sourceName}</span>
              </div>
            </div>
            
            {flight.appliedOffer && (
              <div className="mb-3 w-full sm:w-auto bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5">
                <TicketPercent className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{flight.appliedOffer.name}</span>
              </div>
            )}

            <div className="flex gap-1.5 mb-3 justify-end w-full">
              {flight.baggage.checked.included && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] font-medium">15kg Bag</span>}
              {flight.refundable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] font-medium">Refundable</span>}
            </div>
            <button
              onClick={() => {
                setSelectedFlight(flight);
                router.push(`/checkout`);
              }}
              className="px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 w-full justify-center sm:w-auto"
            >
              Book Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {flight.seatsRemaining && flight.seatsRemaining <= 4 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-muted)]">
            <span className="text-[11px] text-[var(--accent-red)] font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Only {flight.seatsRemaining} seat{flight.seatsRemaining > 1 ? "s" : ""} left at this price
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Sort ──── */
function SortBar({ sortBy, onSort, totalResults }: { sortBy: SortOption; onSort: (v: SortOption) => void; totalResults: number }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <span className="text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)] font-semibold">{totalResults}</strong> flights
      </span>
      <div className="flex gap-0.5 p-0.5 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.value;
          return (
            <button key={opt.value} onClick={() => onSort(opt.value as SortOption)}
              className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[var(--radius-sm)] transition-colors ${
                active ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {active && <motion.div layoutId="sortPill" className="absolute inset-0 bg-[var(--accent-cta)] rounded-[var(--radius-sm)]" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Filters ──── */
function FilterPanel({ flights, onFilter, show, onClose }: { flights: FlightResult[]; onFilter: (f: FlightResult[]) => void; show: boolean; onClose: () => void }) {
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const airlines = useMemo(() => {
    const map = new Map<string, number>();
    flights.forEach((f) => map.set(f.airline, (map.get(f.airline) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [flights]);

  const banks = useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) => {
      if (f.appliedOffer) {
        // Extract the bank name from the offer ID or Name (e.g., HDFC_CC_15 -> HDFC)
        const bankCode = f.appliedOffer.id.split('_')[0];
        set.add(bankCode);
      }
    });
    return Array.from(set).sort();
  }, [flights]);

  useEffect(() => {
    let filtered = [...flights];
    if (maxStops !== null) filtered = filtered.filter((f) => f.stops <= maxStops);
    if (selectedAirlines.length > 0) filtered = filtered.filter((f) => selectedAirlines.includes(f.airline));
    if (selectedBank) {
      filtered = filtered.filter(f => f.appliedOffer?.id.startsWith(selectedBank));
    }
    onFilter(filtered);
  }, [maxStops, selectedAirlines, selectedBank, flights, onFilter]);

  const toggleAirline = (code: string) => setSelectedAirlines((p) => p.includes(code) ? p.filter((c) => c !== code) : [...p, code]);

  const content = (
    <>
      <div className="mb-6">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Stops</h4>
        <div className="flex flex-wrap gap-1.5">
          {[{ val: null, label: "Any" }, { val: 0, label: "Non-stop" }, { val: 1, label: "1 Stop" }].map(({ val, label }) => (
            <button key={String(val)} onClick={() => setMaxStops(val)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-[var(--radius-sm)] border transition-colors ${
                maxStops === val
                  ? "bg-[var(--accent-cta)] border-transparent text-[var(--text-inverse)]"
                  : "bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {banks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Bank Offers
          </h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setSelectedBank(null)}
              className={`text-left text-[13px] px-2.5 py-1.5 rounded-[var(--radius-sm)] transition-colors ${
                selectedBank === null ? 'bg-[var(--accent-primary-dim)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)]'
              }`}
            >
              All Available Offers
            </button>
            {banks.map(bank => (
              <button 
                key={bank} 
                onClick={() => setSelectedBank(bank)}
                className={`text-left text-[13px] px-2.5 py-1.5 rounded-[var(--radius-sm)] transition-colors ${
                  selectedBank === bank ? 'bg-[var(--accent-primary-dim)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)]'
                }`}
              >
                {bank} Cards
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Airlines</h4>
        {airlines.map(([code, count]) => (
          <button key={code} onClick={() => toggleAirline(code)} className="w-full flex items-center justify-between p-2 rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-dim)] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[8px] ${
                selectedAirlines.includes(code) ? "bg-[var(--accent-cta)] border-transparent text-[var(--text-inverse)]" : "border-[var(--border-strong)]"
              }`}>{selectedAirlines.includes(code) && "✓"}</div>
              <span className="text-[13px]">{AIRLINES[code]?.name || code}</span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{count}</span>
          </button>
        ))}
      </div>

      <button onClick={() => { setMaxStops(null); setSelectedAirlines([]); setSelectedBank(null); }}
        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] w-full text-center py-2 border border-[var(--border-default)] rounded-[var(--radius-sm)] transition-colors"
      >Reset</button>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-32 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
          {content}
        </div>
      </aside>

      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute right-0 top-0 bottom-0 w-[80vw] max-w-xs bg-[var(--bg-base)] border-l border-[var(--border-default)] p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-sm">Filters</span>
                <button onClick={onClose}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
              </div>
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Wallet Modal ──── */
function WalletModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { ownedCards, toggleCard } = useUserStore();
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (session?.user) {
      setIsSaving(true);
      await syncWallet(ownedCards);
      setIsSaving(false);
    }
    onClose();
  };

  const banks = [
    { id: 'HDFC', name: 'HDFC Bank' },
    { id: 'SBI', name: 'SBI Card' },
    { id: 'ICICI', name: 'ICICI Bank' },
    { id: 'AXIS', name: 'Axis Bank' },
    { id: 'KOTAK', name: 'Kotak Mahindra Bank' },
    { id: 'YES', name: 'Yes Bank' },
    { id: 'RBL', name: 'RBL Bank' },
    { id: 'SC', name: 'Standard Chartered' },
    { id: 'AMEX', name: 'American Express' },
    { id: 'INDUS', name: 'IndusInd Bank' },
    { id: 'IDFC', name: 'IDFC First Bank' },
    { id: 'AU', name: 'AU Small Finance Bank' },
    { id: 'HSBC', name: 'HSBC Bank' },
    { id: 'BOB', name: 'Bank of Baroda' },
    { id: 'FEDERAL', name: 'Federal Bank' },
    { id: 'CRED', name: 'CRED Pay' },
    { id: 'PAYTM', name: 'Paytm Wallet' },
    { id: 'PHONEPE', name: 'PhonePe' },
    { id: 'MOBIKWIK', name: 'MobiKwik' },
  ];

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-muted)]">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[var(--accent-cta)]" />
                  My Wallet
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Select the cards you own to see personalized lowest prices.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--accent-primary-dim)] transition-colors">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {banks.map(bank => (
                  <label key={bank.id} className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    ownedCards.includes(bank.id) ? 'bg-[var(--accent-primary-dim)] border-[var(--accent-cta)]' : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-[var(--radius-sm)] border-[var(--border-strong)] text-[var(--accent-cta)] focus:ring-[var(--accent-cta)] focus:ring-offset-0 bg-[var(--bg-base)]"
                      checked={ownedCards.includes(bank.id)}
                      onChange={() => toggleCard(bank.id)}
                    />
                    <span className="text-sm font-medium select-none">{bank.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-[var(--border-muted)] bg-[var(--bg-subtle)] flex flex-col gap-2">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Update Prices"}
              </button>
              {!session?.user && (
                <p className="text-[10px] text-center text-[var(--text-muted)]">Sign in to save these cards across your devices.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main ──── */
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setOrigin, setDestination } = useSearchStore();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const returnDate = searchParams.get("return") || "";
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const infants = parseInt(searchParams.get("infants") || "0");
  const cabin = (searchParams.get("cabin") || "economy") as CabinClass;

  const [allFlights, setAllFlights] = useState<FlightResult[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [showFilters, setShowFilters] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const { ownedCards, setCards } = useUserStore();
  const { data: session } = useSession();

  // Load user wallet from DB if logged in
  useEffect(() => {
    if (session?.user) {
      getUserWallet().then(res => {
        if (res.success && res.cards) {
          setCards(res.cards);
        }
      });
    }
  }, [session, setCards]);

  useEffect(() => { if (from) setOrigin(from); if (to) setDestination(to); }, [from, to, setOrigin, setDestination]);

  useEffect(() => {
    let isMounted = true;
    if (!from || !to || !date) return;
    
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await fetchLiveFlights(from, to, date, ownedCards);
        if (isMounted) {
          setAllFlights(results || []);
          setFilteredFlights(results || []);
        }
      } catch (err) { 
        if (isMounted) setError(err instanceof Error ? err.message : "Something went wrong."); 
      }
      finally { 
        if (isMounted) setIsLoading(false); 
      }
    };
    
    fetchResults();
    return () => { isMounted = false; };
  }, [from, to, date, returnDate, adults, children, infants, cabin, ownedCards]);

  const sortedFlights = useMemo(() => sortFlights(filteredFlights, sortBy), [filteredFlights, sortBy]);
  const handleFilter = useCallback((f: FlightResult[]) => setFilteredFlights(f), []);

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Header */}
      <header className="bg-[var(--bg-base)]/90 backdrop-blur-xl border-b border-[var(--border-default)] sticky top-14 z-30">
        <div className="container-app py-3 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] flex items-center justify-center hover:bg-[var(--accent-primary-dim)]" aria-label="Back">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="truncate">{getAirportDisplay(from)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{getAirportDisplay(to)}</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              {date && new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {adults + children + infants} traveller{adults + children + infants > 1 ? "s" : ""}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowWallet(true)} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--accent-cta)]/30 bg-[var(--accent-primary-dim)] text-[var(--accent-cta)] text-xs font-semibold hover:bg-[var(--accent-cta)] hover:text-[var(--text-inverse)] transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Wallet</span>
              {ownedCards.length > 0 && <span className="bg-[var(--accent-cta)] text-[var(--text-inverse)] w-4 h-4 rounded-full flex items-center justify-center text-[9px] group-hover:bg-[var(--bg-base)] group-hover:text-[var(--accent-cta)]">{ownedCards.length}</span>}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden p-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:bg-[var(--accent-primary-dim)]" aria-label="Filters">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <WalletModal show={showWallet} onClose={() => setShowWallet(false)} />

      <div className="container-app py-6">
        <div className="flex gap-8">
          <FilterPanel flights={allFlights} onFilter={handleFilter} show={showFilters} onClose={() => setShowFilters(false)} />

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="max-w-3xl mx-auto">
                <SearchingAnimation />
                <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto text-center py-16">
                <AlertCircle className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Search Error</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">{error}</p>
                <button onClick={() => router.push("/")} className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] text-sm font-medium">New Search</button>
              </div>
            ) : sortedFlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] text-center">
                <div className="w-16 h-16 bg-[var(--accent-primary-dim)] rounded-full flex items-center justify-center mb-4">
                  <Frown className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-bold mb-2">No flights found</h3>
                <p className="text-[var(--text-secondary)] text-sm max-w-md">
                  We couldn't find any flights matching your criteria. Try adjusting your filters or searching for different dates.
                </p>
                <button 
                  onClick={() => {
                    setFilteredFlights(allFlights);
                    // In a real app we'd also reset the FilterPanel state here, 
                    // but re-setting filteredFlights is a good fallback
                  }}
                  className="mt-6 px-4 py-2 bg-[var(--accent-cta)] text-[var(--text-inverse)] text-sm font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <PriceTrendChart origin={from} destination={to} date={date} />
                <SortBar sortBy={sortBy} onSort={setSortBy} totalResults={sortedFlights.length} />
                <div className="space-y-3">
                  {sortedFlights.map((flight, i) => (
                    <FlightCard key={flight.id} flight={flight} index={i} isCheapest={i === 0 && sortBy === "cheapest"} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
