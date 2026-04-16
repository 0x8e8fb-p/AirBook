'use server';

import { searchFlights } from '@/lib/flight/tequilaClient';
import { calculateBestEffectivePrice, FlightPriceDetails } from '@/lib/flight/offerEngine';
import { prisma } from '@/lib/prisma';

export interface EnrichedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  pricing: FlightPriceDetails;
}

export async function getAndTrackFlights(origin: string, destination: string, dateString: string): Promise<EnrichedFlight[]> {
  try {
    // 1. Fetch raw flights
    const rawFlights = await searchFlights(origin, destination, dateString);
    
    if (rawFlights.length === 0) return [];

    // 2. Apply Smart-Pricing
    const enrichedFlights = rawFlights.map(flight => ({
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      pricing: calculateBestEffectivePrice(flight.basePriceINR)
    }));

    // 3. Find the lowest effective price from this batch
    const lowestFlight = enrichedFlights.reduce((prev, current) => 
      (prev.pricing.effectivePrice < current.pricing.effectivePrice) ? prev : current
    );

    // 4. Log to database asynchronously (don't block response)
    const departureDate = new Date(dateString);
    
    // Fire and forget DB logging
    Promise.resolve().then(async () => {
      try {
        const route = await prisma.flightRoute.upsert({
          where: { origin_destination: { origin, destination } },
          update: {},
          create: { origin, destination }
        });

        await prisma.priceHistory.create({
          data: {
            routeId: route.id,
            departureDate,
            effectivePrice: lowestFlight.pricing.effectivePrice,
            basePrice: lowestFlight.pricing.baseFare,
            airline: lowestFlight.airline
          }
        });
      } catch (dbError) {
        console.error("Failed to log price history:", dbError);
      }
    });

    return enrichedFlights;
  } catch (error) {
    console.error("Flight search failed:", error);
    throw new Error("Failed to retrieve flights");
  }
}
