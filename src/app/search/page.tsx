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
import { searchMappedFlightsAction } from "@/app/actions/flightActions";
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
import { TravelerSearchForm } from "@/components/ui/TravelerSearchForm";
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
import type { CabinClass, FlightAvailabilityState, FlightResult, SortOption } from "@/lib/types";
import {
  formatBankName,
  getOfferTravelerLabel,
  isBookableFlight,
  isWalletMatch,
  sortFlights,
} from "@/lib/utils";
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

function getFlightAvailabilityLabel(flight: FlightResult) {
  if (isBookableFlight(flight)) {
    return "Ready to book";
  }

  return flight.dataFreshness === "live" ? "Live route context" : "Reference only";
}

function getFlightCtaLabel(flight: FlightResult) {
  if (isBookableFlight(flight)) {
    return "Continue to checkout";
  }

  return flight.dataFreshness === "live" ? "Booking unavailable" : "Reference only";
}

function FlightCardSkeleton() {
  return (
    <div className="surface-card relative overflow-hidden rounded-[28px] p-5 md:p-6">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--bg-subtle)] to-transparent" />
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[var(--bg-subtle)]" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-[var(--bg-subtle)]" />
              <div className="h-2.5 w-16 rounded bg-[var(--bg-subtle)]" />
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="space-y-2">
              <div className="h-5 w-12 rounded bg-[var(--bg-subtle)]" />
              <div className="h-2.5 w-8 rounded bg-[var(--bg-subtle)]" />
            </div>
            <div className="space-y-2">
              <div className="mx-auto h-2.5 w-16 rounded bg-[var(--bg-subtle)]" />
              <div className="h-px w-full bg-[var(--border-default)]" />
              <div className="mx-auto h-2.5 w-20 rounded bg-[var(--bg-subtle)]" />
            </div>
            <div className="space-y-2 text-right">
              <div className="ml-auto h-5 w-12 rounded bg-[var(--bg-subtle)]" />
              <div className="ml-auto h-2.5 w-8 rounded bg-[var(--bg-subtle)]" />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--border-default)] pt-4 md:w-[240px] md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="ml-auto h-6 w-24 rounded bg-[var(--bg-subtle)]" />
          <div className="ml-auto h-3 w-28 rounded bg-[var(--bg-subtle)]" />
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
  const bookable = isBookableFlight(flight);
  const offerLabel = flight.appliedOffer ? getOfferTravelerLabel(flight.appliedOffer) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.04, 0.24), ease: [0.16, 1, 0.3, 1] }}
      className={`surface-card relative overflow-hidden rounded-[30px] p-5 md:p-6 ${
        isCheapest ? "ring-1 ring-[color-mix(in_srgb,var(--accent-cta)_18%,transparent)]" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent-cta)_20%,transparent)] to-transparent" />

      <div className="mb-4 flex flex-wrap gap-2">
        {isCheapest ? (
          <span className="status-pill border border-[var(--accent-cta)]/25 bg-[var(--accent-primary-dim)] text-[var(--accent-cta)]">
            <Sparkles className="h-3 w-3" />
            Lowest visible fare
          </span>
        ) : null}

        {walletMatch ? (
          <span className="status-pill border border-[var(--accent-green)]/25 bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
            <Wallet className="h-3 w-3" />
            Wallet matched
          </span>
        ) : null}

        <span
          className={`status-pill ${
            bookable
              ? "border border-[var(--accent-green)]/25 bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
              : "border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]"
          }`}
        >
          {bookable ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {getFlightAvailabilityLabel(flight)}
        </span>

        <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
          {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <AirlineLogo src={airlineLogo} alt={airlineName} seed={airlineName} size={48} className="bg-[var(--bg-base)]" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{airlineName}</div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                {flight.flightNumber || "Flight details pending"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4">
            <div>
              <div className="text-xl font-semibold font-mono-price">{formatTime(flight.departureTime)}</div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">{flight.origin}</div>
            </div>

            <div className="px-1">
              <div className="mb-1.5 text-center font-mono text-[11px] text-[var(--text-muted)]">
                {formatDuration(flight.durationMinutes)}
              </div>
              <div className="relative h-px bg-[var(--border-strong)]">
                <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--text-secondary)]" />
                <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--text-secondary)]" />
              </div>
              <div className="mt-1.5 text-center text-[11px] text-[var(--text-secondary)]">
                {flight.stops === 0
                  ? "Non-stop"
                  : flight.stopCities.length > 0
                    ? flight.stopCities.join(", ")
                    : `${flight.stops} stop route`}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-semibold font-mono-price">{formatTime(flight.arrivalTime)}</div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">{flight.destination}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {flight.baggageConfirmed && flight.baggage.checked.included ? (
              <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
                {flight.baggage.checked.weight ? `${flight.baggage.checked.weight}kg checked bag` : "Checked bag included"}
              </span>
            ) : null}

            {flight.refundabilityConfirmed ? (
              <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
                {flight.refundable ? "Refundable" : "Non-refundable"}
              </span>
            ) : null}

            {flight.cabinClass ? (
              <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[10px] capitalize text-[var(--text-secondary)]">
                {formatCabinLabel(flight.cabinClass)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[var(--border-muted)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-col lg:items-end">
              {flight.appliedOffer && flight.basePrice ? (
                <div className="text-[11px] text-[var(--text-muted)] line-through">
                  {formatPrice(flight.basePrice + 350)}
                </div>
              ) : null}
              <div className="text-3xl font-semibold font-mono-price tracking-tight">{formatPrice(flight.price)}</div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                {bookable ? "Payable fare before final confirmation" : "Recent visible route context"}
              </div>
            </div>

            {flight.appliedOffer ? (
              <div className="w-full rounded-[18px] border border-[var(--accent-green)]/18 bg-[var(--accent-green)]/10 p-3 text-[11px] text-[var(--accent-green)] lg:max-w-[240px]">
                <div className="flex items-start gap-2">
                  <TicketPercent className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      {maxDiscount > 0 ? `Save ${formatPrice(maxDiscount)}` : offerLabel}
                    </div>
                    {offerLabel ? <div className="mt-1 leading-relaxed">{offerLabel}</div> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {!bookable ? (
              <div className="text-[11px] leading-relaxed text-[var(--text-muted)] lg:text-right">
                {flight.dataFreshness === "live"
                  ? "Live route context only. Retry to restore a ready-to-book handoff."
                  : "Recent route context only. Refresh before you commit to booking."}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onBook(flight)}
              disabled={!bookable}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                bookable
                  ? "bg-[var(--accent-cta)] text-[var(--text-inverse)] hover:opacity-90"
                  : "border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {getFlightCtaLabel(flight)}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {bookable && flight.seatsRemaining && flight.seatsRemaining <= 4 ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-[18px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/8 px-4 py-3 text-[12px] text-[var(--accent-red)]">
          <AlertCircle className="h-4 w-4" />
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
  onOpenFilters,
}: {
  sortBy: SortOption;
  onSort: (value: SortOption) => void;
  totalResults: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <span>
          <strong className="font-semibold text-[var(--text-primary)]">{totalResults}</strong> fare option{totalResults === 1 ? "" : "s"} ranked for this route
        </span>
        {activeFilterCount > 0 ? (
          <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] xl:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Refine fares
        </button>

        <div className="flex flex-wrap gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] p-1">
          {SORT_OPTIONS.map((option) => {
            const active = sortBy === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSort(option.value as SortOption)}
                className={`relative rounded-full px-3 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {active ? (
                  <motion.div
                    layoutId="sortPill"
                    className="absolute inset-0 rounded-full bg-[var(--accent-cta)]"
                    transition={{ type: "spring", bounce: 0.16, duration: 0.35 }}
                  />
                ) : null}
                <span className="relative z-10">{option.label}</span>
              </button>
            );
          })}
        </div>
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

  useEffect(() => {
    if (!show) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, show]);

  const resetFilters = () => {
    setMaxStops(null);
    setSelectedAirlines([]);
    setSelectedBank(null);
  };

  const content = (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Refine fares</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Narrow the route by stops, airline, and eligible payment savings.
          </p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          <FilterX className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">Stops</h4>
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
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                maxStops === item.value
                  ? "border-transparent bg-[var(--accent-cta)] text-[var(--text-inverse)]"
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
          <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            <CreditCard className="h-3.5 w-3.5" />
            Payment savings
          </h4>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedBank(null)}
              className={`w-full rounded-[18px] px-3 py-2.5 text-left text-[13px] transition-colors ${
                selectedBank === null
                  ? "bg-[var(--accent-primary-dim)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
              }`}
            >
              All visible savings
            </button>
            {banks.map(([code, displayName]) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedBank(code)}
                className={`w-full rounded-[18px] px-3 py-2.5 text-left text-[13px] transition-colors ${
                  selectedBank === code
                    ? "bg-[var(--accent-primary-dim)] font-medium text-[var(--text-primary)]"
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
        <h4 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">Airlines</h4>
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
                className="flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 transition-colors hover:bg-[var(--accent-primary-dim)]"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[8px] ${
                      active ? "border-transparent bg-[var(--accent-cta)] text-[var(--text-inverse)]" : "border-[var(--border-strong)]"
                    }`}
                  >
                    {active ? "✓" : null}
                  </div>
                  <span className="text-[13px]">{AIRLINES[code]?.name || code}</span>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden xl:block xl:w-72 xl:shrink-0">
        <div className="surface-panel sticky top-24 rounded-[28px] p-5">{content}</div>
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
              className="absolute right-0 top-0 bottom-0 w-[88vw] max-w-sm overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-base)] p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-semibold">Refine fares</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 transition-colors hover:bg-[var(--accent-primary-dim)]"
                >
                  <X className="h-4 w-4 text-[var(--text-muted)]" />
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

  useEffect(() => {
    if (!show) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, show]);

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
            className="surface-panel relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[32px]"
          >
            <div className="flex items-start justify-between border-b border-[var(--border-muted)] p-5">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Wallet className="h-5 w-5 text-[var(--accent-cta)]" />
                  Wallet pricing
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                  Save the cards you actually hold so fares can surface the payment options most relevant to you.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 transition-colors hover:bg-[var(--accent-primary-dim)]"
              >
                <X className="h-5 w-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AVAILABLE_BANK_CARDS.map((bank) => {
                  const active = ownedCards.includes(bank.id);
                  return (
                    <label
                      key={bank.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-[22px] border p-3 transition-colors ${
                        active
                          ? "border-[var(--accent-cta)] bg-[var(--accent-primary-dim)]"
                          : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleCard(bank.id)}
                        className="h-4 w-4 rounded-[var(--radius-sm)] border-[var(--border-strong)] bg-[var(--bg-base)] text-[var(--accent-cta)]"
                      />
                      <span className="select-none text-sm font-medium">{bank.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border-muted)] bg-[var(--bg-subtle)] p-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] py-3 font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {session?.user ? "Save and refresh pricing" : "Use these cards for this device"}
              </button>
              {!session?.user ? (
                <p className="text-center text-[11px] text-[var(--text-muted)]">
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

function InsightSkeleton() {
  return <div className="surface-card h-[132px] animate-pulse rounded-[24px] bg-[var(--bg-subtle)]" />;
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
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityState, setAvailabilityState] = useState<FlightAvailabilityState>("unavailable");
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

  const passengerCount = useMemo(() => adults + children + infants, [adults, children, infants]);
  const routeKey = useMemo(() => `${from}-${to}-${date}`, [from, to, date]);
  const hasRequiredSearchParams = Boolean(from && to && date);
  const normalizedOwnedCards = useMemo(() => [...ownedCards].sort(), [ownedCards]);
  const ownedCardsKey = useMemo(() => normalizedOwnedCards.join(","), [normalizedOwnedCards]);

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
    let isMounted = true;

    if (!hasRequiredSearchParams) {
      return;
    }

    getIntelligenceCombined(from, to, date)
      .then((result) => {
        if (!isMounted) return;
        setIntelligence(result);
      })
      .catch(() => {
        if (!isMounted) return;
        setIntelligence(null);
      })
      .finally(() => {
        if (isMounted) setIsInsightsLoading(false);
      });

    searchMappedFlightsAction(from, to, date, {
      userCards: normalizedOwnedCards,
      cabin,
      passengers: passengerCount,
      fresh: refreshKey > 0,
    })
      .then((result) => {
        if (!isMounted) return;
        setAvailabilityState(result.availabilityState);
        setAllFlights(result.flights);
        setFilteredFlights(result.flights);
      })
      .catch((reason) => {
        if (!isMounted) return;
        setAvailabilityState("unavailable");
        setAllFlights([]);
        setFilteredFlights([]);
        setError(reason instanceof Error ? reason.message : "We could not load live fares right now.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cabin, date, from, hasRequiredSearchParams, normalizedOwnedCards, ownedCardsKey, passengerCount, refreshKey, to]);

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

  const liveBookableTotal = useMemo(
    () => allFlights.filter((flight) => isBookableFlight(flight)).length,
    [allFlights],
  );

  const referenceTotal = useMemo(() => allFlights.length - liveBookableTotal, [allFlights.length, liveBookableTotal]);

  const sortedFlights = useMemo(() => sortFlights(filteredFlights, sortBy, ownedCards), [filteredFlights, ownedCards, sortBy]);

  const bookableFlights = useMemo(
    () => sortedFlights.filter((flight) => isBookableFlight(flight)),
    [sortedFlights],
  );

  const referenceFlights = useMemo(
    () => sortedFlights.filter((flight) => !isBookableFlight(flight)),
    [sortedFlights],
  );

  const hasLiveReferenceContext = useMemo(
    () => referenceFlights.some((flight) => flight.dataFreshness === "live"),
    [referenceFlights],
  );

  const primaryFlights = bookableFlights.length > 0 ? bookableFlights : referenceFlights;

  const lowestPrimaryFareId = useMemo(() => {
    if (primaryFlights.length === 0) return null;

    return primaryFlights.reduce((lowest, flight) => (flight.price < lowest.price ? flight : lowest), primaryFlights[0]).id;
  }, [primaryFlights]);

  const walletMatchedCount = useMemo(
    () => allFlights.filter((flight) => isWalletMatch(flight, ownedCards)).length,
    [allFlights, ownedCards],
  );

  const routeDisplay = useMemo(() => `${getAirportDisplay(from)} → ${getAirportDisplay(to)}`, [from, to]);

  const availabilityBanner = useMemo(() => {
    if (bookableFlights.length > 0) {
      return {
        tone: "live" as const,
        title: "Live fares ready to book",
        body:
          referenceFlights.length > 0
            ? "Use fares marked ready to book for checkout. Additional cards stay visible as route context only."
            : "Fares marked ready to book can continue directly to checkout from this screen.",
      };
    }

    if (hasLiveReferenceContext) {
      return {
        tone: "limited" as const,
        title: "Live pricing visible, booking handoff limited",
        body:
          "These fares reflect current route availability, but checkout is temporarily unavailable for this search. Review them as guidance and retry live booking.",
      };
    }

    return {
      tone: "reference" as const,
      title: "Live booking temporarily unavailable",
      body:
        "Showing recent market context while live availability reconnects. Retry the search before you commit to a booking.",
    };
  }, [bookableFlights.length, hasLiveReferenceContext, referenceFlights.length]);

  const routeOverviewCopy = useMemo(() => {
    if (bookableFlights.length > 0) {
      return "Review nearby-date guidance, fare history, and wallet-aware pricing before you continue to checkout.";
    }

    if (hasLiveReferenceContext) {
      return "Review current route context and save an alert while booking handoff reconnects for this search.";
    }

    return "Use recent market context to understand the route, then retry live availability when you are ready to book.";
  }, [bookableFlights.length, hasLiveReferenceContext]);

  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
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
      if (!isBookableFlight(flight)) {
        return;
      }

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
    setAlertFeedback({ kind: "success", message: `Alert saved for ${formatPrice(targetPrice)} on ${from} → ${to}.`, routeKey });
  };

  const visibleAlertFeedback = alertFeedback?.routeKey === routeKey ? alertFeedback : null;

  const liveResultsAnnouncement = !hasRequiredSearchParams
    ? "Search details are missing."
    : isLoading
      ? "Searching for fares."
      : error
        ? `Search issue: ${error}`
        : `${primaryFlights.length} fare option${primaryFlights.length === 1 ? "" : "s"} visible. ${liveBookableTotal} ready to book.`;

  const routeInsightCards = (
    <div className="space-y-4">
      <div className="surface-card rounded-[28px] p-5">
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Route overview</div>
        <h2 className="text-xl font-semibold md:text-2xl">{routeDisplay}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{routeOverviewCopy}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAlertForm((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3.5 py-2 text-xs font-medium transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <Bell className="h-3.5 w-3.5" />
            Price alert
          </button>

          <button
            type="button"
            onClick={() => setShowWallet(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3.5 py-2 text-xs font-medium transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <Wallet className="h-3.5 w-3.5" />
            Wallet pricing
          </button>

          {availabilityBanner.tone !== "live" ? (
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3.5 py-2 text-xs font-medium transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry live fares
            </button>
          ) : null}
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
                <div className="flex flex-col gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={alertPrice}
                    onChange={(event) => setAlertPrice(event.target.value)}
                    placeholder="Target price in ₹"
                    className="ghost-input rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3 text-sm"
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
            role="status"
            className={`mt-4 rounded-[18px] px-4 py-3 text-sm ${
              visibleAlertFeedback.kind === "success"
                ? "border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                : "border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
            }`}
          >
            {visibleAlertFeedback.message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {isInsightsLoading ? (
          <>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </>
        ) : (
          <>
            <div className="surface-card rounded-[24px] p-4">
              <div className="mb-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                Fare outlook
              </div>
              <div className="text-2xl font-semibold font-mono-price text-[var(--text-primary)]">
                {intelligence?.prediction?.predicted_price ? formatPrice(intelligence.prediction.predicted_price) : "—"}
              </div>
              <div className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {intelligence?.prediction?.predicted_price
                  ? "A predicted route signal based on recent fare history."
                  : "Predicted fare guidance is still loading or unavailable for this route."}
              </div>
            </div>

            <div className="surface-card rounded-[24px] p-4">
              <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Booking guidance</div>
              <div className="text-base font-semibold text-[var(--text-primary)]">
                {intelligence?.advice?.recommendation || "Watch this route and compare the final payable fare carefully."}
              </div>
              <div className="mt-2 text-[11px] capitalize text-[var(--text-secondary)]">
                Trend: {intelligence?.advice?.price_trend || "unavailable"}
              </div>
            </div>

            <div className="surface-card rounded-[24px] p-4">
              <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Booking context</div>
              <div className="text-base font-semibold text-[var(--text-primary)]">
                {bookableFlights.length > 0 ? "Checkout-ready fare states" : "Route monitoring mode"}
              </div>
              <div className="mt-2 inline-flex items-start gap-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {bookableFlights.length > 0
                  ? "Only fares marked ready to book can continue to checkout from this page."
                  : "Save an alert, review nearby dates, and retry live availability when you are ready to book."}
              </div>
            </div>
          </>
        )}
      </div>

      <DateHinter
        origin={from}
        destination={to}
        selectedDate={date}
        onPickDate={(nextDate) => router.push(searchHrefForDate(nextDate))}
      />
      <FareDipAlert origin={from} destination={to} date={date} />
      <PriceTrendChart origin={from} destination={to} date={date} />
    </div>
  );

  return (
    <div className="min-h-[100dvh] pb-20">
      <WalletModal show={showWallet} onClose={() => setShowWallet(false)} />

      <div className="container-app py-6 md:py-8">
        <div className="sr-only" aria-live="polite">
          {liveResultsAnnouncement}
        </div>

        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] transition-colors hover:bg-[var(--accent-primary-dim)]"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Traveller results</div>
                <h1 className="text-balance text-2xl font-semibold md:text-3xl">{routeDisplay}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                  <span>{dateLabel}</span>
                  {returnDate ? (
                    <>
                      <span className="text-[var(--text-muted)]">•</span>
                      <span>
                        Return {new Date(`${returnDate}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </>
                  ) : null}
                  <span className="text-[var(--text-muted)]">•</span>
                  <span>{passengerCount} traveller{passengerCount > 1 ? "s" : ""}</span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="capitalize">{formatCabinLabel(cabin)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:min-w-[min(100%,36rem)]">
              {[
                { label: "Visible average", value: allFlights.length > 0 ? formatPrice(avgPrice) : "—" },
                {
                  label: "Booking status",
                  value:
                    availabilityState === "bookable_live"
                      ? `${liveBookableTotal} ready`
                      : referenceTotal > 0
                        ? "Reference only"
                        : "Unavailable",
                },
                { label: "Max saving", value: maxSaving > 0 ? formatPrice(maxSaving) : "—" },
                {
                  label: "Wallet matches",
                  value: ownedCards.length > 0 ? `${walletMatchedCount} visible` : "No cards saved",
                },
              ].map((item) => (
                <div key={item.label} className="surface-card rounded-[22px] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
          <FilterPanel
            key={filterResetToken}
            flights={allFlights}
            onFilter={handleFilter}
            show={showFilters}
            onClose={() => setShowFilters(false)}
          />

          <div className="min-w-0 space-y-6">
            <TravelerSearchForm
              key={`search-form-${routeKey || "empty"}`}
              variant="compact"
              title="Edit this search"
              description="Adjust the route, dates, travellers, or cabin without going back to the homepage."
              submitLabel="Update results"
              helperText="The page keeps booking trust visible while you refine the route."
              initialValues={{
                origin: from,
                destination: to,
                departureDate: date,
                returnDate,
                adults,
                children,
                infants,
                cabinClass: cabin,
              }}
            />

            {!hasRequiredSearchParams ? (
              <div className="surface-card mx-auto max-w-2xl rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--text-muted)]">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="mb-3 text-2xl font-semibold">Route details are missing</h2>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                  Start a search with a valid origin, destination, and departure date to view fares for this route.
                </p>
              </div>
            ) : isLoading || isInsightsLoading ? (
              <div className="mx-auto flex max-w-4xl flex-col gap-4 pt-2">
                <div className="surface-card rounded-[28px] p-5 md:p-6">
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching live fares and booking readiness…
                  </div>
                </div>
                {[1, 2, 3, 4].map((item) => (
                  <FlightCardSkeleton key={item} />
                ))}
              </div>
            ) : error ? (
              <div className="surface-card mx-auto max-w-2xl rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="mb-3 text-2xl font-semibold">Live fare search hit a problem</h2>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">{error}</p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry search
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    Start new search
                  </button>
                </div>
              </div>
            ) : allFlights.length === 0 ? (
              <div className="surface-card mx-auto max-w-2xl rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--text-muted)]">
                  <Frown className="h-8 w-8" />
                </div>
                <h2 className="mb-3 text-2xl font-semibold">
                  {availabilityState === "unavailable" ? "Live booking is temporarily unavailable" : "No fares returned for this route"}
                </h2>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                  {availabilityState === "unavailable"
                    ? "We could not load bookable fares or reliable route context right now. Retry in a moment or try another date."
                    : "We could not find fares for this date. Try a nearby departure, another cabin, or a different route."}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry live search
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    Change route
                  </button>
                </div>
              </div>
            ) : sortedFlights.length === 0 ? (
              <div className="surface-card mx-auto max-w-2xl rounded-[32px] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--text-muted)]">
                  <FilterX className="h-8 w-8" />
                </div>
                <h2 className="mb-3 text-2xl font-semibold">Your filters removed every visible fare</h2>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                  Clear the active filters and return to the full result set for this route.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                >
                  <FilterX className="h-4 w-4" />
                  Clear all filters
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl">
                <div className="space-y-4">
                  <div
                    className={`rounded-[28px] border p-4 md:p-5 ${
                      availabilityBanner.tone === "live"
                        ? "border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10"
                        : availabilityBanner.tone === "limited"
                          ? "border-[var(--accent-cta)]/18 bg-[var(--accent-primary-dim)]"
                          : "border-[var(--border-default)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        {availabilityBanner.tone === "live" ? (
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-green)]" />
                        ) : (
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                        )}
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Availability</div>
                          <h2 className="mt-1 text-lg font-semibold">{availabilityBanner.title}</h2>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{availabilityBanner.body}</p>
                        </div>
                      </div>

                      {availabilityBanner.tone !== "live" ? (
                        <button
                          type="button"
                          onClick={() => setRefreshKey((current) => current + 1)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-primary-dim)]"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Retry live search
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: "Cheapest visible fare",
                        value: primaryFlights.length > 0 ? formatPrice(Math.min(...primaryFlights.map((flight) => flight.price))) : "—",
                      },
                      {
                        label: "Ready to book",
                        value: `${liveBookableTotal}`,
                      },
                      {
                        label: "Reference context",
                        value: `${referenceTotal}`,
                      },
                      {
                        label: "Saved cards",
                        value: ownedCards.length > 0 ? `${ownedCards.length}` : "0",
                      },
                    ].map((item) => (
                      <div key={item.label} className="surface-card rounded-[24px] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
                        <div className="mt-2 text-xl font-semibold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <SortBar
                    sortBy={sortBy}
                    onSort={setSortBy}
                    totalResults={primaryFlights.length}
                    activeFilterCount={activeFilterCount}
                    onOpenFilters={() => setShowFilters(true)}
                  />

                  <div className="space-y-4">
                    {primaryFlights.map((flight, index) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        index={index}
                        isCheapest={flight.id === lowestPrimaryFareId}
                        ownedCards={ownedCards}
                        onBook={handleBook}
                      />
                    ))}
                  </div>
                </div>

                {bookableFlights.length > 0 && referenceFlights.length > 0 ? (
                  <section className="mt-10">
                    <div className="surface-card mb-5 rounded-[28px] p-4 md:p-5">
                      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Reference route context</div>
                      <h3 className="text-lg font-semibold">Additional fare context</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        These cards help you judge the route, but checkout stays disabled until a ready-to-book fare appears.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {referenceFlights.map((flight, index) => (
                        <FlightCard
                          key={flight.id}
                          flight={flight}
                          index={index}
                          isCheapest={false}
                          ownedCards={ownedCards}
                          onBook={handleBook}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {hasRequiredSearchParams ? <div className="mt-6 xl:hidden">{routeInsightCards}</div> : null}

                <section className="mt-8 space-y-4">
                  <GroupBookCTA pax={passengerCount} origin={from} destination={to} date={date} />
                  <AlternativeItineraries key={`alternatives-${routeKey}`} origin={from} destination={to} date={date} />
                  <CostCuttingTips origin={from} destination={to} avgPrice={avgPrice} offerCount={offerCount} maxSaving={maxSaving} />
                </section>
              </motion.div>
            )}
          </div>

          {hasRequiredSearchParams ? (
            <aside className="hidden xl:block xl:min-w-0">
            <div className="mt-6 xl:mt-0 xl:sticky xl:top-24">{routeInsightCards}</div>
            </aside>
          ) : null}
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
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
