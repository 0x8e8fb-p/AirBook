import { z } from "zod";
import { FareSchema, type Fare, type SearchFaresParams } from "./travelpayoutsTypes";

const AMADEUS_BASE_URL = process.env.AMADEUS_API_BASE || "https://test.api.amadeus.com";
const DEFAULT_CURRENCY = "INR";

export class AmadeusError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: string,
  ) {
    super(message);
    this.name = "AmadeusError";
  }
}

export class AmadeusConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmadeusConfigError";
  }
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AmadeusConfigError("Amadeus credentials missing: set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET");
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AmadeusError(response.status, "Failed to get Amadeus access token", body);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Buffer of 60 seconds
  return cachedToken!;
}

function mapAmadeusOfferToFare(offer: any, params: SearchFaresParams): Fare | null {
  try {
    const firstItinerary = offer.itineraries[0];
    const lastItinerary = offer.itineraries[offer.itineraries.length - 1];
    const firstSegment = firstItinerary.segments[0];
    const lastSegment = firstItinerary.segments[firstItinerary.segments.length - 1];

    const airline = firstSegment.carrierCode;
    const departureTime = firstSegment.departure.at;
    const arrivalTime = lastSegment.arrival.at;

    // Calculate total duration in minutes
    const durationMatch = firstItinerary.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const hours = parseInt(durationMatch?.[1] || "0", 10);
    const minutes = parseInt(durationMatch?.[2] || "0", 10);
    const durationMinutes = hours * 60 + minutes;

    const fare: Fare = {
      from: params.from.toUpperCase(),
      to: params.to.toUpperCase(),
      airline,
      flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
      price: parseFloat(offer.price.grandTotal),
      currency: (offer.price.currency as "INR") || DEFAULT_CURRENCY,
      departureDate: params.date,
      returnDate: params.returnDate || null,
      departureTime,
      arrivalTime,
      durationMinutes,
      stops: firstItinerary.segments.length - 1,
      sourceApi: "amadeus",
      recordedAt: new Date().toISOString(),
      bookingToken: offer.id, // Using offer ID as a temporary token
      searchId: null,
      gateId: null,
    };

    const parsed = FareSchema.safeParse(fare);
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error("Error mapping Amadeus offer:", err);
    return null;
  }
}

export const amadeusApi = {
  async searchFares(params: SearchFaresParams): Promise<{ fares: Fare[] }> {
    try {
      const token = await getAccessToken();
      const queryParams = new URLSearchParams({
        originLocationCode: params.from,
        destinationLocationCode: params.to,
        departureDate: params.date,
        adults: (params.pax || 1).toString(),
        travelClass: params.cabin === "business" ? "BUSINESS" : params.cabin === "first" ? "FIRST" : params.cabin === "premium_economy" ? "PREMIUM_ECONOMY" : "ECONOMY",
        currencyCode: DEFAULT_CURRENCY,
        max: "50",
      });

      if (params.returnDate) {
        queryParams.append("returnDate", params.returnDate);
      }

      const response = await fetch(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new AmadeusError(response.status, "Amadeus flight search failed", body);
      }

      const data = await response.json();
      const fares = (data.data || [])
        .map((offer: any) => mapAmadeusOfferToFare(offer, params))
        .filter((f: Fare | null): f is Fare => f !== null);

      return { fares };
    } catch (err) {
      if (err instanceof AmadeusConfigError || err instanceof AmadeusError) {
        throw err;
      }
      throw new AmadeusError(0, "Unknown Amadeus error", String(err));
    }
  },
};
