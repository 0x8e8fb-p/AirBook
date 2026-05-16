import {
  flightDataOrchestrator,
  type FlightSearchParams,
  type RawFlightOffer,
} from "@/lib/api/flight-data-provider";
import { AIRLINES } from "@/lib/constants";
import { calculateBestEffectivePrice, type FlightPriceDetails } from "@/lib/flight/offerEngine";
import type { CabinClass, FlightAvailabilityState, FlightDataFreshness, FlightResult, FlightSegment } from "@/lib/types";

export type FetchFlightsOptions = {
  userCards?: string[];
  cabin?: CabinClass;
  passengers?: number;
  fresh?: boolean;
};

export type FetchFlightsResponse = {
  flights: FlightResult[];
  availabilityState: FlightAvailabilityState;
};

export class FlightSearchClientError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "FlightSearchClientError";
    this.cause = cause;
  }
}

function resolveAirlineName(code: string): string {
  return AIRLINES[code]?.name ?? code;
}

function normalizeFetchOptions(userCardsOrOptions?: string[] | FetchFlightsOptions): FetchFlightsOptions {
  if (Array.isArray(userCardsOrOptions)) {
    return { userCards: userCardsOrOptions };
  }

  return userCardsOrOptions ?? {};
}

function buildSearchHash(origin: string, destination: string, date: string, options: FetchFlightsOptions): string {
  return [origin, destination, date, options.cabin ?? "economy", options.passengers ?? 1].join("-");
}

function buildSegment(offer: RawFlightOffer): FlightSegment {
  const airlineName = resolveAirlineName(offer.airline);
  const airlineInfo = AIRLINES[offer.airline];

  return {
    airline: offer.airline,
    airlineName,
    airlineLogo: airlineInfo?.logo,
    flightNumber: offer.flightNumber,
    origin: offer.origin,
    originCity: offer.origin,
    destination: offer.destination,
    destinationCity: offer.destination,
    departureTime: offer.departureTime,
    arrivalTime: offer.arrivalTime,
    durationMinutes: offer.durationMinutes,
  };
}

function availabilityRank(state?: FlightAvailabilityState): number {
  switch (state) {
    case "bookable_live":
      return 3;
    case "reference_only":
      return 2;
    default:
      return 1;
  }
}

function freshnessRank(freshness?: FlightDataFreshness): number {
  switch (freshness) {
    case "live":
      return 3;
    case "cached":
      return 2;
    default:
      return 1;
  }
}

function sortFlightsForDisplay(flights: FlightResult[]): FlightResult[] {
  return [...flights].sort((a, b) => {
    const availabilityDiff = availabilityRank(b.availabilityState) - availabilityRank(a.availabilityState);
    if (availabilityDiff !== 0) {
      return availabilityDiff;
    }

    const freshnessDiff = freshnessRank(b.dataFreshness) - freshnessRank(a.dataFreshness);
    if (freshnessDiff !== 0) {
      return freshnessDiff;
    }

    const priceDiff = a.price - b.price;
    if (priceDiff !== 0) {
      return priceDiff;
    }

    return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
  });
}

function mapOfferToFlightResult(
  offer: RawFlightOffer,
  pricing: FlightPriceDetails,
  context: { fetchedAt: string; searchHash: string },
): FlightResult {
  const airlineName = resolveAirlineName(offer.airline);
  const airlineInfo = AIRLINES[offer.airline];

  return {
    id: offer.id,
    source: offer.source,
    segments: [buildSegment(offer)],
    price: pricing.effectivePrice,
    currency: offer.currency,
    pricePerAdult: pricing.effectivePrice,
    basePrice: pricing.baseFare,
    appliedOffer: pricing.appliedOffer,
    airline: offer.airline,
    airlineName,
    airlineLogo: airlineInfo?.logo,
    flightNumber: offer.flightNumber,
    origin: offer.origin,
    destination: offer.destination,
    departureTime: offer.departureTime,
    arrivalTime: offer.arrivalTime,
    durationMinutes: offer.durationMinutes,
    stops: offer.stops,
    stopCities: offer.stopCities,
    bookingUrl: offer.bookingUrl ?? undefined,
    deepLink: offer.deepLink ?? undefined,
    bookingToken: offer.bookingToken ?? null,
    searchId: offer.searchId ?? null,
    gateId: offer.gateId ?? null,
    availabilityState: offer.availabilityState,
    dataFreshness: offer.dataFreshness,
    confidence: offer.confidence,
    baggageConfirmed: offer.baggageConfirmed ?? false,
    refundabilityConfirmed: offer.refundabilityConfirmed ?? false,
    baggage: offer.baggage,
    refundable: offer.refundable,
    cabinClass: offer.cabinClass,
    seatsRemaining: offer.seatsRemaining,
    fetchedAt: context.fetchedAt,
    searchHash: context.searchHash,
  };
}

export async function fetchFlights(
  origin: string,
  destination: string,
  date: string,
  userCardsOrOptions?: string[] | FetchFlightsOptions,
): Promise<FetchFlightsResponse> {
  const options = normalizeFetchOptions(userCardsOrOptions);
  const userCards = options.userCards ?? [];

  try {
    const searchParams: FlightSearchParams = {
      origin,
      destination,
      date,
      passengers: options.passengers ?? 1,
      cabin: options.cabin ?? "economy",
      fresh: options.fresh,
    };

    const result = await flightDataOrchestrator.searchAll(searchParams);

    if (result.offers.length === 0) {
      return {
        flights: [],
        availabilityState: result.availabilityState,
      };
    }

    const fetchedAt = new Date().toISOString();
    const searchHash = buildSearchHash(origin, destination, date, options);
    const flights = await Promise.all(
      result.offers.map(async (offer): Promise<FlightResult> => {
        const pricing = await calculateBestEffectivePrice(offer.price, userCards, offer.airline);
        return mapOfferToFlightResult(offer, pricing, { fetchedAt, searchHash });
      }),
    );

    return {
      flights: sortFlightsForDisplay(flights),
      availabilityState: result.availabilityState,
    };
  } catch (err) {
    console.error("Error fetching flights:", err);

    if (err instanceof FlightSearchClientError) {
      throw err;
    }

    throw new FlightSearchClientError(
      "We could not load fare availability right now. Please try again.",
      err,
    );
  }
}

export type { RawFlightOffer };
