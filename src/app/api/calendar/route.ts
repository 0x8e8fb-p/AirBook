import { NextResponse } from "next/server";
import { calendarRequestSchema } from "@/lib/validators";
import { travelpayoutsApi, TravelpayoutsConfigError, TravelpayoutsError } from "@/lib/api/travelpayoutsClient";
import { getHolidays } from "@/lib/holidays";
import type { CalendarDay, FlightSource } from "@/lib/types";

export const runtime = "nodejs";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDayMap(
  year: number,
  month: number,
  faresByDate: Map<string, number>,
  holidayMap: Map<string, string>,
): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = startOfToday();
  const days: CalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const date = new Date(year, month - 1, d);
    const isPast = date < today;
    const holidayName = holidayMap.get(dateStr);
    const price = isPast ? null : faresByDate.get(dateStr) ?? null;

    days.push({
      date: dateStr,
      cheapestPrice: price,
      source: price !== null ? ("travelpayouts_calendar" as FlightSource) : null,
      isHoliday: Boolean(holidayName),
      holidayName,
      priceLevel: null,
    });
  }

  const prices = days
    .map((d) => d.cheapestPrice)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length > 0) {
    const sorted = [...prices].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    for (const day of days) {
      if (day.cheapestPrice === null) continue;
      if (day.cheapestPrice <= p25) day.priceLevel = "cheap";
      else if (day.cheapestPrice >= p75) day.priceLevel = "expensive";
      else day.priceLevel = "average";
    }
  }

  return days;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = calendarRequestSchema.safeParse({
    origin: searchParams.get("origin"),
    destination: searchParams.get("destination"),
    month: parseInt(searchParams.get("month") || "0", 10),
    year: parseInt(searchParams.get("year") || "0", 10),
    cabinClass: searchParams.get("cabin") || "economy",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { origin, destination, month, year } = parsed.data;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const holidayMap = new Map<string, string>(
    getHolidays(year).map((h) => [h.date, h.name]),
  );

  try {
    const { days: apiDays } = await travelpayoutsApi.faresCalendar({
      from: origin,
      to: destination,
      month: monthStr,
    });

    const fareMap = new Map<string, number>();
    for (const d of apiDays) {
      if (d.cheapest !== null && d.cheapest > 0) fareMap.set(d.date, d.cheapest);
    }

    const days = buildDayMap(year, month, fareMap, holidayMap);
    return NextResponse.json(
      { origin, destination, month, year, days },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError) {
      return NextResponse.json(
        { error: "Fare calendar unavailable: Travelpayouts is not configured" },
        { status: 503 },
      );
    }
    const status = err instanceof TravelpayoutsError ? err.status : 502;
    console.error("Calendar fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to load fare calendar", upstreamStatus: status },
      { status: 502 },
    );
  }
}
