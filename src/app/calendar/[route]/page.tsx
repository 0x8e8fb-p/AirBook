"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAirportDisplay } from "@/lib/airports";
import { formatPrice } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Star,
  Info,
} from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function FareCalendarContent({ route }: { route: string }) {
  const router = useRouter();
  const [origin, destination] = route.split("-to-").map((s) =>
    s.toUpperCase().substring(0, 3)
  );

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  const originDisplay = getAirportDisplay(origin);
  const destDisplay = getAirportDisplay(destination);

  useEffect(() => {
    const fetchCalendar = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/calendar?origin=${origin}&destination=${destination}&month=${month}&year=${year}`
        );
        const data = await res.json();
        setDays(data.days || []);
      } catch (err) {
        console.error("Calendar fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendar();
  }, [origin, destination, month, year]);

  const prevMonth = () => {
    setDirection(-1);
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    setDirection(1);
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Pad days for calendar grid alignment
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const paddedDays = useMemo(() => {
    const padded: (CalendarDay | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      padded.push(null);
    }
    return [...padded, ...days];
  }, [days, firstDayOfWeek]);

  // Find cheapest day
  const cheapestDay = useMemo(() => {
    const withPrices = days.filter((d) => d.cheapestPrice !== null);
    if (withPrices.length === 0) return null;
    return withPrices.reduce((min, d) =>
      d.cheapestPrice! < min.cheapestPrice! ? d : min
    );
  }, [days]);

  // Price stats for savings info
  const priceStats = useMemo(() => {
    const prices = days.filter((d) => d.cheapestPrice !== null).map((d) => d.cheapestPrice!);
    if (prices.length === 0) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    };
  }, [days]);

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 50 : -50,
        opacity: 0,
      };
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        x: direction < 0 ? 50 : -50,
        opacity: 0,
      };
    },
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-40"
      >
        <div className="container-app py-3 flex items-center gap-3">
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Fare Calendar</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <span>{originDisplay}</span>
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="w-3 h-3 text-[var(--color-primary)]" />
              </motion.div>
              <span>{destDisplay}</span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container-app py-6 max-w-3xl mx-auto">
        {/* Legend + Info */}
        <AnimatePresence>
          {priceStats && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-4 mb-6"
            >
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[var(--fare-cheap)]" />
                  <span className="text-[var(--text-secondary)]">Cheap</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[var(--fare-average)]" />
                  <span className="text-[var(--text-secondary)]">Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[var(--fare-expensive)]" />
                  <span className="text-[var(--text-secondary)]">Expensive</span>
                </div>
                <div className="ml-auto text-[var(--text-secondary)]">
                  Cheapest day: <strong className="text-[var(--color-savings-light)]">{cheapestDay ? formatPrice(cheapestDay.cheapestPrice!) : "—"}</strong>
                  {" · "}
                  Savings up to <strong className="text-[var(--color-savings-light)]">{formatPrice(priceStats.max - priceStats.min)}</strong>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors border border-transparent hover:border-[var(--border-primary)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.h2
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-space), system-ui" }}
          >
            {MONTHS[month - 1]} {year}
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors border border-transparent hover:border-[var(--border-primary)]"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[var(--color-primary-light)] py-2 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="relative overflow-hidden rounded-xl">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={`${year}-${month}-${isLoading}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] // Ease out expo
              }}
              className="grid grid-cols-7 gap-1"
            >
              {isLoading ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="calendar-day skeleton h-16 border-transparent"
                  />
                ))
              ) : (
                paddedDays.map((day, i) => {
                  if (!day) {
                    return <div key={`pad-${i}`} className="min-h-[60px]" />;
                  }

                  const dateNum = new Date(day.date).getDate();
                  const isToday =
                    day.date === new Date().toISOString().split("T")[0];
                  const isCheapest =
                    cheapestDay && day.date === cheapestDay.date;

                  return (
                    <motion.button
                      key={day.date}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.01, duration: 0.3 }}
                      whileHover={day.cheapestPrice ? { scale: 1.05, zIndex: 10 } : {}}
                      whileTap={day.cheapestPrice ? { scale: 0.95 } : {}}
                      onClick={() => {
                        if (day.cheapestPrice) {
                          router.push(
                            `/search?from=${origin}&to=${destination}&date=${day.date}&adults=1&cabin=economy`
                          );
                        }
                      }}
                      disabled={!day.cheapestPrice}
                      className={`calendar-day relative flex flex-col items-center justify-center ${
                        day.priceLevel || ""
                      } ${isToday ? "today font-bold" : ""} ${
                        !day.cheapestPrice
                          ? "opacity-40 cursor-not-allowed bg-[var(--bg-surface)]"
                          : "bg-[var(--bg-surface)]"
                      } ${isCheapest ? "shadow-[0_0_15px_rgba(16,185,129,0.3)] border-[var(--color-savings)]" : ""}`}
                    >
                      {isCheapest && (
                        <motion.div
                           animate={{ scale: [1, 1.2, 1] }}
                           transition={{ duration: 2, repeat: Infinity }}
                           className="absolute top-1 right-1"
                        >
                          <Star className="w-3 h-3 text-[var(--color-savings)] fill-[var(--color-savings)]" />
                        </motion.div>
                      )}
                      
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {dateNum}
                      </div>

                      {day.cheapestPrice ? (
                        <div
                          className={`text-[10px] font-bold tabular-nums ${
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
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          —
                        </div>
                      )}

                      {/* Holiday indicator dot */}
                      {day.isHoliday && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_5px_rgba(255,107,0,0.8)]"
                          title={day.holidayName}
                        />
                      )}
                    </motion.button>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Holiday List for this month */}
        <AnimatePresence>
          {!isLoading && days.some((d) => d.isHoliday) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 glass-card border border-[rgba(255,107,0,0.2)] overflow-hidden"
            >
              <div className="p-4 bg-[rgba(255,107,0,0.05)]">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--color-primary)]" />
                  Holidays this month
                </h3>
                <div className="space-y-3">
                  {days
                    .filter((d) => d.isHoliday)
                    .map((d, i) => (
                      <motion.div
                        key={d.date}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 text-sm text-[var(--text-secondary)] group hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        onClick={() => {
                           if (d.cheapestPrice) {
                              router.push(`/search?from=${origin}&to=${destination}&date=${d.date}&adults=1&cabin=economy`);
                           }
                        }}
                      >
                        <div className="w-8 flex-shrink-0 text-center font-bold text-[var(--color-primary-light)]">
                          {new Date(d.date).getDate()}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_5px_rgba(255,107,0,0.8)]" />
                        <span className="flex-1 font-medium group-hover:text-[var(--color-primary)] transition-colors">
                          {d.holidayName}
                        </span>
                        {d.cheapestPrice && (
                          <span className={`text-xs font-bold ${
                              d.priceLevel === "cheap" ? "text-[var(--fare-cheap)]" : 
                              d.priceLevel === "expensive" ? "text-[var(--fare-expensive)]" : 
                              "text-[var(--text-primary)]"
                          }`}>
                            {formatPrice(d.cheapestPrice)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const params = useParams();
  const route = (params?.route as string) || "del-to-bom";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-8 h-8 text-[var(--color-primary)]" />
          </motion.div>
        </div>
      }
    >
      <FareCalendarContent route={route} />
    </Suspense>
  );
}
