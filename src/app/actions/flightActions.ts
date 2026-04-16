'use server';

import { scrapeIxigoFlights } from '@/lib/flight/scrapers/ixigoScraper';
import { scrapeGoogleFlights } from '@/lib/flight/scrapers/googleFlightsScraper';
import { scrapeMMTFlights } from '@/lib/flight/scrapers/mmtScraper';
import { scrapeCleartripFlights } from '@/lib/flight/scrapers/cleartripScraper';
import { calculateBestEffectivePrice, FlightPriceDetails } from '@/lib/flight/offerEngine';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StandardizedFlight } from '@/lib/flight/tequilaClient';

export interface EnrichedFlight {
  id: string;
  source?: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  pricing: FlightPriceDetails;
}

export async function getAndTrackFlights(origin: string, destination: string, dateString: string, userCards?: string[]): Promise<EnrichedFlight[]> {
  try {
    // Log search history for stats
    try {
      const session = await getServerSession(authOptions);
      await prisma.searchHistory.create({
        data: {
          userId: session?.user ? (session.user as any).id : null,
          origin,
          destination,
          departureDate: new Date(dateString)
        }
      });
    } catch (e) {
      console.error("Failed to log search history in flight actions:", e);
    }
    // 1. Fetch raw flights via Master API Scrapers concurrently
    const scrapers = [
      scrapeGoogleFlights(origin, destination, dateString),
      scrapeIxigoFlights(origin, destination, dateString),
      scrapeMMTFlights(origin, destination, dateString),
      scrapeCleartripFlights(origin, destination, dateString)
    ];

    const results = await Promise.allSettled(scrapers);

    let rawFlights: StandardizedFlight[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        rawFlights.push(...result.value);
      }
    }
    
    if (rawFlights.length === 0) return [];

    // Deduplicate flights by flightNumber and departureTime, keeping the cheapest base price
    // ALSO ensure we don't accidentally keep a flight with base price 0 if it's an error.
    const flightMap = new Map<string, StandardizedFlight & { source?: string }>();
    for (const f of rawFlights) {
      if (f.basePriceINR <= 0) continue; // Ignore zero or negative prices
      
      // Create a composite key (flight number + hour of departure to handle minor timezone string differences)
      const hour = f.departureTime.substring(0, 13); // e.g. 2026-05-15T05
      const key = `${f.flightNumber}-${hour}`;
      
      if (!flightMap.has(key) || f.basePriceINR < flightMap.get(key)!.basePriceINR) {
        // Tag the source based on the ID
        let source = 'master_api';
        if (f.id.startsWith('google')) source = 'google_flights';
        else if (f.id.startsWith('ixigo')) source = 'ixigo';
        else if (f.id.startsWith('mmt')) source = 'makemytrip';
        else if (f.id.startsWith('ct')) source = 'cleartrip';

        flightMap.set(key, { ...f, source });
      }
    }
    const uniqueFlights = Array.from(flightMap.values());

    // 2. Apply Smart-Pricing
    const enrichedFlights = uniqueFlights.map(flight => ({
      id: flight.id,
      source: flight.source,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      pricing: calculateBestEffectivePrice(flight.basePriceINR, userCards)
    }));

    // 3. Find the lowest effective price from this batch
    const lowestFlight = enrichedFlights.reduce((prev, current) => 
      (prev.pricing.effectivePrice < current.pricing.effectivePrice) ? prev : current
    );

    // 4. Log to database asynchronously
    const departureDate = new Date(dateString);
    
    Promise.resolve().then(async () => {
      try {
        const route = await prisma.flightRoute.upsert({
          where: { origin_destination: { origin, destination } },
          update: {},
          create: { origin, destination }
        });

        // Check if we already logged a price for this route/date recently (e.g. within last hour) to avoid spam
        const recentLog = await prisma.priceHistory.findFirst({
          where: {
            routeId: route.id,
            departureDate,
            basePrice: { gt: 0 },
            recordedAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            }
          }
        });

        if (!recentLog) {
          await prisma.priceHistory.create({
            data: {
              routeId: route.id,
              departureDate,
              effectivePrice: lowestFlight.pricing.effectivePrice,
              basePrice: lowestFlight.pricing.baseFare,
              airline: lowestFlight.airline
            }
          });
          console.log(`Logged price history for ${origin}-${destination} on ${dateString}: ${lowestFlight.pricing.effectivePrice}`);
        } else {
          console.log(`Skipped price history log for ${origin}-${destination} (already logged recently)`);
        }
      } catch (dbError) {
        console.error("Failed to log price history:", dbError);
      }
    });

    return enrichedFlights;
  } catch (error) {
    console.error("Flight search failed:", error);
    throw new Error("Failed to retrieve flights via Master API");
  }
}

export async function logBookingClick(route: string, airline: string, price: number, discountSaved: number) {
  try {
    const session = await getServerSession(authOptions);
    await prisma.bookingClick.create({
      data: {
        userId: session?.user ? (session.user as any).id : null,
        route,
        airline,
        price,
        discountSaved
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to log booking click:", error);
    return { success: false };
  }
}

export async function getPlatformStats() {
  try {
    // Searches today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const searchesToday = await prisma.searchHistory.count({
      where: {
        createdAt: {
          gte: startOfDay
        }
      }
    });

    // Money saved this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const savingsAgg = await prisma.bookingClick.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        discountSaved: true
      }
    });

    return {
      searchesToday: searchesToday || 0,
      moneySavedMonth: savingsAgg._sum.discountSaved || 0
    };
  } catch (error) {
    console.error("Failed to get platform stats:", error);
    return { searchesToday: 0, moneySavedMonth: 0 };
  }
}
