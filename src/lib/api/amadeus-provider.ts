import type { CabinClass } from "@/lib/types";
import { amadeusApi } from "./amadeusClient";
import type { FlightProvider, FlightSearchParams, RawFlightOffer } from "./flight-data-provider";
import type { Fare } from "./travelpayoutsTypes";

function amadeusFareToOffer(fare: Fare, params: FlightSearchParams): RawFlightOffer | null {
  const departureTime = fare.departureTime || `${params.date}T00:00:00`;
  const arrivalTime = fare.arrivalTime || departureTime;
  const durationMinutes = fare.durationMinutes ?? 120;
  const airlineCode = fare.airline.toUpperCase();
  const hasBookingHandoff = Boolean(fare.searchId && fare.bookingToken);

  if (!(fare.price > 0)) return null;

  return {
    id: `amadeus-${airlineCode}-${fare.flightNumber || "NN"}-${departureTime.replace(/[^0-9]/g, "")}`,
    provider: "amadeus",
    source: "amadeus",
    airline: airlineCode,
    flightNumber: fare.flightNumber ?? "",
    origin: params.origin.toUpperCase(),
    destination: params.destination.toUpperCase(),
    departureTime,
    arrivalTime,
    durationMinutes,
    stops: fare.stops ?? 0,
    stopCities: [],
    price: fare.price,
    currency: fare.currency,
    cabinClass: (params.cabin || "economy") as CabinClass,
    baggage: {
      cabin: { included: false },
      checked: { included: false },
    },
    refundable: false,
    bookingUrl: null,
    deepLink: null,
    bookingToken: fare.bookingToken ?? null,
    searchId: fare.searchId ?? null,
    gateId: fare.gateId ?? null,
    availabilityState: hasBookingHandoff ? "bookable_live" : "reference_only",
    dataFreshness: "live",
    confidence: hasBookingHandoff ? "high" : "medium",
    baggageConfirmed: false,
    refundabilityConfirmed: false,
  };
}

class AmadeusProvider implements FlightProvider {
  readonly name = "amadeus" as const;

  isAvailable(): boolean {
    return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  }

  async search(params: FlightSearchParams): Promise<RawFlightOffer[]> {
    const { fares } = await amadeusApi.searchFares({
      from: params.origin,
      to: params.destination,
      date: params.date,
      pax: params.passengers || 1,
      cabin: params.cabin || "economy",
    });

    const offers = fares
      .map((fare) => amadeusFareToOffer(fare, params))
      .filter((offer): offer is RawFlightOffer => offer !== null);

    return offers;
  }
}

export const amadeusProvider = new AmadeusProvider();
