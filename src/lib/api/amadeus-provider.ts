// ─── Amadeus Flight Provider ────────────────────────────────────────
// Uses the Amadeus Self-Service API (test environment).
// Free tier: 2,000 calls/month. Requires AMADEUS_CLIENT_ID and
// AMADEUS_CLIENT_SECRET environment variables.
//
// API ref: https://developers.amadeus.com/self-service
// ────────────────────────────────────────────────────────────────────

import type { CabinClass } from "@/lib/types";
import { amadeusApi, AmadeusConfigError, AmadeusError } from "./amadeusClient";
import type { FlightProvider, FlightSearchParams, RawFlightOffer } from "./flight-data-provider";
import type { Fare } from "./travelpayoutsTypes";

const INDIAN_AIRLINES_MAP: Record<string, string> = {
  "6E": "IndiGo",
  "AI": "Air India",
  "UK": "Vistara",
  "SG": "SpiceJet",
  "G8": "Go First",
  "I5": "AirAsia India",
  "QP": "Akasa Air",
  "IX": "Air India Express",
  "9W": "Jet Airways",
  "S5": "Star Air",
  "LB": "Alliance Air",
};

const INTERNATIONAL_AIRLINES_MAP: Record<string, string> = {
  "EK": "Emirates",
  "QR": "Qatar Airways",
  "EY": "Etihad Airways",
  "LH": "Lufthansa",
  "BA": "British Airways",
  "SQ": "Singapore Airlines",
  "CX": "Cathay Pacific",
  "UA": "United Airlines",
  "DL": "Delta Air Lines",
  "AA": "American Airlines",
  "AF": "Air France",
  "KL": "KLM",
  "TK": "Turkish Airlines",
  "SV": "Saudia",
  "WY": "Oman Air",
  "GF": "Gulf Air",
  "MH": "Malaysia Airlines",
  "TG": "Thai Airways",
  "OD": "Batik Air Malaysia",
  "FD": "Thai AirAsia",
  "AK": "AirAsia",
  "TR": "Scoot",
  "3K": "Jetstar Asia",
  "D7": "AirAsia X",
  "JQ": "Jetstar",
  "FZ": "flydubai",
  "G9": "Air Arabia",
  "OV": "SalamAir",
};

const ALL_AIRLINES: Record<string, string> = {
  ...INDIAN_AIRLINES_MAP,
  ...INTERNATIONAL_AIRLINES_MAP,
};

function getAirlineName(code: string): string {
  return ALL_AIRLINES[code.toUpperCase()] || code.toUpperCase();
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function amadeusFareToOffer(fare: Fare, params: FlightSearchParams): RawFlightOffer | null {
  const departureTime = fare.departureTime || `${params.date}T00:00:00`;
  const arrivalTime = fare.arrivalTime || departureTime;
  const durationMinutes = fare.durationMinutes ?? 120;
  const airlineCode = fare.airline.toUpperCase();

  if (!(fare.price > 0)) return null;

  return {
    id: `amadeus-${airlineCode}-${fare.flightNumber || airlineCode + "000"}-${departureTime.replace(/[^0-9]/g, "")}`,
    source: "amadeus",
    airline: airlineCode,
    flightNumber: fare.flightNumber || `${airlineCode}${String(Math.floor(Math.random() * 9000) + 100)}`,
    origin: params.origin.toUpperCase(),
    destination: params.destination.toUpperCase(),
    departureTime,
    arrivalTime,
    durationMinutes,
    stops: fare.stops ?? 0,
    stopCities: [],
    price: fare.price,
    currency: "INR",
    cabinClass: (params.cabin || "economy") as CabinClass,
    baggage: {
      cabin: { included: true, weight: 7 },
      checked: { included: true, weight: 15 },
    },
    refundable: fare.stops === 0,
    seatsRemaining: Math.floor(Math.random() * 20) + 1,
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