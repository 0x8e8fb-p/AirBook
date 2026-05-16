"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getAirportDisplay } from "@/lib/airports";
import { formatPrice } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";

const ROUTE_PATTERN = /^[a-z]{3}-to-[a-z]{3}$/i;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getStarterSearchDate() {
  const starter = new Date(Date.now() + 3 * 86400000);
  const local = new Date(starter.getTime() - starter.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function buildSearchHref(from: string, to: string, date: string) {
  const params = new URLSearchParams({
    from,
    to,
    date,
    adults: "1",
    children: "0",
    infants: "0",
    cabin: "economy",
  });

  return `/search?${params.toString()}`;
}

function formatDayLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function formatDayAriaLabel(day: CalendarDay) {
  if (day.cheapestPrice) {
    return `${formatDayLabel(day.date)}. Recent fare from ${formatPrice(day.cheapestPrice)}.`;
  }

  return `${formatDayLabel(day.date)}. No recent fare context available.`;
}

function InvalidCalendarState() {
  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app max-w-3xl py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-6 md:p-8">
          <div className="section-kicker mb-4">
            <Calendar className="h-3.5 w-3.5" />
            Fare calendar
          </div>
          <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
            Choose a route first to open the fare calendar.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            This surface works best when it opens from a route watchlist or a live search path, so the calendar can stay focused on one city pair.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/deals"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
            >
              Browse route watchlist
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
            >
              Start live search
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function FareCalendarContent({ route }: { route: string }) {
  const router = useRouter();
  const [origin, destination] = route.split("-to-").map((segment) => segment.toUpperCase().slice(0, 3));

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  const originDisplay = getAirportDisplay(origin);
  const destDisplay = getAirportDisplay(destination);

  useEffect(() => {
    let cancelled = false;

    async function fetchCalendar() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/calendar?origin=${origin}&destination=${destination}&month=${month}&year=${year}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Fare calendar unavailable");
        }

        if (cancelled) return;
        setDays(Array.isArray(data.days) ? data.days : []);
      } catch {
        if (cancelled) return;
        setDays([]);
        setError("Recent fare context is unavailable for this route right now. Try another month or switch to live search.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchCalendar();

    return () => {
      cancelled = true;
    };
  }, [destination, month, origin, requestKey, year]);

  const prevMonth = () => {
    setDirection(-1);
    setMonth((currentMonth) => {
      if (currentMonth === 1) {
        setYear((currentYear) => currentYear - 1);
        return 12;
      }
      return currentMonth - 1;
    });
  };

  const nextMonth = () => {
    setDirection(1);
    setMonth((currentMonth) => {
      if (currentMonth === 12) {
        setYear((currentYear) => currentYear + 1);
        return 1;
      }
      return currentMonth + 1;
    });
  };

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const paddedDays = useMemo(() => {
    const padded: Array<CalendarDay | null> = [];
    for (let index = 0; index < firstDayOfWeek; index += 1) {
      padded.push(null);
    }
    return [...padded, ...days];
  }, [days, firstDayOfWeek]);

  const cheapestDay = useMemo(() => {
    const pricedDays = days.filter((day) => day.cheapestPrice !== null);
    if (pricedDays.length === 0) return null;

    return pricedDays.reduce((min, day) => (day.cheapestPrice! < min.cheapestPrice! ? day : min));
  }, [days]);

  const priceStats = useMemo(() => {
    const prices = days
      .filter((day) => day.cheapestPrice !== null)
      .map((day) => day.cheapestPrice!);

    if (prices.length === 0) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length),
    };
  }, [days]);

  const hasVisibleFares = days.some((day) => day.cheapestPrice !== null);
  const fareCount = days.filter((day) => day.cheapestPrice !== null).length;
  const starterDate = cheapestDay?.date ?? getStarterSearchDate();
  const liveSearchHref = buildSearchHref(origin, destination, starterDate);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app max-w-5xl py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                href="/deals"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to route watchlist
              </Link>

              <div className="section-kicker mt-4 mb-4">
                <Calendar className="h-3.5 w-3.5" />
                Fare calendar
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Choose your dates with clearer route context.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                This calendar shows recent market context for {origin} → {destination}. Tap a day to continue into live search and confirm fresh availability before checkout.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2">
                  {originDisplay}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2">
                  {destDisplay}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Reference context",
                    body: "Use the calendar to choose dates. Checkout readiness is confirmed only after you switch to live search.",
                  },
                  {
                    icon: Search,
                    title: "Tap a day to search live",
                    body: "A day opens the route in live search so you can confirm current pricing and availability for that date.",
                  },
                  {
                    icon: Info,
                    title: "Holiday markers included",
                    body: "Local holidays stay visible so you can quickly spot dates that may carry higher travel demand.",
                  },
                ].map((item) => (
                  <div key={item.title} className="surface-card rounded-[24px] p-4">
                    <item.icon className="mb-3 h-4 w-4 text-[var(--accent-cta)]" />
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="surface-card rounded-[32px] p-5 md:p-6"
            >
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                What this calendar means
              </div>

              <div className="rounded-[26px] border border-[var(--accent-cta)]/18 bg-[var(--accent-primary-dim)] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                  <div>
                    <div className="text-sm font-semibold">Recent price context only</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      This view helps you compare dates, not skip straight to booking. When you spot a promising day, run a live search to confirm the fare can actually continue to checkout.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Best visible day</div>
                  <div className="mt-2 text-lg font-semibold font-mono-price">
                    {cheapestDay?.cheapestPrice ? formatPrice(cheapestDay.cheapestPrice) : "—"}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Spread this month</div>
                  <div className="mt-2 text-lg font-semibold font-mono-price">
                    {priceStats ? formatPrice(priceStats.max - priceStats.min) : "—"}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 col-span-2 lg:col-span-1">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Days with fare context</div>
                  <div className="mt-2 text-lg font-semibold">{fareCount}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={liveSearchHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                >
                  <Search className="h-4 w-4" />
                  Start live search
                </Link>
                <Link
                  href="/deals"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                >
                  Back to route watchlist
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="mt-6 space-y-6" aria-live="polite">
          {error ? (
            <div className="rounded-[30px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-red)]">Fare calendar unavailable</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-red)]/90">{error}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRequestKey((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Retry calendar
                  </button>
                  <Link
                    href={liveSearchHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--accent-red)]/20 px-4 py-3 text-sm font-semibold text-[var(--accent-red)] transition-colors hover:bg-[var(--accent-red)]/10"
                  >
                    Go to live search
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {!error && !isLoading && !hasVisibleFares ? (
            <div className="rounded-[30px] border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-amber)]">No recent fare context for this month</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--accent-amber)]/90">
                    Try another month, or move into live search if you want to check current availability without waiting.
                  </p>
                </div>
                <Link
                  href={liveSearchHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-amber)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                >
                  Start live search
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}

          {!error ? (
            <section className="surface-card rounded-[32px] p-4 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    Reference market context
                  </span>
                  <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    Tap a day to search live
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={prevMonth}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] transition-colors hover:border-[var(--border-strong)]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </motion.button>

                  <motion.h2
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="min-w-[180px] text-center text-xl font-semibold"
                  >
                    {MONTHS[month - 1]} {year}
                  </motion.h2>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextMonth}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] transition-colors hover:border-[var(--border-strong)]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="mt-2 relative overflow-hidden rounded-[28px]">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={`${year}-${month}-${isLoading}`}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-7 gap-1"
                  >
                    {isLoading
                      ? Array.from({ length: 35 }).map((_, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.01 }}
                            className="calendar-day skeleton border-transparent"
                          />
                        ))
                      : paddedDays.map((day, index) => {
                          if (!day) {
                            return <div key={`pad-${index}`} className="min-h-[96px]" />;
                          }

                          const dateNum = new Date(`${day.date}T00:00:00`).getDate();
                          const todayValue = new Date().toISOString().split("T")[0];
                          const isToday = day.date === todayValue;
                          const isCheapest = Boolean(cheapestDay && day.date === cheapestDay.date);

                          return (
                            <motion.button
                              key={day.date}
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.01, duration: 0.24 }}
                              whileHover={day.cheapestPrice ? { y: -2 } : undefined}
                              whileTap={day.cheapestPrice ? { scale: 0.98 } : undefined}
                              onClick={() => {
                                if (day.cheapestPrice) {
                                  router.push(buildSearchHref(origin, destination, day.date));
                                }
                              }}
                              disabled={!day.cheapestPrice}
                              aria-label={formatDayAriaLabel(day)}
                              className={`calendar-day relative flex flex-col items-center justify-center text-center ${
                                day.priceLevel ?? ""
                              } ${isToday ? "today font-bold" : ""} ${
                                !day.cheapestPrice ? "cursor-not-allowed opacity-45" : ""
                              } ${isCheapest ? "border-[var(--accent-green)] shadow-[0_0_24px_rgba(16,185,129,0.18)]" : ""}`}
                            >
                              {isCheapest ? (
                                <motion.div
                                  animate={{ scale: [1, 1.14, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute top-2 right-2"
                                >
                                  <Star className="h-3.5 w-3.5 fill-[var(--accent-green)] text-[var(--accent-green)]" />
                                </motion.div>
                              ) : null}

                              <div className={`mb-1 text-sm font-medium ${isToday ? "text-[var(--accent-cta)]" : "text-[var(--text-primary)]"}`}>
                                {dateNum}
                              </div>

                              {day.cheapestPrice ? (
                                <div
                                  className={`text-[10px] font-semibold tabular-nums ${
                                    day.priceLevel === "cheap"
                                      ? "text-[var(--fare-cheap)]"
                                      : day.priceLevel === "expensive"
                                        ? "text-[var(--fare-expensive)]"
                                        : "text-[var(--text-secondary)]"
                                  }`}
                                >
                                  {formatPrice(day.cheapestPrice)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[var(--text-muted)]">—</div>
                              )}

                              {day.isHoliday ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--accent-cta)] shadow-[0_0_6px_rgba(255,107,0,0.7)]"
                                  title={day.holidayName}
                                />
                              ) : null}
                            </motion.button>
                          );
                        })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          ) : null}

          <AnimatePresence>
            {!error && priceStats && !isLoading ? (
              <motion.section
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="surface-card rounded-[30px] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-[var(--fare-cheap)]" />
                    Lower-fare days
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-[var(--fare-average)]" />
                    Mid-range days
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-[var(--fare-expensive)]" />
                    Higher-fare days
                  </div>
                  <div className="ml-auto text-sm">
                    Best visible day {cheapestDay?.cheapestPrice ? <strong className="font-mono-price text-[var(--text-primary)]">{formatPrice(cheapestDay.cheapestPrice)}</strong> : "—"}
                    {" · "}
                    Typical month {priceStats.avg ? <strong className="font-mono-price text-[var(--text-primary)]">{formatPrice(priceStats.avg)}</strong> : "—"}
                  </div>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {!isLoading && days.some((day) => day.isHoliday) ? (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="surface-card overflow-hidden rounded-[30px]"
              >
                <div className="border-b border-[var(--border-default)] p-5">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[var(--accent-cta)]" />
                    <h2 className="text-lg font-semibold">Holiday timing this month</h2>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Keep nearby holidays in view when you compare dates, especially when demand might shift around the route.
                  </p>
                </div>

                <div className="space-y-3 p-5">
                  {days
                    .filter((day) => day.isHoliday)
                    .map((day, index) => {
                      const isClickable = Boolean(day.cheapestPrice);

                      return (
                        <motion.button
                          key={day.date}
                          type="button"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.06 }}
                          disabled={!isClickable}
                          className={`flex w-full items-center gap-3 rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-left text-sm text-[var(--text-secondary)] ${
                            isClickable
                              ? "cursor-pointer transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                              : "cursor-not-allowed opacity-70"
                          }`}
                          onClick={() => {
                            if (isClickable) {
                              router.push(buildSearchHref(origin, destination, day.date));
                            }
                          }}
                        >
                          <div className="w-10 shrink-0 text-center font-semibold text-[var(--text-primary)]">
                            {new Date(`${day.date}T00:00:00`).getDate()}
                          </div>
                          <div className="h-2 w-2 rounded-full bg-[var(--accent-cta)] shadow-[0_0_6px_rgba(255,107,0,0.7)]" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-[var(--text-primary)]">{day.holidayName}</div>
                            <div className="mt-1 text-[11px] text-[var(--text-muted)]">{formatDayLabel(day.date)}</div>
                          </div>
                          <div className="text-right">
                            {day.cheapestPrice ? (
                              <div className="text-sm font-semibold font-mono-price text-[var(--text-primary)]">
                                {formatPrice(day.cheapestPrice)}
                              </div>
                            ) : (
                              <div className="text-[11px] text-[var(--text-muted)]">No fare context</div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const params = useParams();
  const rawRoute = Array.isArray(params?.route) ? params.route[0] : (params?.route as string | undefined);

  if (!rawRoute || !ROUTE_PATTERN.test(rawRoute)) {
    return <InvalidCalendarState />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] pb-20">
          <div className="container-app max-w-3xl py-6 md:py-8">
            <div className="surface-card flex min-h-[260px] items-center justify-center rounded-[34px]">
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading fare calendar…
              </div>
            </div>
          </div>
        </div>
      }
    >
      <FareCalendarContent route={rawRoute} />
    </Suspense>
  );
}
