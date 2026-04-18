import {
  searchFlightsAction,
  type EnrichedFlight,
} from "@/app/actions/flightActions";
import type { FlightResult, FlightSegment, FlightSource } from "@/lib/types";
import { AIRLINES } from "@/lib/constants";

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
  ];
  return (known as string[]).includes(raw ?? "") ? (raw as FlightSource) : "master_api";
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
  userCards?: string[],
): Promise<FlightResult[]> {
  try {
    const enriched = await searchFlightsAction(origin, destination, date, userCards);
    return enriched.map((flight) => mapEnrichedFlightToResult(flight, origin, destination, date));
  } catch (err) {
    console.error("Error mapping flights:", err);
    return [];
  }
}

export type { EnrichedFlight };
