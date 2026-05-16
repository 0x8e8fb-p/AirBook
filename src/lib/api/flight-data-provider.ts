// ─── Flight Data Provider Orchestrator ───────────────────────────────
// Multi-provider flight search with automatic fallback chain:
//   1. Amadeus Self-Service (live API, free test env)
//   2. Travelpayouts Calendar (cached fare data)
//   3. Simulated data (realistic fallback using real route schedules)
//
// Each provider implements the FlightProvider interface.
// Results are deduplicated, enriched with wallet-aware pricing,
// and returned as a unified FlightResult list.
// ────────────────────────────────────────────────────────────────────

import type { CabinClass } from "@/lib/types";
import { amadeusProvider } from "./amadeus-provider";
import { simulatedProvider } from "./simulated-provider";
import { travelpayoutsApi, TravelpayoutsConfigError, TravelpayoutsError } from "./travelpayoutsClient";
import type { Fare } from "./travelpayoutsTypes";

export type FlightProviderName = "amadeus" | "travelpayouts" | "simulated";

export interface RawFlightOffer {
  id: string;
  source: FlightProviderName;
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
    cabin: { included: boolean; weight: number };
    checked: { included: boolean; weight: number };
  };
  refundable: boolean;
  seatsRemaining?: number;
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
}

export interface SearchResult {
  offers: RawFlightOffer[];
  provider: FlightProviderName;
  cached: boolean;
  error?: string;
}

function deduplicateOffers(offers: RawFlightOffer[]): RawFlightOffer[] {
  const seen = new Map<string, RawFlightOffer>();

  for (const offer of offers) {
    // Build a dedup key from airline + flight number + departure time bucket (hour)
    const hourBucket = offer.departureTime.slice(0, 13);
    const key = `${offer.airline}-${offer.flightNumber}-${hourBucket}`;
    const existing = seen.get(key);
    if (!existing || offer.price < existing.price) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values());
}

// ── Travelpayouts Adapter ──────────────────────────────────────────

function travelpayoutsFareToOffer(fare: Fare, params: FlightSearchParams): RawFlightOffer {
  const departureTime = fare.departureTime || `${params.date}T00:00:00`;
  const arrivalTime = fare.arrivalTime || `${params.date}T00:00:00`;
  const durationMinutes = fare.durationMinutes ?? 0;

  return {
    id: `${fare.sourceApi}-${fare.airline}-${fare.flightNumber || "NN"}-${departureTime}`,
    source: "travelpayouts" as FlightProviderName,
    airline: fare.airline,
    flightNumber: fare.flightNumber || `${fare.airline}000`,
    origin: params.origin,
    destination: params.destination,
    departureTime,
    arrivalTime,
    durationMinutes,
    stops: fare.stops ?? 0,
    stopCities: [],
    price: fare.price,
    currency: fare.currency,
    cabinClass: (params.cabin || "economy") as CabinClass,
    baggage: {
      cabin: { included: true, weight: 7 },
      checked: { included: true, weight: 15 },
    },
    refundable: false,
  };
}

// ── Main Orchestrator ──────────────────────────────────────────────

class FlightDataProviderOrchestrator {
  private providers: FlightProvider[] = [];

  constructor() {
    this.providers = [amadeusProvider, simulatedProvider];
  }

  /**
   * Search across all available providers.
   * Providers are queried in parallel; results are merged and deduplicated.
   * Travelpayouts is used as a supplementary calendar source for historical fare context.
   */
  async searchAll(params: FlightSearchParams): Promise<{
    offers: RawFlightOffer[];
    sources: FlightProviderName[];
    calendarData?: { date: string; cheapest: number | null }[];
  }> {
    const availableProviders = this.providers.filter((p) => p.isAvailable());

    // Query all available providers in parallel
    const providerResults = await Promise.allSettled(
      availableProviders.map(async (provider): Promise<SearchResult> => {
        try {
          const offers = await provider.search(params);
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

    // Collect successful results
    const allOffers: RawFlightOffer[] = [];
    const sources: FlightProviderName[] = [];

    for (const result of providerResults) {
      if (result.status === "fulfilled" && result.value.offers.length > 0) {
        allOffers.push(...result.value.offers);
        sources.push(result.value.provider);
      }
    }

    // If we got no results from any provider, try Travelpayouts calendar as last resort
    if (allOffers.length === 0) {
      try {
        const { fares } = await travelpayoutsApi.searchFares({
          from: params.origin,
          to: params.destination,
          date: params.date,
          pax: params.passengers || 1,
          cabin: params.cabin || "economy",
          fresh: true,
        });

        const tpOffers = fares.map((fare) => travelpayoutsFareToOffer(fare, params));
        allOffers.push(...tpOffers);
        sources.push("travelpayouts");
      } catch {
        // Silent fail — simulated provider should have given us data
      }
    }

    // Also fetch calendar data for nearby date hints
    let calendarData: { date: string; cheapest: number | null }[] = [];
    try {
      const month = params.date.slice(0, 7);
      const { days } = await travelpayoutsApi.faresCalendar({
        from: params.origin,
        to: params.destination,
        month,
      });
      calendarData = days.map((d) => ({
        date: d.date,
        cheapest: d.cheapest,
      }));
    } catch {
      // Calendar data is optional
    }

    const deduplicated = deduplicateOffers(allOffers);

    // Sort by price ascending
    deduplicated.sort((a, b) => a.price - b.price);

    return {
      offers: deduplicated,
      sources,
      calendarData: calendarData.length > 0 ? calendarData : undefined,
    };
  }

  /**
   * Check if any live provider is available.
   */
  hasLiveProvider(): boolean {
    return this.providers.some((p) => p.name !== "simulated" && p.isAvailable());
  }

  /**
   * Get list of available provider names.
   */
  getAvailableProviders(): FlightProviderName[] {
    return this.providers.filter((p) => p.isAvailable()).map((p) => p.name);
  }
}

export const flightDataOrchestrator = new FlightDataProviderOrchestrator();