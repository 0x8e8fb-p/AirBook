import type {
  CabinClass,
  FlightAvailabilityState,
  FlightConfidence,
  FlightDataFreshness,
  FlightSource,
} from "@/lib/types";
import { airlineScrapersProvider } from "./airline-scrapers";
import { amadeusProvider } from "./amadeus-provider";
import { simulatedProvider } from "./simulated-provider";
import { travelpayoutsApi } from "./travelpayoutsClient";
import type { Fare } from "./travelpayoutsTypes";

const ENABLE_SIMULATED_PROVIDER =
  process.env.NODE_ENV !== "production" &&
  process.env.AIRBOOK_ENABLE_SIMULATED_FLIGHTS === "true";

export type FlightProviderName =
  | "amadeus"
  | "travelpayouts"
  | "simulated"
  | "airline_scrapers";

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

function travelpayoutsFareToOffer(fare: Fare, params: FlightSearchParams): RawFlightOffer {
  const departureTime = fare.departureTime || `${params.date}T00:00:00`;
  const arrivalTime = fare.arrivalTime || departureTime;
  const durationMinutes = fare.durationMinutes ?? 0;
  const source: FlightSource =
    fare.sourceApi === "travelpayouts_realtime" ? "travelpayouts_realtime" : "travelpayouts_calendar";
  const hasBookingHandoff = Boolean(fare.searchId && fare.bookingToken);
  const isRealtime = source === "travelpayouts_realtime";

  return {
    id: `${fare.sourceApi}-${fare.airline}-${fare.flightNumber || "NN"}-${departureTime}`,
    provider: "travelpayouts",
    source,
    airline: fare.airline,
    flightNumber: fare.flightNumber ?? "",
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
      cabin: { included: false },
      checked: { included: false },
    },
    refundable: false,
    bookingUrl: null,
    deepLink: null,
    bookingToken: fare.bookingToken ?? null,
    searchId: fare.searchId ?? null,
    gateId: fare.gateId ?? null,
    availabilityState: isRealtime && hasBookingHandoff ? "bookable_live" : "reference_only",
    dataFreshness: isRealtime ? "live" : "cached",
    confidence: isRealtime ? (hasBookingHandoff ? "high" : "medium") : "low",
    baggageConfirmed: false,
    refundabilityConfirmed: false,
  };
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

// Wraps the long-standing travelpayoutsApi.searchFares call as a
// FlightProvider so the orchestrator can treat every source the same
// way. travelpayoutsApi itself is unchanged — all 929 lines of
// existing client logic, retries, caching, and tests still apply.
class TravelpayoutsProvider implements FlightProvider {
  readonly name = "travelpayouts" as const;

  isAvailable(): boolean {
    return Boolean(process.env.TRAVELPAYOUTS_TOKEN);
  }

  async search(params: FlightSearchParams): Promise<RawFlightOffer[]> {
    const { fares } = await travelpayoutsApi.searchFares({
      from: params.origin,
      to: params.destination,
      date: params.date,
      pax: params.passengers || 1,
      cabin: params.cabin || "economy",
      fresh: params.fresh,
    });
    return fares.map((fare) => travelpayoutsFareToOffer(fare, params));
  }
}

export const travelpayoutsProvider = new TravelpayoutsProvider();

class FlightDataProviderOrchestrator {
  private providers: FlightProvider[] = [];

  constructor() {
    // Tier 3: direct airline scrapers (Ryanair only today — IndiGo /
    // SpiceJet / Air India are deliberately not registered until a
    // ToS-compliant data source for those carriers is identified).
    this.providers.push(airlineScrapersProvider);

    // Existing live API providers retained as primaries until the
    // Google Flights RPC port lands. travelpayoutsProvider wraps the
    // unchanged travelpayoutsApi client.
    this.providers.push(amadeusProvider);
    this.providers.push(travelpayoutsProvider);

    if (ENABLE_SIMULATED_PROVIDER) {
      this.providers.push(simulatedProvider);
    }
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

    // Calendar context — Travelpayouts is the only source that
    // exposes a fare calendar. Skip the call when the token isn't set
    // so we don't generate spurious errors.
    let calendarData: { date: string; cheapest: number | null }[] = [];
    if (travelpayoutsProvider.isAvailable()) {
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
        // Nearby-date context is optional.
      }
    }

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
      calendarData: calendarData.length > 0 ? calendarData : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }

  hasLiveProvider(): boolean {
    return this.providers.some((p) => p.name !== "simulated" && p.isAvailable());
  }

  getAvailableProviders(): FlightProviderName[] {
    return this.providers.filter((p) => p.isAvailable()).map((p) => p.name);
  }
}

export const flightDataOrchestrator = new FlightDataProviderOrchestrator();
