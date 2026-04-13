"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAirport, getAirportDisplay } from "@/lib/airports";
import { formatPrice, INDIAN_HOLIDAYS_2026 } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import {
  Plane,
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
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
        <div className="container-app py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Fare Calendar</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <span>{originDisplay}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{destDisplay}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-app py-6 max-w-3xl mx-auto">
        {/* Legend + Info */}
        {priceStats && !isLoading && (
          <div className="glass-card p-4 mb-6">
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
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">
            {MONTHS[month - 1]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[var(--text-tertiary)] py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="calendar-day skeleton h-16" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) {
                return <div key={`pad-${i}`} className="min-h-[60px]" />;
              }

              const dateNum = new Date(day.date).getDate();
              const isToday =
                day.date === new Date().toISOString().split("T")[0];
              const isCheapest =
                cheapestDay && day.date === cheapestDay.date;

              return (
                <button
                  key={day.date}
                  onClick={() => {
                    if (day.cheapestPrice) {
                      router.push(
                        `/search?from=${origin}&to=${destination}&date=${day.date}&adults=1&cabin=economy`
                      );
                    }
                  }}
                  disabled={!day.cheapestPrice}
                  className={`calendar-day relative ${
                    day.priceLevel || ""
                  } ${isToday ? "today" : ""} ${
                    !day.cheapestPrice
                      ? "opacity-40 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isCheapest && (
                    <Star className="absolute top-1 right-1 w-3 h-3 text-[var(--color-savings)]" />
                  )}
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isToday ? "text-[var(--color-primary)]" : ""
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
                  {day.isHoliday && (
                    <div
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--fare-expensive)]"
                      title={day.holidayName}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Holiday List for this month */}
        {!isLoading && days.some((d) => d.isHoliday) && (
          <div className="mt-6 glass-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--text-tertiary)]" />
              Holidays this month
            </h3>
            <div className="space-y-1">
              {days
                .filter((d) => d.isHoliday)
                .map((d) => (
                  <div
                    key={d.date}
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--fare-expensive)]" />
                    <span>
                      {new Date(d.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      — {d.holidayName}
                    </span>
                    {d.cheapestPrice && (
                      <span className="ml-auto text-[var(--fare-expensive)] font-medium">
                        {formatPrice(d.cheapestPrice)}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const params = useParams();
  const route = (params?.route as string) || "del-to-bom";

  return <FareCalendarContent route={route} />;
}
