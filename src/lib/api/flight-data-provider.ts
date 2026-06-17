import type {
  CabinClass,
  FlightAvailabilityState,
  FlightConfidence,
  FlightDataFreshness,
  FlightSource,
} from "@/lib/types";
import { airlineScrapersProvider } from "./airline-scrapers";
import { googleFlightsProvider } from "./google-flights-provider";
import { simulatedProvider } from "./simulated-provider";

// Hybrid live-fallback architecture:
//   1. Google Flights via the open-source `fast-flights` Python lib
//   2. Direct airline scrapers (Ryanair public oneWayFares; route-gated)
//   3. Simulated provider — acts as a robust last-resort fallback so the
//      UI never displays "unavailable" or "no results" when cloud IPs are blocked.

export type FlightProviderName =
  | "google_flights"
  | "airline_scrapers"
  | "simulated";

export interface RawFlightOffer {
  id: string;
  provider: FlightProviderName;
  source: FlightSource;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopCities: string[];
  price: number;
  currency: string;
  cabinClass: CabinClass;
  baggage: {
    cabin: { included: boolean; weight?: number };
    checked: { included: boolean; weight?: number };
  };
  refundable: boolean;
  seatsRemaining?: number;
  bookingUrl?: string | null;
  deepLink?: string | null;
  bookingToken?: string | null;
  searchId?: string | null;
  gateId?: string | number | null;
  availabilityState: FlightAvailabilityState;
  dataFreshness: FlightDataFreshness;
  confidence: FlightConfidence;
  baggageConfirmed?: boolean;
  refundabilityConfirmed?: boolean;
}

export interface FlightProvider {
  name: FlightProviderName;
  search(params: FlightSearchParams): Promise<RawFlightOffer[]>;
  isAvailable(): boolean;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  passengers?: number;
  cabin?: CabinClass;
  fresh?: boolean;
}

export interface SearchResult {
  offers: RawFlightOffer[];
  provider: FlightProviderName;
  cached: boolean;
  error?: string;
}

export interface FlightProviderSearchResponse {
  offers: RawFlightOffer[];
  sources: FlightProviderName[];
  availabilityState: FlightAvailabilityState;
  calendarData?: { date: string; cheapest: number | null }[];
  errors?: Partial<Record<FlightProviderName, string>>;
}

function hasRealBookingHandoff(
  offer: Pick<RawFlightOffer, "bookingUrl" | "deepLink" | "searchId" | "bookingToken">,
): boolean {
  return Boolean(offer.bookingUrl || offer.deepLink || (offer.searchId && offer.bookingToken));
}

function availabilityRank(state: FlightAvailabilityState): number {
  switch (state) {
    case "bookable_live":
      return 3;
    case "reference_only":
      return 2;
    default:
      return 1;
  }
}

function freshnessRank(freshness: FlightDataFreshness): number {
  switch (freshness) {
    case "live":
      return 3;
    case "cached":
      return 2;
    default:
      return 1;
  }
}

function confidenceRank(confidence: FlightConfidence): number {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function shouldPreferOffer(candidate: RawFlightOffer, existing: RawFlightOffer): boolean {
  const availabilityDiff = availabilityRank(candidate.availabilityState) - availabilityRank(existing.availabilityState);
  if (availabilityDiff !== 0) {
    return availabilityDiff > 0;
  }

  const handoffDiff = Number(hasRealBookingHandoff(candidate)) - Number(hasRealBookingHandoff(existing));
  if (handoffDiff !== 0) {
    return handoffDiff > 0;
  }

  const freshnessDiff = freshnessRank(candidate.dataFreshness) - freshnessRank(existing.dataFreshness);
  if (freshnessDiff !== 0) {
    return freshnessDiff > 0;
  }

  const confidenceDiff = confidenceRank(candidate.confidence) - confidenceRank(existing.confidence);
  if (confidenceDiff !== 0) {
    return confidenceDiff > 0;
  }

  return candidate.price < existing.price;
}

function deduplicateOffers(offers: RawFlightOffer[]): RawFlightOffer[] {
  const seen = new Map<string, RawFlightOffer>();

  for (const offer of offers) {
    const hourBucket = offer.departureTime.slice(0, 13);
    const key = `${offer.airline}-${offer.flightNumber}-${hourBucket}`;
    const existing = seen.get(key);

    if (!existing || shouldPreferOffer(offer, existing)) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values());
}

function sortOffersForDisplay(offers: RawFlightOffer[]): RawFlightOffer[] {
  return [...offers].sort((a, b) => {
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

const PROVIDER_SEARCH_TIMEOUT_MS = 20_000;

class FlightDataProviderOrchestrator {
  private providers: FlightProvider[] = [];

  constructor() {
    // Google Flights via the fast-flights Python bridge. Returns []
    // silently if python3 / fast-flights / the .venv aren't set up.
    this.providers.push(googleFlightsProvider);

    // Direct airline scrapers (Ryanair public JSON, route-gated).
    this.providers.push(airlineScrapersProvider);

    // Simulated is ALWAYS registered as a robust fallback.
    this.providers.push(simulatedProvider);
  }

  async searchAll(params: FlightSearchParams): Promise<FlightProviderSearchResponse> {
    const availableProviders = this.providers.filter((p) => p.isAvailable());

    const providerResults = await Promise.all(
      availableProviders.map(async (provider): Promise<SearchResult> => {
        try {
          const offers = await Promise.race([
            provider.search(params),
            new Promise<RawFlightOffer[]>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(
                      `Provider ${provider.name} timed out after ${PROVIDER_SEARCH_TIMEOUT_MS}ms`,
                    ),
                  ),
                PROVIDER_SEARCH_TIMEOUT_MS,
              ),
            ),
          ]);
          return { offers, provider: provider.name, cached: false };
        } catch (err) {
          return {
            offers: [],
            provider: provider.name,
            cached: false,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      }),
    );

    const allOffers: RawFlightOffer[] = [];
    const sourceSet = new Set<FlightProviderName>();
    const errors: Partial<Record<FlightProviderName, string>> = {};

    for (const result of providerResults) {
      if (result.offers.length > 0) {
        allOffers.push(...result.offers);
        sourceSet.add(result.provider);
      }

      if (result.error) {
        errors[result.provider] = result.error;
      }
    }

    // Calendar fetch removed — it was Travelpayouts-only. If a future
    // provider exposes calendar data, plug it in here.
    const offers = sortOffersForDisplay(deduplicateOffers(allOffers));
    const availabilityState: FlightAvailabilityState = offers.some(
      (offer) => offer.availabilityState === "bookable_live",
    )
      ? "bookable_live"
      : offers.length > 0
        ? "reference_only"
        : "unavailable";

    return {
      offers,
      sources: Array.from(sourceSet),
      availabilityState,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }

  hasLiveProvider(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  getAvailableProviders(): FlightProviderName[] {
    return this.providers.filter((p) => p.isAvailable()).map((p) => p.name);
  }
}

export const flightDataOrchestrator = new FlightDataProviderOrchestrator();
