import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAndTrackFlights } from '@/app/actions/flightActions';

const POPULAR_ROUTES = [
  { origin: 'DEL', destination: 'BOM' },
  { origin: 'BLR', destination: 'DEL' },
  { origin: 'BOM', destination: 'GOI' },
  { origin: 'DEL', destination: 'VTZ' }
];

export async function GET(request: Request) {
  // Simple auth to prevent abuse
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (key !== process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];
  const today = new Date();

  // Track 7, 14, and 30 days out
  const targetDays = [7, 14, 30];

  try {
    for (const route of POPULAR_ROUTES) {
      for (const daysOut of targetDays) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysOut);
        const dateStr = targetDate.toISOString().split('T')[0];

        try {
          console.log(`[Cron] Tracking ${route.origin}-${route.destination} for ${dateStr}`);
          // getAndTrackFlights handles the DB logging internally
          const flights = await getAndTrackFlights(route.origin, route.destination, dateStr);
          results.push({
            route: `${route.origin}-${route.destination}`,
            date: dateStr,
            flightsFound: flights.length,
            lowestPrice: flights.length > 0 ? Math.min(...flights.map(f => f.pricing.effectivePrice)) : null
          });
        } catch (err) {
          console.error(`[Cron] Error tracking ${route.origin}-${route.destination} for ${dateStr}:`, err);
          results.push({
            route: `${route.origin}-${route.destination}`,
            date: dateStr,
            error: String(err)
          });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[Cron] Critical Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}