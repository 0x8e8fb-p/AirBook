appimport {
  flightDataOrchestrator,
  type FlightProviderName,
  type FlightSearchParams,
  type RawFlightOffer,
} from "@/lib/api/flight-data-provider";
import { calculateBestEffectivePrice, type FlightPriceDetails } from "@/lib/flight/offerEngine";
import type { CabinClass, FlightResult, FlightSegment, FlightSource } from "@/lib/types";
import { AIRLINES } from "@/lib/constants";

export type FetchFlightsOptions = {
  userCards?: string[];
  cabin?: CabinClass;
  passengers?: number;
  fresh?: boolean;
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

function resolveSource(raw: FlightProviderName): FlightSource {
  const sourceMap: Record<FlightProviderName, FlightSource> = {
    amadeus: "amadeus",
    travelpayouts: "travelpayouts_calendar",
    simulated: "master_api",
  };
  return sourceMap[raw] ?? "master_api";
}

function normalizeFetchOptions(
  userCardsOrOptions?: string[] | FetchFlightsOptions,
): FetchFlightsOptions {
  if (Array.isArray(userCardsOrOptions)) {
    return { userCards: userCardsOrOptions };
  }
  return userCardsOrOptions ?? {};
}

function mapOfferToFlightResult(
  offer: RawFlightOffer,
  pricing: FlightPriceDetails,
): FlightResult {
  const airlineName = resolveAirlineName(offer.airline);
  const airlineInfo = AIRLINES[offer.airline];

  const segment: FlightSegment = {
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

  return {
    id: offer.id,
    source: resolveSource(offer.source),
    segments: [segment],

    price: pricing.effectivePrice,
    currency: "INR",
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
    bookingToken: null,
    searchId: null,
    gateId: null,

    baggage: offer.baggage,
    refundable: offer.refundable,
    cabinClass: offer.cabinClass,

    seatsRemaining: offer.seatsRemaining,

    fetchedAt: new Date().toISOString(),
    searchHash: `${offer.origin}-${offer.destination}-${new Date().toISOString().slice(0, 10)}`,
  };
}

export async function fetchFlights(
  origin: string,
  destination: string,
  date: string,
  userCardsOrOptions?: string[] | FetchFlightsOptions,
): Promise<FlightResult[]> {
  const options = normalizeFetchOptions(userCardsOrOptions);
  const userCards = options.userCards ?? [];

  try {
    const searchParams: FlightSearchParams = {
      origin,
      destination,
      date,
      passengers: options.passengers ?? 1,
      cabin: options.cabin ?? "economy",
    };

    const { offers } = await flightDataOrchestrator.searchAll(searchParams);

    if (offers.length === 0) {
      return [];
    }

    // Enrich with wallet-aware pricing
    const enriched = await Promise.all(
      offers.map(async (offer): Promise<FlightResult> => {
        const pricing = await calculateBestEffectivePrice(
          offer.price,
          userCards,
          offer.airline,
        );
        return mapOfferToFlightResult(offer, pricing);
      }),
    );

    // Sort by effective price (cheapest first)
    enriched.sort((a, b) => a.price - b.price);

    return enriched;
  } catch (err) {
    console.error("Error fetching flights:", err);
    
    if (err instanceof FlightSearchClientError) {
      throw err;
    }
    
    throw new FlightSearchClientError(
      "We could not load live fares right now. Please try again.",
      err,
    );
  }
}

export type { RawFlightOffer };