"use server";

import { getServerSession } from "next-auth/next";
import { travelpayoutsApi, TravelpayoutsConfigError, TravelpayoutsError } from "@/lib/api/travelpayoutsClient";
import type { Fare } from "@/lib/api/travelpayoutsTypes";
import { calculateBestEffectivePrice, type FlightPriceDetails } from "@/lib/flight/offerEngine";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export interface EnrichedFlight {
  id: string;
  source: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number | null;
  pricing: FlightPriceDetails;
  stops: number;
  bookingToken?: string | null;
  searchId?: string | null;
  gateId?: string | number | null;
}

async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string } | undefined;
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function buildFlightId(fare: Fare, index: number): string {
  const core = [fare.sourceApi, fare.airline, fare.flightNumber ?? "NN", fare.departureDate, fare.departureTime ?? index].join("-");
  return core.replace(/\s+/g, "");
}

function dedupeFares(fares: Fare[]): Fare[] {
  const map = new Map<string, Fare>();
  for (const f of fares) {
    if (!(f.price > 0)) continue;
    const hourBucket = (f.departureTime ?? "").slice(0, 13);
    const key = `${f.flightNumber ?? "NN"}-${hourBucket}`;
    const current = map.get(key);
    if (!current || f.price < current.price) map.set(key, f);
  }
  return Array.from(map.values());
}

async function enrichFares(fares: Fare[], userCards?: string[]): Promise<EnrichedFlight[]> {
  return Promise.all(
    fares.map(async (fare, i): Promise<EnrichedFlight> => {
      const pricing = await calculateBestEffectivePrice(fare.price, userCards, fare.airline);
      return {
        id: buildFlightId(fare, i),
        source: fare.sourceApi,
        airline: fare.airline,
        flightNumber: fare.flightNumber ?? "",
        departureTime: fare.departureTime ?? fare.departureDate,
        arrivalTime: fare.arrivalTime ?? fare.departureDate,
        durationMinutes: fare.durationMinutes ?? null,
        stops: fare.stops ?? 0,
        bookingToken: fare.bookingToken ?? null,
        searchId: fare.searchId ?? null,
        gateId: fare.gateId ?? null,
        pricing,
      };
    }),
  );
}

async function trackLowestPrice(
  origin: string,
  destination: string,
  dateString: string,
  enriched: EnrichedFlight[],
) {
  if (enriched.length === 0) return;
  const lowest = enriched.reduce(
    (prev, current) => (prev.pricing.effectivePrice < current.pricing.effectivePrice ? prev : current),
    enriched[0],
  );

  const departureDate = new Date(dateString);
  if (Number.isNaN(departureDate.getTime())) return;

  try {
    const route = await prisma.flightRoute.upsert({
      where: { origin_destination: { origin, destination } },
      update: {},
      create: { origin, destination },
    });

    const recent = await prisma.priceHistory.findFirst({
      where: {
        routeId: route.id,
        departureDate,
        basePrice: { gt: 0 },
        recordedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (!recent) {
      await prisma.priceHistory.create({
        data: {
          routeId: route.id,
          departureDate,
          effectivePrice: lowest.pricing.effectivePrice,
          basePrice: lowest.pricing.baseFare,
          airline: lowest.airline,
        },
      });
    }
  } catch (err) {
    console.error("Failed to log price history:", err);
  }
}

export async function searchFlightsAction(
  origin: string,
  destination: string,
  dateString: string,
  userCards?: string[],
  opts: { pax?: number; cabin?: "economy" | "premium_economy" | "business" | "first"; fresh?: boolean } = {},
): Promise<EnrichedFlight[]> {
  try {
    const { fares } = await travelpayoutsApi.searchFares({
      from: origin,
      to: destination,
      date: dateString,
      pax: opts.pax ?? 1,
      cabin: opts.cabin ?? "economy",
      fresh: opts.fresh,
    });

    const deduped = dedupeFares(fares);
    const enriched = await enrichFares(deduped, userCards);

    logSearchAction(origin, destination, dateString).catch((e) =>
      console.error("logSearchAction failed:", e),
    );

    void trackLowestPrice(origin, destination, dateString, enriched);

    return enriched;
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError) {
      console.error("Travelpayouts not configured:", err.message);
      return [];
    }
    if (err instanceof TravelpayoutsError) {
      console.error(`Travelpayouts ${err.status} on searchFares:`, err.message);
      return [];
    }
    console.error("Flight search failed:", err);
    return [];
  }
}

export async function getAndTrackFlights(
  origin: string,
  destination: string,
  dateString: string,
  userCards?: string[],
): Promise<EnrichedFlight[]> {
  return searchFlightsAction(origin, destination, dateString, userCards);
}

export async function logSearchAction(
  origin: string,
  destination: string,
  dateString: string,
) {
  try {
    const userId = await getSessionUserId();
    let parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) parsedDate = new Date();

    await prisma.searchHistory.create({
      data: { userId, origin, destination, departureDate: parsedDate },
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to log search history action:", err);
    return { success: false };
  }
}

export async function logBookingClick(route: string, airline: string, price: number, discountSaved: number) {
  try {
    const userId = await getSessionUserId();
    await prisma.bookingClick.create({
      data: { userId, route, airline, price, discountSaved },
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to log booking click:", err);
    return { success: false };
  }
}

export async function getPlatformStats() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [searchesToday, savingsAgg] = await Promise.all([
      prisma.searchHistory.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.bookingClick.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { discountSaved: true },
      }),
    ]);

    return {
      searchesToday,
      moneySavedMonth: savingsAgg._sum.discountSaved ?? 0,
    };
  } catch (err) {
    console.error("Failed to get platform stats:", err);
    return { searchesToday: 0, moneySavedMonth: 0 };
  }
}

export async function fetchCheckoutOffers(baseFare: number, airlineCode?: string, userCards?: string[]) {
  const { getAllApplicableOffers } = await import("@/lib/flight/offerEngine");
  return getAllApplicableOffers(baseFare, userCards, airlineCode);
}

export async function fetchPriceTrend(origin: string, destination: string, date: string) {
  const { analyzePriceTrend } = await import("@/lib/flight/priceTrend");
  return analyzePriceTrend(origin, destination, date);
}

export interface NearbyDay {
  date: string;
  price: number;
  deltaFromSelected: number;
}

export async function getCheapestNearbyDays(
  origin: string,
  destination: string,
  selectedDate: string,
  windowDays = 3,
): Promise<{ selectedPrice: number | null; cheapest: NearbyDay[] }> {
  try {
    const sel = new Date(selectedDate);
    if (Number.isNaN(sel.getTime())) return { selectedPrice: null, cheapest: [] };

    const months = new Set<string>();
    for (let d = -windowDays; d <= windowDays; d++) {
      const cursor = new Date(sel);
      cursor.setDate(sel.getDate() + d);
      months.add(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    }

    const byDate = new Map<string, number>();
    await Promise.all(
      Array.from(months).map(async (month) => {
        try {
          const { days } = await travelpayoutsApi.faresCalendar({ from: origin, to: destination, month });
          for (const d of days) if (d.cheapest !== null && d.cheapest > 0) byDate.set(d.date, d.cheapest);
        } catch {
          // tolerate per-month failure
        }
      }),
    );

    const selectedPrice = byDate.get(selectedDate) ?? null;
    const results: NearbyDay[] = [];
    for (let d = -windowDays; d <= windowDays; d++) {
      if (d === 0) continue;
      const cursor = new Date(sel);
      cursor.setDate(sel.getDate() + d);
      const key = cursor.toISOString().slice(0, 10);
      const price = byDate.get(key);
      if (typeof price !== "number") continue;
      results.push({
        date: key,
        price,
        deltaFromSelected: selectedPrice !== null ? price - selectedPrice : 0,
      });
    }

    results.sort((a, b) => a.price - b.price);
    return { selectedPrice, cheapest: results.slice(0, 3) };
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      return { selectedPrice: null, cheapest: [] };
    }
    console.error("getCheapestNearbyDays failed:", err);
    return { selectedPrice: null, cheapest: [] };
  }
}

export async function fetchSplitTicketSuggestions(origin: string, destination: string, date: string) {
  const { findSplitTickets } = await import("@/lib/flight/splitTicket");
  return findSplitTickets(origin, destination, date);
}

export async function fetchHiddenCityOpportunities(origin: string, destination: string, date: string) {
  const { findHiddenCityOpportunities } = await import("@/lib/flight/splitTicket");
  return findHiddenCityOpportunities(origin, destination, date);
}

// ─── NEW: Travelpayouts aggregator integration ──────────────────────

export async function searchAggregatorFlights(
  fromCode: string,
  toCode: string,
  departDate: string,
  returnDate?: string,
) {
  try {
    return await travelpayoutsApi.aggregatorSearch(
      fromCode,
      toCode,
      departDate,
      returnDate,
    );
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Aggregator search error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getFlightStatus(flightNumber: string) {
  try {
    return await travelpayoutsApi.getFlightStatus(flightNumber);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Flight status error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getLiveFlightsSnapshot(bounds?: { lamin: number; lamax: number; lomin: number; lomax: number }) {
  try {
    return await travelpayoutsApi.liveFlights(bounds);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Live flights error:", err.message);
      return { flights: [] };
    }
    throw err;
  }
}

export async function createBookingLinkAction(searchId: string, bookingToken: string) {
  try {
    return await travelpayoutsApi.createBookingLink(searchId, bookingToken);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Booking link error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getBestDealForRoute(
  origin: string,
  destination: string,
  bankName?: string,
  cardType?: string,
) {
  try {
    return await travelpayoutsApi.getBestDeal(origin, destination, bankName, cardType);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Best deal error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getAirportWeather(iata: string) {
  try {
    return await travelpayoutsApi.getAirportWeather(iata);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Weather error:", err.message);
      return null;
    }
    throw err;
  }
}
