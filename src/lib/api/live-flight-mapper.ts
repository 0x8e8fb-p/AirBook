import {
  searchFlightsAction,
  type EnrichedFlight,
} from "@/app/actions/flightActions";
import { TravelpayoutsConfigError, TravelpayoutsError } from "@/lib/api/travelpayoutsClient";
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

function computeDuration(flight: EnrichedFlight): number | null {
  if (flight.durationMinutes && flight.durationMinutes > 0) return flight.durationMinutes;
  const dep = new Date(flight.departureTime).getTime();
  const arr = new Date(flight.arrivalTime).getTime();
  if (Number.isNaN(dep) || Number.isNaN(arr)) return null;
  let diff = Math.round((arr - dep) / 60_000);
  if (diff < 0) diff += 24 * 60;
  return diff > 0 ? diff : null;
}

function resolveSource(raw: string | undefined): FlightSource {
  const known: FlightSource[] = [
    "google_flights",
    "ixigo",
    "makemytrip",
    "cleartrip",
    "master_api",
    "travelpayouts_calendar",
    "travelpayouts_realtime",
  ];
  return (known as string[]).includes(raw ?? "") ? (raw as FlightSource) : "master_api";
}

function normalizeFetchOptions(
  userCardsOrOptions?: string[] | FetchFlightsOptions,
): FetchFlightsOptions {
  if (Array.isArray(userCardsOrOptions)) {
    return { userCards: userCardsOrOptions };
  }

  return userCardsOrOptions ?? {};
}

function normalizeSearchError(error: unknown): FlightSearchClientError {
  if (error instanceof TravelpayoutsConfigError) {
    return new FlightSearchClientError(
      "Flight search is not configured in this environment. Please add the required Travelpayouts credentials.",
      error,
    );
  }

  if (error instanceof TravelpayoutsError) {
    if (error.status === 429) {
      return new FlightSearchClientError(
        "Search is temporarily rate-limited. Please wait a moment and try again.",
        error,
      );
    }

    if (error.status === 403) {
      return new FlightSearchClientError(
        "Flight search credentials were rejected by the provider. Please verify the Travelpayouts configuration.",
        error,
      );
    }

    return new FlightSearchClientError(
      error.message || "We could not load live fares right now. Please try again.",
      error,
    );
  }

  if (error instanceof Error) {
    return new FlightSearchClientError(error.message, error);
  }

  return new FlightSearchClientError("We could not load live fares right now. Please try again.", error);
}

function mapEnrichedFlightToResult(
  flight: EnrichedFlight,
  origin: string,
  destination: string,
  date: string,
): FlightResult {
  const airlineName = resolveAirlineName(flight.airline);
  const airlineInfo = AIRLINES[flight.airline];
  const durationMinutes = computeDuration(flight);

  const segment: FlightSegment = {
    airline: flight.airline,
    airlineName,
    airlineLogo: airlineInfo?.logo,
    flightNumber: flight.flightNumber,
    origin,
    originCity: origin,
    destination,
    destinationCity: destination,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    durationMinutes: durationMinutes ?? 0,
  };

  return {
    id: flight.id,
    source: resolveSource(flight.source),
    segments: [segment],

    price: flight.pricing.effectivePrice,
    currency: "INR",
    pricePerAdult: flight.pricing.effectivePrice,
    basePrice: flight.pricing.baseFare,
    appliedOffer: flight.pricing.appliedOffer,

    airline: flight.airline,
    airlineName,
    airlineLogo: airlineInfo?.logo,
    flightNumber: flight.flightNumber,
    origin,
    destination,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    durationMinutes: durationMinutes ?? 0,
    stops: flight.stops ?? 0,
    stopCities: [],
    bookingToken: flight.bookingToken ?? null,
    searchId: flight.searchId ?? null,
    gateId: flight.gateId ?? null,

    baggage: {
      cabin: { included: true, weight: 7 },
      checked: { included: true, weight: 15 },
    },
    refundable: false,
    cabinClass: "economy",

    fetchedAt: new Date().toISOString(),
    searchHash: `${origin}-${destination}-${date}`,
  };
}

export async function fetchFlights(
  origin: string,
  destination: string,
  date: string,
  userCardsOrOptions?: string[] | FetchFlightsOptions,
): Promise<FlightResult[]> {
  const options = normalizeFetchOptions(userCardsOrOptions);

  try {
    const enriched = await searchFlightsAction(origin, destination, date, options.userCards, {
      pax: options.passengers ?? 1,
      cabin: options.cabin ?? "economy",
      fresh: options.fresh,
      throwOnError: true,
    });

    return enriched.map((flight) => mapEnrichedFlightToResult(flight, origin, destination, date));
  } catch (err) {
    console.error("Error mapping flights:", err);
    throw normalizeSearchError(err);
  }
}

export type { EnrichedFlight };
