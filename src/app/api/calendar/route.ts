// ============================================
// AirBook — Fare Calendar API Route
// ============================================

import { NextResponse } from 'next/server';
import { calendarRequestSchema } from '@/lib/validators';
import { INDIAN_HOLIDAYS_2026 } from '@/lib/constants';
import { getAirport } from '@/lib/airports';
import type { CalendarDay } from '@/lib/types';

export const runtime = 'nodejs';

/** Generate semi-realistic fare calendar data for demo */
function generateCalendarData(
  origin: string,
  destination: string,
  year: number,
  month: number
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Base price derived from route
  const orig = getAirport(origin);
  const dest = getAirport(destination);
  let basePrice = 4500;
  if (orig && dest) {
    const dLat = (dest.lat - orig.lat) * 111;
    const dLng = (dest.lng - orig.lng) * 85;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    basePrice = Math.max(2000, Math.round(dist * 3.0));
  }

  const holidayDates = new Set<string>(
    INDIAN_HOLIDAYS_2026.map((h) => h.date as string)
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    if (isPast) {
      days.push({
        date: dateStr,
        cheapestPrice: null,
        source: null,
        isHoliday: holidayDates.has(dateStr),
        holidayName: INDIAN_HOLIDAYS_2026.find((h) => h.date === dateStr)?.name,
        priceLevel: null,
      });
      continue;
    }

    // Price variation factors
    let priceMult = 1.0;

    // Weekend premium
    if (dayOfWeek === 0 || dayOfWeek === 6) priceMult *= 1.15;
    // Friday premium
    if (dayOfWeek === 5) priceMult *= 1.10;
    // Tuesday/Wednesday discount
    if (dayOfWeek === 2 || dayOfWeek === 3) priceMult *= 0.88;

    // Holiday premium
    if (holidayDates.has(dateStr)) priceMult *= 1.35;
    // Near-holiday boost (day before/after holiday)
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    if (
      holidayDates.has(prevDay.toISOString().split('T')[0]) ||
      holidayDates.has(nextDay.toISOString().split('T')[0])
    ) {
      priceMult *= 1.15;
    }

    // Random daily variation (±12%)
    const seed = (day * 7 + month * 31) % 100;
    const randomVar = 0.88 + (seed / 100) * 0.24;
    priceMult *= randomVar;

    // Days until travel premium (closer = more expensive)
    const daysUntil = Math.floor((date.getTime() - Date.now()) / 86400000);
    if (daysUntil <= 3) priceMult *= 1.40;
    else if (daysUntil <= 7) priceMult *= 1.20;
    else if (daysUntil <= 14) priceMult *= 1.05;
    else if (daysUntil >= 45) priceMult *= 0.92;

    const price = Math.round(basePrice * priceMult);

    days.push({
      date: dateStr,
      cheapestPrice: price,
      source: 'duffel',
      isHoliday: holidayDates.has(dateStr),
      holidayName: INDIAN_HOLIDAYS_2026.find((h) => h.date === dateStr)?.name,
      priceLevel: null, // computed below
    });
  }

  // Compute price levels (relative to this month's data)
  const prices = days.filter((d) => d.cheapestPrice !== null).map((d) => d.cheapestPrice!);
  if (prices.length > 0) {
    const sorted = [...prices].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];

    for (const day of days) {
      if (day.cheapestPrice === null) continue;
      if (day.cheapestPrice <= p25) day.priceLevel = 'cheap';
      else if (day.cheapestPrice >= p75) day.priceLevel = 'expensive';
      else day.priceLevel = 'average';
    }
  }

  return days;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const parsed = calendarRequestSchema.safeParse({
    origin: searchParams.get('origin'),
    destination: searchParams.get('destination'),
    month: parseInt(searchParams.get('month') || '0'),
    year: parseInt(searchParams.get('year') || '0'),
    cabinClass: searchParams.get('cabin') || 'economy',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { origin, destination, month, year } = parsed.data;
  const days = generateCalendarData(origin, destination, year, month);

  return NextResponse.json(
    { origin, destination, month, year, days },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
