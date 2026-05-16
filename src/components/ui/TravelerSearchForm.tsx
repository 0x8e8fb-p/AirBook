"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, ChevronDown, Minus, Plus, Search, Sparkles } from "lucide-react";

import { searchAirports } from "@/lib/airports";
import type { Airport, CabinClass } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/stores/search-store";

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const TODAY_INPUT_VALUE = getTodayInputValue();

const CABIN_OPTIONS: Array<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

type SearchValues = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
};

type TripType = "one_way" | "return";

type TravelerSearchFormProps = {
  variant?: "hero" | "compact";
  initialValues?: Partial<SearchValues>;
  title?: string;
  description?: string;
  submitLabel?: string;
  helperText?: string;
  className?: string;
};

function AirportCombobox({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const showLabel = focused || value.length > 0;

  const updateResults = useCallback(
    (raw: string) => {
      const upper = raw.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 32);
      onChange(upper);

      if (upper.trim().length === 0) {
        setResults([]);
        setDropdownOpen(false);
        setActiveIndex(0);
        return;
      }

      const nextResults = searchAirports(upper).slice(0, 6);
      setResults(nextResults);
      setDropdownOpen(nextResults.length > 0);
      setActiveIndex(0);
    },
    [onChange],
  );

  const selectAirport = useCallback(
    (airport: Airport) => {
      onChange(airport.iata);
      setDropdownOpen(false);
      setFocused(false);
      setActiveIndex(0);
    },
    [onChange],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 z-10 transition-all duration-200",
          showLabel
            ? "top-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]"
            : "top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-secondary)]",
        )}
      >
        {label}
      </label>

      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={dropdownOpen}
        aria-activedescendant={dropdownOpen && results[activeIndex] ? `${listboxId}-${results[activeIndex].iata}` : undefined}
        value={value}
        placeholder={showLabel ? "" : placeholder}
        onChange={(event) => updateResults(event.target.value)}
        onFocus={() => {
          setFocused(true);
          if (results.length > 0) {
            setDropdownOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (!dropdownOpen && (event.key === "ArrowDown" || event.key === "ArrowUp") && results.length > 0) {
            event.preventDefault();
            setDropdownOpen(true);
            return;
          }

          if (!dropdownOpen) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + results.length) % results.length);
          }

          if (event.key === "Enter" && results[activeIndex]) {
            event.preventDefault();
            selectAirport(results[activeIndex]);
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDropdownOpen(false);
          }
        }}
        className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 pb-2 pt-5 text-[14px] font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--border-strong)]"
      />

      <AnimatePresence>
        {dropdownOpen && results.length > 0 ? (
          <motion.ul
            id={listboxId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            role="listbox"
            className="surface-panel absolute inset-x-0 top-[64px] z-40 max-h-[260px] overflow-y-auto rounded-[22px] p-2"
          >
            {results.map((airport, index) => {
              const active = activeIndex === index;

              return (
                <li key={airport.iata} id={`${listboxId}-${airport.iata}`} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectAirport(airport)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left transition-colors",
                      active ? "bg-[var(--accent-primary-dim)]" : "hover:bg-[var(--accent-primary-dim)]",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {airport.city}, {airport.country}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-[var(--text-muted)]">{airport.name}</div>
                    </div>

                    <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)]">
                      {airport.iata}
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PassengerCounter({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-muted)] py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)]">{label}</div>
        <div className="mt-1 text-[11px] text-[var(--text-muted)]">{description}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <span className="w-8 text-center font-mono text-sm font-semibold text-[var(--text-primary)]">{value}</span>

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TravelerSearchForm({
  variant = "hero",
  initialValues,
  title,
  description,
  submitLabel = "Search flights",
  helperText,
  className,
}: TravelerSearchFormProps) {
  const router = useRouter();
  const passengersRef = useRef<HTMLDivElement>(null);

  const {
    addRecentSearch,
    setOrigin,
    setDestination,
    setDepartureDate,
    setReturnDate,
    setPassengers,
    setCabinClass,
  } = useSearchStore();

  const computedInitialValues = useMemo<SearchValues>(
    () => ({
      origin: initialValues?.origin?.toUpperCase() ?? "",
      destination: initialValues?.destination?.toUpperCase() ?? "",
      departureDate: initialValues?.departureDate ?? TODAY_INPUT_VALUE,
      returnDate: initialValues?.returnDate ?? "",
      adults: initialValues?.adults ?? 1,
      children: initialValues?.children ?? 0,
      infants: initialValues?.infants ?? 0,
      cabinClass: initialValues?.cabinClass ?? "economy",
    }),
    [
      initialValues?.adults,
      initialValues?.cabinClass,
      initialValues?.children,
      initialValues?.departureDate,
      initialValues?.destination,
      initialValues?.infants,
      initialValues?.origin,
      initialValues?.returnDate,
    ],
  );

  const [values, setValues] = useState<SearchValues>(() => computedInitialValues);
  const [tripType, setTripType] = useState<TripType>(() => (computedInitialValues.returnDate ? "return" : "one_way"));
  const [showPassengers, setShowPassengers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const currentInitialKey = useMemo(
    () => JSON.stringify(computedInitialValues),
    [computedInitialValues],
  );
  const [appliedInitialKey, setAppliedInitialKey] = useState(currentInitialKey);

  if (appliedInitialKey !== currentInitialKey) {
    setAppliedInitialKey(currentInitialKey);
    setValues(computedInitialValues);
    setTripType(computedInitialValues.returnDate ? "return" : "one_way");
    if (isSearching) {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (!showPassengers) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPassengers(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (passengersRef.current && !passengersRef.current.contains(event.target as Node)) {
        setShowPassengers(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPassengers]);

  const passengerLabel = useMemo(() => {
    const total = values.adults + values.children + values.infants;
    return `${total} traveller${total > 1 ? "s" : ""}`;
  }, [values.adults, values.children, values.infants]);

  const canSearch = Boolean(
    values.origin &&
      values.destination &&
      values.departureDate &&
      (tripType === "one_way" || values.returnDate),
  );

  const updatePassengerValue = useCallback(
    (key: "adults" | "children" | "infants", nextValue: number) => {
      setValues((current) => {
        const next = { ...current, [key]: nextValue };
        const total = next.adults + next.children + next.infants;

        if (next.adults < 1 || next.children < 0 || next.infants < 0 || next.infants > next.adults || total > 9) {
          return current;
        }

        return next;
      });
    },
    [],
  );

  const handleSearch = useCallback(() => {
    if (!canSearch) {
      return;
    }

    setIsSearching(true);

    const nextOrigin = values.origin.trim().toUpperCase();
    const nextDestination = values.destination.trim().toUpperCase();
    const nextDepartureDate = values.departureDate;
    const nextReturnDate = tripType === "return" ? values.returnDate : "";

    const params = new URLSearchParams({
      from: nextOrigin,
      to: nextDestination,
      date: nextDepartureDate,
      adults: String(values.adults),
      children: String(values.children),
      infants: String(values.infants),
      cabin: values.cabinClass,
    });

    if (nextReturnDate) {
      params.set("return", nextReturnDate);
    }

    setOrigin(nextOrigin);
    setDestination(nextDestination);
    setDepartureDate(nextDepartureDate);
    setReturnDate(nextReturnDate);
    setPassengers(values.adults, values.children, values.infants);
    setCabinClass(values.cabinClass);

    addRecentSearch({
      origin: nextOrigin,
      destination: nextDestination,
      departureDate: nextDepartureDate,
      returnDate: nextReturnDate || undefined,
      passengers: {
        adults: values.adults,
        children: values.children,
        infants: values.infants,
      },
      cabinClass: values.cabinClass,
    });

    router.push(`/search?${params.toString()}`);
  }, [
    addRecentSearch,
    canSearch,
    router,
    setCabinClass,
    setDepartureDate,
    setDestination,
    setOrigin,
    setPassengers,
    setReturnDate,
    tripType,
    values.adults,
    values.cabinClass,
    values.children,
    values.departureDate,
    values.destination,
    values.infants,
    values.origin,
    values.returnDate,
  ]);

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variant === "hero" ? "surface-panel rounded-[34px] p-5 sm:p-6 md:p-7" : "surface-card rounded-[30px] p-4 sm:p-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--accent-cyan)_11%,transparent),transparent_44%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--accent-purple)_9%,transparent),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent-cta)_35%,transparent)] to-transparent" />

      <div className="relative z-10 space-y-5">
        {title || description ? (
          <div className="space-y-2">
            {title ? (
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                {title}
              </div>
            ) : null}
            {description ? <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p> : null}
          </div>
        ) : null}

        <div className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-base)]/70 p-1 shadow-[var(--shadow-sm)]">
          {[
            { value: "one_way" as const, label: "One way" },
            { value: "return" as const, label: "Return" },
          ].map((option) => {
            const active = tripType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTripType(option.value);
                  if (option.value === "one_way") {
                    setValues((current) => ({ ...current, returnDate: "" }));
                  }
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold tracking-[0.12em] transition-colors",
                  active
                    ? "bg-[var(--accent-cta)] text-[var(--text-inverse)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <AirportCombobox
            id="search-origin"
            label="From"
            placeholder="City or airport"
            value={values.origin}
            onChange={(value) => setValues((current) => ({ ...current, origin: value }))}
          />

          <div className="relative">
            <AirportCombobox
              id="search-destination"
              label="To"
              placeholder="City or airport"
              value={values.destination}
              onChange={(value) => setValues((current) => ({ ...current, destination: value }))}
            />

            <button
              type="button"
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  origin: current.destination,
                  destination: current.origin,
                }))
              }
              className="absolute right-2 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-secondary)] shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              aria-label="Swap origin and destination"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className={cn("grid gap-3", variant === "hero" ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4")}>
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-2 z-10 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Departure
            </span>
            <input
              type="date"
              value={values.departureDate}
              min={TODAY_INPUT_VALUE}
              onChange={(event) => {
                const nextDepartureDate = event.target.value;
                setValues((current) => ({
                  ...current,
                  departureDate: nextDepartureDate,
                  returnDate:
                    current.returnDate && new Date(current.returnDate).getTime() < new Date(nextDepartureDate).getTime()
                      ? nextDepartureDate
                      : current.returnDate,
                }));
              }}
              className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 pb-2 pt-5 text-[14px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--border-strong)]"
            />
          </label>

          {tripType === "return" ? (
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-2 z-10 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Return
              </span>
              <input
                type="date"
                value={values.returnDate}
                min={values.departureDate || TODAY_INPUT_VALUE}
                onChange={(event) => setValues((current) => ({ ...current, returnDate: event.target.value }))}
                className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 pb-2 pt-5 text-[14px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--border-strong)]"
              />
            </label>
          ) : (
            <button
              type="button"
              onClick={() => setTripType("return")}
              className="flex h-[58px] items-center justify-center rounded-[22px] border border-dashed border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-elevated)_66%,transparent)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cta)]/35 hover:text-[var(--text-primary)]"
            >
              Add return date
            </button>
          )}

          <div ref={passengersRef} className="relative">
            <span className="pointer-events-none absolute left-4 top-2 z-10 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Travellers
            </span>

            <button
              type="button"
              aria-expanded={showPassengers}
              onClick={() => setShowPassengers((current) => !current)}
              className="ghost-input flex h-[58px] w-full items-center justify-between rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 pb-2 pt-5 text-left text-[14px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--border-strong)]"
            >
              <span>{passengerLabel}</span>
              <ChevronDown className={cn("h-4 w-4 text-[var(--text-muted)] transition-transform", showPassengers ? "rotate-180" : "")} />
            </button>

            <AnimatePresence>
              {showPassengers ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="surface-panel absolute inset-x-0 top-[64px] z-40 rounded-[24px] p-4"
                >
                  <PassengerCounter
                    label="Adults"
                    description="12 years and above"
                    value={values.adults}
                    min={1}
                    max={9}
                    onChange={(nextValue) => updatePassengerValue("adults", nextValue)}
                  />
                  <PassengerCounter
                    label="Children"
                    description="2 to 11 years"
                    value={values.children}
                    min={0}
                    max={8}
                    onChange={(nextValue) => updatePassengerValue("children", nextValue)}
                  />
                  <PassengerCounter
                    label="Infants"
                    description="Under 2 years"
                    value={values.infants}
                    min={0}
                    max={values.adults}
                    onChange={(nextValue) => updatePassengerValue("infants", nextValue)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-2 z-10 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Cabin
            </span>
            <select
              value={values.cabinClass}
              onChange={(event) => setValues((current) => ({ ...current, cabinClass: event.target.value as CabinClass }))}
              className="ghost-input h-[58px] w-full appearance-none rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 pb-2 pt-5 text-[14px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--border-strong)]"
            >
              {CABIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          </label>
        </div>

        <div className={cn("flex gap-3", variant === "hero" ? "flex-col md:flex-row md:items-center md:justify-between" : "flex-col lg:flex-row lg:items-center lg:justify-between")}>
          <p className="max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            {helperText ?? "Ready-to-book fares stay clearly marked, while route context remains visible whenever live handoff is limited."}
          </p>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch || isSearching}
            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3.5 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSearching ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                </svg>
                Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
