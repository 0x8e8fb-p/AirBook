import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAndTrackFlights } from '@/app/actions/flightActions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const dateStr = searchParams.get('date');

  if (!origin || !destination || !dateStr) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    console.log(`[Test Tracker] Forcing track for ${origin}-${destination} on ${dateStr}`);
    const flights = await getAndTrackFlights(origin, destination, dateStr);
    
    return NextResponse.json({ 
      success: true, 
      flightsFound: flights.length,
      lowestPrice: flights.length > 0 ? Math.min(...flights.map(f => f.pricing.effectivePrice)) : null
    });
  } catch (error) {
    console.error("[Test Tracker] Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}