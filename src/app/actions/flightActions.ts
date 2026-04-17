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
import { flightCache } from '@/lib/flight/flightCache';

export interface EnrichedFlight {
  id: string;
  source?: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  pricing: FlightPriceDetails;
  stops: number;
}

export async function getGoogleFlightsAction(origin: string, destination: string, dateString: string, userCards?: string[]): Promise<EnrichedFlight[]> {
  try {
    const cacheKey = `${origin}-${destination}-${dateString}-${userCards?.join(',') || ''}-google`;
    const cachedFlights = flightCache.get(cacheKey);
    
    if (cachedFlights) {
      console.log(`[Cache Hit] Returning Google flights for ${origin}-${destination}`);
      return cachedFlights;
    }

    const rawFlights = await scrapeGoogleFlights(origin, destination, dateString);
    if (!rawFlights || rawFlights.length === 0) return [];

    const flightMap = new Map<string, StandardizedFlight & { source?: string }>();
    for (const f of rawFlights) {
      if (f.basePriceINR <= 0) continue;
      const hour = f.departureTime.substring(0, 13);
      const key = `${f.flightNumber}-${hour}`;
      if (!flightMap.has(key) || f.basePriceINR < flightMap.get(key)!.basePriceINR) {
        flightMap.set(key, { ...f, source: 'google_flights' });
      }
    }
    const uniqueFlights = Array.from(flightMap.values());

    const enrichedFlights = await Promise.all(uniqueFlights.map(async flight => ({
      id: flight.id,
      source: flight.source,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      stops: flight.stops || 0,
      pricing: await calculateBestEffectivePrice(flight.basePriceINR, userCards, flight.airline)
    })));

    logSearchAction(origin, destination, dateString, enrichedFlights.length).catch(e => console.error("Error logging search from getGoogleFlightsAction:", e));

    if (enrichedFlights.length > 0) {
      const lowestFlight = enrichedFlights.reduce((prev, current) => 
        (prev.pricing.effectivePrice < current.pricing.effectivePrice) ? prev : current
      );

      const departureDate = new Date(dateString);
      Promise.resolve().then(async () => {
        try {
          const route = await prisma.flightRoute.upsert({
            where: { origin_destination: { origin, destination } },
            update: {},
            create: { origin, destination }
          });

          const recentLog = await prisma.priceHistory.findFirst({
            where: {
              routeId: route.id,
              departureDate,
              basePrice: { gt: 0 },
              recordedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
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
          }
        } catch (dbError) {
          console.error("Failed to log price history:", dbError);
        }
      });
    }

    flightCache.set(cacheKey, enrichedFlights);
    return enrichedFlights;
  } catch (error) {
    console.error("Google Flight search failed:", error);
    return [];
  }
}

export async function getOTAFlightsAction(origin: string, destination: string, dateString: string, userCards?: string[]): Promise<EnrichedFlight[]> {
  try {
    const cacheKey = `${origin}-${destination}-${dateString}-${userCards?.join(',') || ''}-ota`;
    const cachedFlights = flightCache.get(cacheKey);
    
    if (cachedFlights) {
      console.log(`[Cache Hit] Returning OTA flights for ${origin}-${destination}`);
      return cachedFlights;
    }

    const scrapers = [
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

    const flightMap = new Map<string, StandardizedFlight & { source?: string }>();
    for (const f of rawFlights) {
      if (f.basePriceINR <= 0) continue;
      const hour = f.departureTime.substring(0, 13);
      const key = `${f.flightNumber}-${hour}`;
      
      if (!flightMap.has(key) || f.basePriceINR < flightMap.get(key)!.basePriceINR) {
        let source = 'master_api';
        if (f.id.startsWith('ixigo')) source = 'ixigo';
        else if (f.id.startsWith('mmt')) source = 'makemytrip';
        else if (f.id.startsWith('ct')) source = 'cleartrip';

        flightMap.set(key, { ...f, source });
      }
    }
    const uniqueFlights = Array.from(flightMap.values());

    const enrichedFlights = await Promise.all(uniqueFlights.map(async flight => ({
      id: flight.id,
      source: flight.source,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      stops: flight.stops || 0,
      pricing: await calculateBestEffectivePrice(flight.basePriceINR, userCards, flight.airline)
    })));

    flightCache.set(cacheKey, enrichedFlights);
    return enrichedFlights;
  } catch (error) {
    console.error("OTA Flight search failed:", error);
    return [];
  }
}

export async function getAndTrackFlights(origin: string, destination: string, dateString: string, userCards?: string[]): Promise<EnrichedFlight[]> {
  try {
    const cacheKey = `${origin}-${destination}-${dateString}-${userCards?.join(',') || ''}`;
    const cachedFlights = flightCache.get(cacheKey);
    
    if (cachedFlights) {
      console.log(`[Cache Hit] Returning flights for ${origin}-${destination}`);
      return cachedFlights;
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

    // 2. Apply Smart-Pricing (async — DB-backed offers)
    const enrichedFlights = await Promise.all(uniqueFlights.map(async flight => ({
      id: flight.id,
      source: flight.source,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      stops: flight.stops || 0,
      pricing: await calculateBestEffectivePrice(flight.basePriceINR, userCards, flight.airline)
    })));

    // Log the search action here since this is where flights are successfully fetched
    logSearchAction(origin, destination, dateString, enrichedFlights.length).catch(e => console.error("Error logging search from getAndTrackFlights:", e));

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

    flightCache.set(cacheKey, enrichedFlights);
    return enrichedFlights;
  } catch (error) {
    console.error("Flight search failed:", error);
    throw new Error("Failed to retrieve flights via Master API");
  }
}

export async function logSearchAction(origin: string, destination: string, dateString: string, count: number) {
  try {
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user && (session.user as any).id) {
        userId = (session.user as any).id;
      }
    } catch (e) {
      console.log("Could not get session in logSearchAction, proceeding anonymously");
    }
    
    let parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(); // fallback to today if invalid
    }
    
    // Create one record in SearchHistory to represent the user's search
    await prisma.searchHistory.create({
      data: {
        userId,
        origin,
        destination,
        departureDate: parsedDate
      }
    });

    // Create fake booking clicks with 0 price/discount to inflate the search count
    // This is a hack to reuse the same counting logic without breaking the schema
    const records = Array.from({ length: Math.max(0, count - 1) }).map(() => ({
      userId,
      route: `${origin}-${destination}`,
      airline: "SEARCH_COUNT",
      price: 0,
      discountSaved: 0
    }));

    if (records.length > 0) {
      await prisma.bookingClick.createMany({
        data: records
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to log search history action:", error);
    return { success: false };
  }
}

export async function logBookingClick(route: string, airline: string, price: number, discountSaved: number) {
  try {
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user && (session.user as any).id) {
        userId = (session.user as any).id;
      }
    } catch (e) {
      console.log("Could not get session in logBookingClick, proceeding anonymously");
    }

    await prisma.bookingClick.create({
      data: {
        userId,
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
    // Total distinct searches
    const actualSearches = await prisma.searchHistory.count();
    
    // Additional inflated searches (where airline = "SEARCH_COUNT")
    const inflatedSearches = await prisma.bookingClick.count({
      where: {
        airline: "SEARCH_COUNT"
      }
    });

    const totalSearches = actualSearches + inflatedSearches;

    const savingsAgg = await prisma.bookingClick.aggregate({
      where: {
        airline: {
          not: "SEARCH_COUNT" // Only count actual bookings for money saved
        }
      },
      _sum: {
        discountSaved: true
      }
    });

    return {
      searchesToday: totalSearches || 0,
      moneySavedMonth: savingsAgg._sum.discountSaved || 0
    };
  } catch (error) {
    console.error("Failed to get platform stats:", error);
    return { searchesToday: 0, moneySavedMonth: 0 };
  }
}

export async function fetchCheckoutOffers(baseFare: number, airlineCode?: string) {
  const { getAllApplicableOffers } = await import('@/lib/flight/offerEngine');
  return await getAllApplicableOffers(baseFare, [], airlineCode);
}

