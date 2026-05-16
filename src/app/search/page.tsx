"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CreditCard,
  FilterX,
  Frown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TicketPercent,
  Wallet,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { subscribePriceAlert } from "@/app/actions/alertActions";
import { getIntelligenceCombined } from "@/app/actions/intelligenceActions";
import { getUserWallet, syncWallet } from "@/app/actions/userActions";
import { PriceTrendChart } from "@/components/dashboard/PriceTrendChart";
import { Footer } from "@/components/layout/Footer";
import { AlternativeItineraries } from "@/components/ui/AlternativeItineraries";
import { AirlineLogo } from "@/components/ui/AirlineLogo";
import { CostCuttingTips } from "@/components/ui/CostCuttingTips";
import { DateHinter } from "@/components/ui/DateHinter";
import { FareDipAlert } from "@/components/ui/FareDipAlert";
import { GroupBookCTA } from "@/components/ui/GroupBookCTA";
import { getAirportDisplay } from "@/lib/airports";
import { AVAILABLE_BANK_CARDS } from "@/lib/banks";
import {
  AIRLINES,
  SORT_OPTIONS,
  formatDuration,
  formatPrice,
  formatTime,
  getAirlineCodeFromFlight,
  getAirlineLogoForFlight,
} from "@/lib/constants";
import { fetchFlights } from "@/lib/api/live-flight-mapper";
import type { CabinClass, FlightResult, SortOption } from "@/lib/types";
import { formatBankName, formatPlatformName, isWalletMatch, sortFlights } from "@/lib/utils";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useSearchStore } from "@/stores/search-store";
import { useUserStore } from "@/stores/user-store";

type AlertFeedback = {
  kind: "success" | "error";
  message: string;
  routeKey: string;
};

type FilterPanelProps = {
  flights: FlightResult[];
  show: boolean;
  onClose: () => void;
  onFilter: (flights: FlightResult[], activeCount: number) => void;
};

function formatCabinLabel(cabin: CabinClass) {
  return cabin.replace(/_/g, " ");
}

function buildSearchHref(options: {
  from: string;
  to: string;
  date: string;
  adults: number;
  children: number;
  infants: number;
  cabin: CabinClass;
  returnDate?: string;
}) {
  const params = new URLSearchParams({
    from: options.from,
    to: options.to,
    date: options.date,
    adults: String(options.adults),
    children: String(options.children),
    infants: String(options.infants),
    cabin: options.cabin,
  });

  if (options.returnDate) {
    params.set("return", options.returnDate);
  }

  return `/search?${params.toString()}`;
}

function FlightCardSkeleton() {
  return (
    <div className="surface-card rounded-[28px] p-5 md:p-6 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--bg-subtle)] to-transparent" />
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[var(--bg-subtle)]" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-[var(--bg-subtle)]" />
              <div className="h-2.5 w-16 rounded bg-[var(--bg-subtle)]" />
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
            <div className="space-y-2">
              <div className="h-5 w-12 rounded bg-[var(--bg-subtle)]" />
              <div className="h-2.5 w-8 rounded bg-[var(--bg-subtle)]" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-16 rounded bg-[var(--bg-subtle)] mx-auto" />
              <div className="h-px w-full bg-[var(--border-default)]" />
              <div className="h-2.5 w-20 rounded bg-[var(--bg-subtle)] mx-auto" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 w-12 rounded bg-[var(--bg-subtle)] ml-auto" />
              <div className="h-2.5 w-8 rounded bg-[var(--bg-subtle)] ml-auto" />
            </div>
          </div>
        </div>

        <div className="md:w-[220px] space-y-3 md:border-l md:border-[var(--border-default)] md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border-default)]">
          <div className="h-6 w-24 rounded bg-[var(--bg-subtle)] ml-auto" />
          <div className="h-3 w-28 rounded bg-[var(--bg-subtle)] ml-auto" />
          <div className="h-10 w-full rounded-full bg-[var(--bg-subtle)]" />
        </div>
      </div>
    </div>
  );
}

function FlightCard({
  flight,
  index,
  isCheapest,
  ownedCards,
  onBook,
}: {
  flight: FlightResult;
  index: number;
  isCheapest: boolean;
  ownedCards: string[];
  onBook: (flight: FlightResult) => void;
}) {
  const airlineCode = getAirlineCodeFromFlight(flight);
  const airlineName =
    flight.airlineName ||
    (airlineCode ? AIRLINES[airlineCode]?.name : undefined) ||
    flight.airline;
  const airlineLogo = getAirlineLogoForFlight(flight);
  const maxDiscount = flight.basePrice && flight.price ? Math.max(0, flight.basePrice + 350 - flight.price) : 0;
  const walletMatch = isWalletMatch(flight, ownedCards);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={`surface-card rounded-[30px] p-5 md:p-6 relative overflow-hidden ${
        isCheapest ? "ring-1 ring-[color-mix(in_srgb,var(--accent-cta)_18%,transparent)]" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent-cta)_20%,transparent)] to-transparent" />

      <div className="flex flex-wrap gap-2 mb-4">
        {isCheapest && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-cta)]/25 bg-[var(--accent-primary-dim)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cta)]">
            <Sparkles className="w-3 h-3" />
            Lowest price
          </div>
        )}
        {walletMatch && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-green)]/25 bg-[var(--accent-green)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-green)]">
            <Wallet className="w-3 h-3" />
            In your wallet
          </div>
        )}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3 lg:w-44 shrink-0">
          <AirlineLogo src={airlineLogo} alt={airlineName} seed={airlineName} size={44} className="bg-[var(--bg-base)]" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{airlineName}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">{flight.flightNumber || "Flight details pending"}</div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4">
            <div>
              <div className="text-xl font-semibold font-mono-price">{formatTime(flight.departureTime)}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{flight.origin}</div>
            </div>

            <div className="px-1">
              <div className="text-[11px] text-[var(--text-muted)] text-center font-mono mb-1.5">
                {formatDuration(flight.durationMinutes)}
              </div>
              <div className="h-px bg-[var(--border-strong)] relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
              </div>
              <div className="text-[11px] text-center mt-1.5 text-[var(--text-secondary)]">
                {flight.stops === 0 ? "Non-stop" : flight.stopCities.length > 0 ? flight.stopCities.join(", ") : `${flight.stops} stop route`}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-semibold font-mono-price">{formatTime(flight.arrivalTime)}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{flight.destination}</div>
            </div>
          </div>
        </div>

        <div className="lg:w-[240px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border-muted)] pt-4 lg:pt-0 lg:pl-6">
          <div className="flex flex-col lg:items-end gap-3">
            <div className="flex flex-col lg:items-end">
              {flight.appliedOffer && flight.basePrice ? (
                <div className="text-[11px] text-[var(--text-muted)] line-through">{formatPrice(flight.basePrice + 350)}</div>
              ) : null}
              <div className="text-3xl font-semibold font-mono-price tracking-tight">{formatPrice(flight.price)}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Final effective fare</div>
            </div>

            {flight.appliedOffer ? (
              <div className="w-full rounded-[18px] border border-[var(--accent-green)]/18 bg-[var(--accent-green)]/10 p-3 text-[11px] text-[var(--accent-green)]">
                <div className="flex items-start gap-2">
                  <TicketPercent className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      {maxDiscount > 0 ? `Save ${formatPrice(maxDiscount)}` : flight.appliedOffer.name}
                    </div>
                    <div className="mt-1 leading-relaxed">
                      {formatPlatformName(flight.appliedOffer.platform, flight.appliedOffer.bankCode, flight.appliedOffer.category)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-1.5 lg:justify-end">
              {flight.baggage.checked.included && (
                <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">15kg bag</span>
              )}
              {flight.refundable && (
                <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">Refundable</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onBook(flight)}
              className="w-full rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              Continue to checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {flight.seatsRemaining && flight.seatsRemaining <= 4 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/8 px-4 py-3 text-[12px] text-[var(--accent-red)] inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Only {flight.seatsRemaining} seat{flight.seatsRemaining > 1 ? "s" : ""} left at this price.
        </div>
      ) : null}
    </motion.article>
  );
}

function SortBar({
  sortBy,
  onSort,
  totalResults,
  activeFilterCount,
}: {
  sortBy: SortOption;
  onSort: (value: SortOption) => void;
  totalResults: number;
  activeFilterCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
      <div className="flex items-center gap-2 flex-wrap text-sm text-[var(--text-secondary)]">
        <span>
          <strong className="text-[var(--text-primary)] font-semibold">{totalResults}</strong> flights ranked for this route
        </span>
        {activeFilterCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1 p-1 bg-[var(--bg-subtle)] rounded-full border border-[var(--border-default)]">
        {SORT_OPTIONS.map((option) => {
          const active = sortBy === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSort(option.value as SortOption)}
              className={`relative px-3 py-2 text-[11px] font-medium rounded-full transition-colors ${
                active ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {active ? (
                <motion.div
                  layoutId="sortPill"
                  className="absolute inset-0 bg-[var(--accent-cta)] rounded-full"
                  transition={{ type: "spring", bounce: 0.16, duration: 0.35 }}
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterPanel({ flights, show, onClose, onFilter }: FilterPanelProps) {
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const airlines = useMemo(() => {
    const counts = new Map<string, number>();
    flights.forEach((flight) => counts.set(flight.airline, (counts.get(flight.airline) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [flights]);

  const banks = useMemo(() => {
    const seen = new Map<string, string>();
    flights.forEach((flight) => {
      if (flight.appliedOffer?.bankCode) {
        const code = flight.appliedOffer.bankCode;
        if (!seen.has(code)) {
          seen.set(code, formatBankName(code));
        }
      }
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [flights]);

  useEffect(() => {
    let filtered = [...flights];
    if (maxStops !== null) filtered = filtered.filter((flight) => flight.stops <= maxStops);
    if (selectedAirlines.length > 0) filtered = filtered.filter((flight) => selectedAirlines.includes(flight.airline));
    if (selectedBank) filtered = filtered.filter((flight) => flight.appliedOffer?.bankCode === selectedBank);

    const activeCount = (maxStops !== null ? 1 : 0) + (selectedAirlines.length > 0 ? 1 : 0) + (selectedBank ? 1 : 0);
    onFilter(filtered, activeCount);
  }, [flights, maxStops, onFilter, selectedAirlines, selectedBank]);

  const resetFilters = () => {
    setMaxStops(null);
    setSelectedAirlines([]);
    setSelectedBank(null);
  };

  const content = (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Filter fares</h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Trim the result set by stops, bank savings, and airline.</p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <FilterX className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="mb-6">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Stops</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { value: null, label: "Any" },
            { value: 0, label: "Non-stop" },
            { value: 1, label: "1 stop max" },
          ].map((item) => (
            <button
              key={String(item.value)}
              type="button"
              onClick={() => setMaxStops(item.value)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium border transition-colors ${
                maxStops === item.value
                  ? "bg-[var(--accent-cta)] border-transparent text-[var(--text-inverse)]"
                  : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {banks.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Bank offers
          </h4>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedBank(null)}
              className={`w-full text-left rounded-[18px] px-3 py-2.5 text-[13px] transition-colors ${
                selectedBank === null
                  ? "bg-[var(--accent-primary-dim)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
              }`}
            >
              All available offers
            </button>
            {banks.map(([code, displayName]) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedBank(code)}
                className={`w-full text-left rounded-[18px] px-3 py-2.5 text-[13px] transition-colors ${
                  selectedBank === code
                    ? "bg-[var(--accent-primary-dim)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
                }`}
              >
                {displayName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Airlines</h4>
        <div className="space-y-2">
          {airlines.map(([code, count]) => {
            const active = selectedAirlines.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() =>
                  setSelectedAirlines((current) =>
                    current.includes(code) ? current.filter((airline) => airline !== code) : [...current, code],
                  )
                }
                className="w-full flex items-center justify-between rounded-[18px] px-3 py-2.5 hover:bg-[var(--accent-primary-dim)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[8px] ${
                      active ? "bg-[var(--accent-cta)] border-transparent text-[var(--text-inverse)]" : "border-[var(--border-strong)]"
                    }`}
                  >
                    {active ? "✓" : null}
                  </div>
                  <span className="text-[13px]">{AIRLINES[code]?.name || code}</span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-32 surface-panel rounded-[28px] p-5">{content}</div>
      </aside>

      <AnimatePresence>
        {show ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[86vw] max-w-sm bg-[var(--bg-base)] border-l border-[var(--border-default)] p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-semibold text-sm">Filters</span>
                <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-[var(--accent-primary-dim)]">
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              {content}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

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

  return (
    <AnimatePresence>
      {show ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg surface-panel rounded-[32px] overflow-hidden flex flex-col max-h-[88vh]"
          >
            <div className="flex items-start justify-between p-5 border-b border-[var(--border-muted)]">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[var(--accent-cta)]" />
                  My Wallet
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Save the cards you actually hold so the result page can prioritize effective fares that matter to you.
                </p>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[var(--accent-primary-dim)] transition-colors">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_BANK_CARDS.map((bank) => {
                  const active = ownedCards.includes(bank.id);
                  return (
                    <label
                      key={bank.id}
                      className={`flex items-center gap-3 p-3 rounded-[22px] border cursor-pointer transition-colors ${
                        active
                          ? "bg-[var(--accent-primary-dim)] border-[var(--accent-cta)]"
                          : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-[var(--radius-sm)] border-[var(--border-strong)] text-[var(--accent-cta)] focus:ring-[var(--accent-cta)] focus:ring-offset-0 bg-[var(--bg-base)]"
                        checked={active}
                        onChange={() => toggleCard(bank.id)}
                      />
                      <span className="text-sm font-medium select-none">{bank.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-[var(--border-muted)] bg-[var(--bg-subtle)] flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-full py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {session?.user ? "Save and refresh pricing" : "Use these cards for this device"}
              </button>
              {!session?.user ? (
                <p className="text-[11px] text-center text-[var(--text-muted)]">
                  Sign in if you want this wallet synced across devices and future searches.
                </p>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setOrigin, setDestination, setCabinClass } = useSearchStore();
  const { setSelectedFlight } = useCheckoutStore();
  const { ownedCards, setCards } = useUserStore();
  const { data: session } = useSession();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const returnDate = searchParams.get("return") || "";
  const adults = Number.parseInt(searchParams.get("adults") || "1", 10);
  const children = Number.parseInt(searchParams.get("children") || "0", 10);
  const infants = Number.parseInt(searchParams.get("infants") || "0", 10);
  const cabin = (searchParams.get("cabin") || "economy") as CabinClass;

  const [allFlights, setAllFlights] = useState<FlightResult[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [showFilters, setShowFilters] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterResetToken, setFilterResetToken] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [intelligence, setIntelligence] = useState<Awaited<ReturnType<typeof getIntelligenceCombined>> | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<AlertFeedback | null>(null);

  const passengerCount = adults + children + infants;
  const routeKey = `${from}-${to}-${date}`;
  const hasRequiredSearchParams = Boolean(from && to && date);

  useEffect(() => {
    if (session?.user) {
      getUserWallet().then((result) => {
        if (result.success && result.cards) {
          setCards(result.cards);
        }
      });
    }
  }, [session, setCards]);

  useEffect(() => {
    if (from) setOrigin(from);
    if (to) setDestination(to);
    setCabinClass(cabin);
  }, [cabin, from, setCabinClass, setDestination, setOrigin, to]);

  useEffect(() => {
    setAlertFeedback(null);
  }, [from, to, date]);

  useEffect(() => {
    let isMounted = true;

    if (!from || !to || !date) {
      setError("Missing route details. Start from the homepage to run a search.");
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      setActiveFilterCount(0);
      setFilterResetToken((current) => current + 1);

      const [faresResult, intelligenceResult] = await Promise.allSettled([
        fetchFlights(from, to, date, {
          userCards: ownedCards,
          cabin,
          passengers: passengerCount,
          fresh: refreshKey > 0,
        }),
        getIntelligenceCombined(from, to, date),
      ]);

      if (!isMounted) return;

      if (faresResult.status === "fulfilled") {
        setAllFlights(faresResult.value);
        setFilteredFlights(faresResult.value);
      } else {
        setAllFlights([]);
        setFilteredFlights([]);
        setError(
          faresResult.reason instanceof Error
            ? faresResult.reason.message
            : "We could not load live fares right now.",
        );
      }

      if (intelligenceResult.status === "fulfilled") {
        setIntelligence(intelligenceResult.value);
      } else {
        setIntelligence(null);
      }

      setIsLoading(false);
    };

    fetchResults();
    return () => {
      isMounted = false;
    };
  }, [cabin, date, from, ownedCards, passengerCount, refreshKey, to]);

  const avgPrice = useMemo(() => {
    if (allFlights.length === 0) return 0;
    const sum = allFlights.reduce((acc, flight) => acc + flight.price, 0);
    return Math.round(sum / allFlights.length);
  }, [allFlights]);

  const { offerCount, maxSaving } = useMemo(() => {
    let max = 0;
    const uniqueOffers = new Set<string>();

    allFlights.forEach((flight) => {
      if (flight.appliedOffer) {
        uniqueOffers.add(flight.appliedOffer.id);
        const discount = flight.basePrice ? Math.max(0, flight.basePrice + 350 - flight.price) : 0;
        if (discount > max) max = discount;
      }
    });

    return { offerCount: uniqueOffers.size, maxSaving: max };
  }, [allFlights]);

  const sortedFlights = useMemo(() => sortFlights(filteredFlights, sortBy, ownedCards), [filteredFlights, ownedCards, sortBy]);

  const dateLabel = date
    ? new Date(date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "No departure date";

  const searchHrefForDate = useCallback(
    (nextDate: string) => {
      const validReturnDate = returnDate && new Date(returnDate).getTime() >= new Date(nextDate).getTime() ? returnDate : undefined;
      return buildSearchHref({
        from,
        to,
        date: nextDate,
        adults,
        children,
        infants,
        cabin,
        returnDate: validReturnDate,
      });
    },
    [adults, cabin, children, from, infants, returnDate, to],
  );

  const handleFilter = useCallback((flights: FlightResult[], count: number) => {
    setFilteredFlights(flights);
    setActiveFilterCount(count);
  }, []);

  const handleBook = useCallback(
    (flight: FlightResult) => {
      setSelectedFlight(flight);
      router.push("/checkout");
    },
    [router, setSelectedFlight],
  );

  const handleClearFilters = () => {
    setFilteredFlights(allFlights);
    setActiveFilterCount(0);
    setFilterResetToken((current) => current + 1);
  };

  const handleCreateAlert = async () => {
    if (!session?.user) {
      setAlertFeedback({ kind: "error", message: "Sign in to create and manage price alerts.", routeKey });
      return;
    }

    const targetPrice = Number(alertPrice);
    if (!targetPrice) {
      setAlertFeedback({ kind: "error", message: "Enter a valid target price before saving the alert.", routeKey });
      return;
    }

    setAlertLoading(true);
    setAlertFeedback(null);
    const result = await subscribePriceAlert(from, to, targetPrice);
    setAlertLoading(false);

    if (!result) {
      setAlertFeedback({ kind: "error", message: "We could not save this alert right now. Please try again.", routeKey });
      return;
    }

    setShowAlertForm(false);
    setAlertPrice("");
    setAlertFeedback({ kind: "success", message: `Alert set for ${formatPrice(targetPrice)} on ${from} → ${to}.`, routeKey });
  };

  const visibleAlertFeedback = alertFeedback?.routeKey === routeKey ? alertFeedback : null;

  return (
    <div className="min-h-[100dvh] pb-20">
      <header className="sticky top-14 z-30 border-b border-[var(--border-default)] bg-[var(--bg-base)]/88 backdrop-blur-2xl">
        <div className="container-app py-4 md:py-5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary-dim)]"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Search results</div>
              <div className="flex flex-wrap items-center gap-2 text-lg md:text-xl font-semibold">
                <span className="truncate">{getAirportDisplay(from)}</span>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <span className="truncate">{getAirportDisplay(to)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                <span>{dateLabel}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span>{passengerCount} traveller{passengerCount > 1 ? "s" : ""}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="capitalize">{formatCabinLabel(cabin)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWallet(true)}
                className="group inline-flex items-center gap-2 rounded-full border border-[var(--accent-cta)]/20 bg-[var(--accent-primary-dim)] px-3 py-2 text-xs font-semibold text-[var(--accent-cta)] hover:bg-[var(--accent-cta)] hover:text-[var(--text-inverse)] transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Wallet</span>
                {ownedCards.length > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-cta)] px-1 text-[10px] text-[var(--text-inverse)] transition-colors group-hover:bg-[var(--bg-base)] group-hover:text-[var(--accent-cta)]">
                    {ownedCards.length}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="xl:hidden flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary-dim)]"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Average fare", value: allFlights.length > 0 ? formatPrice(avgPrice) : "—" },
              { label: "Offer-backed fares", value: offerCount > 0 ? `${offerCount} routes` : "No linked offers" },
              { label: "Max visible saving", value: maxSaving > 0 ? formatPrice(maxSaving) : "—" },
              { label: "Wallet context", value: ownedCards.length > 0 ? `${ownedCards.length} card${ownedCards.length > 1 ? "s" : ""} saved` : "No cards selected" },
            ].map((item) => (
              <div key={item.label} className="surface-card rounded-[22px] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
                <div className="mt-2 text-lg font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <WalletModal show={showWallet} onClose={() => setShowWallet(false)} />

      <div className="container-app py-6 md:py-8">
        <div className="flex gap-6 xl:gap-8">
          <FilterPanel
            key={filterResetToken}
            flights={allFlights}
            onFilter={handleFilter}
            show={showFilters}
            onClose={() => setShowFilters(false)}
          />

          <div className="flex-1 min-w-0">
            {!hasRequiredSearchParams ? (
              <div className="mx-auto max-w-2xl surface-card rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--text-muted)]">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Route details are missing</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
                  Start from the homepage to run a search with a valid origin, destination, and departure date.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                >
                  Start a new search
                </button>
              </div>
            ) : isLoading ? (
              <div className="mx-auto max-w-4xl flex flex-col gap-4 pt-4">
                <div className="surface-card rounded-[28px] p-5 md:p-6">
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching live fares, savings context, and route signals…
                  </div>
                </div>
                {[1, 2, 3, 4].map((item) => (
                  <FlightCardSkeleton key={item} />
                ))}
              </div>
            ) : error ? (
              <div className="mx-auto max-w-2xl surface-card rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Live fare search hit a problem</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">{error}</p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry search
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Start new search
                  </button>
                </div>
              </div>
            ) : allFlights.length === 0 ? (
              <div className="mx-auto max-w-2xl surface-card rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--text-muted)]">
                  <Frown className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">No fares returned for this route</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
                  The provider did not return bookable results for this date. Try a nearby departure date, another cabin, or a different route.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh fares
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Change route
                  </button>
                </div>
              </div>
            ) : sortedFlights.length === 0 ? (
              <div className="mx-auto max-w-2xl surface-card rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--text-muted)]">
                  <FilterX className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Your filters removed every visible fare</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
                  Clear the active filters and return to the full result set for this route.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                >
                  <FilterX className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-4xl">
                <div className="space-y-4 mb-5">
                  <div className="surface-card rounded-[28px] p-4 md:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">Route overview</div>
                        <h2 className="text-xl md:text-2xl font-semibold">
                          {getAirportDisplay(from)} → {getAirportDisplay(to)}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl leading-relaxed">
                          Review nearby-date hints, route guidance, and wallet-aware savings before you commit to checkout.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAlertForm((current) => !current)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--accent-primary-dim)] transition-colors"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          Price alert
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/compare?from=${from}&to=${to}`)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--accent-primary-dim)] transition-colors"
                        >
                          Compare route
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/intelligence?from=${from}&to=${to}&date=${date}`)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--accent-primary-dim)] transition-colors"
                        >
                          Full intelligence
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showAlertForm ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
                            <div className="flex flex-col gap-3 md:flex-row">
                              <input
                                type="number"
                                inputMode="numeric"
                                value={alertPrice}
                                onChange={(event) => setAlertPrice(event.target.value)}
                                placeholder="Target price in ₹"
                                className="ghost-input flex-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3 text-sm"
                              />
                              <button
                                type="button"
                                onClick={handleCreateAlert}
                                disabled={alertLoading}
                                className="rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] disabled:opacity-50"
                              >
                                {alertLoading ? "Saving…" : "Save alert"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    {visibleAlertFeedback ? (
                      <div
                        className={`mt-4 rounded-[18px] px-4 py-3 text-sm ${
                          visibleAlertFeedback.kind === "success"
                            ? "border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                            : "border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
                        }`}
                      >
                        {visibleAlertFeedback.message}
                      </div>
                    ) : null}

                    {intelligence ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {intelligence.prediction?.predicted_price ? (
                          <div className="rounded-[22px] border border-[var(--accent-cta)]/18 bg-[var(--accent-primary-dim)] p-4">
                            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] mb-2">
                              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cta)]" />
                              Predicted fare
                            </div>
                            <div className="text-2xl font-semibold font-mono-price">
                              {formatPrice(intelligence.prediction.predicted_price)}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-2">
                              Model {intelligence.prediction.model_version}
                            </div>
                          </div>
                        ) : null}

                        {intelligence.advice?.recommendation ? (
                          <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] mb-2">Booking advice</div>
                            <div className="text-base font-semibold">{intelligence.advice.recommendation}</div>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-2 capitalize">
                              Trend: {intelligence.advice.price_trend}
                            </div>
                          </div>
                        ) : null}

                        <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] mb-2">Booking context</div>
                          <div className="text-base font-semibold">Secure partner handoff</div>
                          <div className="mt-2 inline-flex items-start gap-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            Search tokens stay server-side until you choose to continue to checkout.
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <GroupBookCTA pax={passengerCount} origin={from} destination={to} date={date} />
                  <FareDipAlert origin={from} destination={to} date={date} />
                  <AlternativeItineraries origin={from} destination={to} date={date} />
                  <DateHinter
                    origin={from}
                    destination={to}
                    selectedDate={date}
                    onPickDate={(nextDate) => router.push(searchHrefForDate(nextDate))}
                  />
                  <PriceTrendChart origin={from} destination={to} date={date} />
                  <CostCuttingTips origin={from} destination={to} avgPrice={avgPrice} offerCount={offerCount} maxSaving={maxSaving} />
                </div>

                <SortBar sortBy={sortBy} onSort={setSortBy} totalResults={sortedFlights.length} activeFilterCount={activeFilterCount} />

                <div className="space-y-4">
                  {sortedFlights.map((flight, index) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      index={index}
                      isCheapest={index === 0 && sortBy === "cheapest"}
                      ownedCards={ownedCards}
                      onBook={handleBook}
                    />
                  ))}
                </div>
              </motion.div>
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
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
