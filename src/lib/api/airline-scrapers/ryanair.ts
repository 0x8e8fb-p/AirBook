// ─── Ryanair Direct Scraper ────────────────────────────────────────
// Ryanair publishes a genuinely public JSON endpoint at
// services-api.ryanair.com/farfnd/v4/oneWayFares — no auth, no
// signing, no Cloudflare challenge. It's the reference implementation
// for this project's tier-3 architecture. India market relevance is
// near-zero (Ryanair flies intra-EU only), but the integration proves
// the pattern end-to-end and helps users searching EU connecting
// segments.
//
// Endpoint contract (verified June 2026):
//   GET /farfnd/v4/oneWayFares
//     ?departureAirportIataCode=DUB
//     &arrivalAirportIataCode=STN
//     &outboundDepartureDateFrom=2026-07-15
//     &outboundDepartureDateTo=2026-07-15
//     &currency=EUR
//
// Response: { fares: [{ outbound: { ...flight..., price: {...} } }] }
//
// Returns [] for any route Ryanair doesn't serve, or on any failure.
// ──────────────────────────────────────────────────────────────────

import { z } from "zod";
import type { CabinClass } from "@/lib/types";
import type { FlightSearchParams, RawFlightOffer } from "../flight-data-provider";
import { sharedSchemaGuard } from "../schema-guard";
import { sharedScraperCache, buildScraperCacheKey } from "../scraper-cache";
import type { AirlineScraper } from "./types";

const ENDPOINT = "https://services-api.ryanair.com/farfnd/v4/oneWayFares";
const REQUEST_TIMEOUT_MS = 7_000;
const PROVIDER_KEY = "airline_direct_ryanair";

// Subset of Ryanair's ~230-airport network — enough to short-circuit
// the obvious non-matches without hammering the API. Routes outside
// this set fall through to a fast empty return.
const RYANAIR_AIRPORTS = new Set([
  "DUB", "STN", "LTN", "MAN", "LPL", "EDI", "BHX", "BRS", "NCL", "GLA",
  "MAD", "BCN", "AGP", "ALC", "VLC", "SVQ", "PMI", "TFS", "LPA", "OPO",
  "LIS", "FAO", "BGY", "MXP", "FCO", "CIA", "PSA", "BLQ", "VCE", "NAP",
  "CTA", "PMO", "CAG", "BRI", "BDS", "TRN", "VRN", "TSF", "RYG", "OSL",
  "ARN", "CPH", "HEL", "RIX", "VNO", "TLL", "WRO", "KRK", "WAW", "GDN",
  "POZ", "KTW", "BUD", "BTS", "PRG", "VIE", "SXF", "HHN", "FMM", "NRN",
  "CGN", "BRE", "CRL", "EIN", "RTM", "MRS", "BVA", "TLS", "NTE", "BOD",
  "LIL", "BIQ", "ATH", "SKG", "RHO", "CHQ", "HER", "KGS", "ZTH", "CFU",
  "MJV", "REU", "GRO", "AGA", "RBA", "FEZ", "TIA", "SOF", "OTP", "TFN",
]);

const FareSchema = z.object({
  outbound: z.object({
    departureAirport: z.object({ iataCode: z.string() }),
    arrivalAirport: z.object({ iataCode: z.string() }),
    departureDate: z.string(),
    arrivalDate: z.string(),
    flightNumber: z.string().optional(),
    flightKey: z.string().optional(),
    price: z.object({
      value: z.number(),
      currencyCode: z.string(),
    }),
  }),
});

const ResponseSchema = z.object({
  fares: z.array(FareSchema).default([]),
});

function durationMinutes(departureIso: string, arrivalIso: string): number {
  const dep = Date.parse(departureIso);
  const arr = Date.parse(arrivalIso);
  if (Number.isNaN(dep) || Number.isNaN(arr) || arr <= dep) return 0;
  return Math.round((arr - dep) / 60_000);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "TheWingsScan/1.0 (+https://thewingsscan.com)",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

class RyanairScraper implements AirlineScraper {
  readonly carrier = "FR";
  readonly name = "Ryanair";

  isEnabled(): boolean {
    if (process.env.AIRLINE_SCRAPERS_ENABLED !== "true") return false;
    const list = (process.env.AIRLINE_SCRAPERS_LIST ?? "").split(",").map((s) => s.trim().toUpperCase());
    return list.length === 0 || list.includes(this.carrier);
  }

  servesRoute(origin: string, destination: string): boolean {
    return RYANAIR_AIRPORTS.has(origin.toUpperCase()) && RYANAIR_AIRPORTS.has(destination.toUpperCase());
  }

  async search(params: FlightSearchParams): Promise<RawFlightOffer[]> {
    const origin = params.origin.toUpperCase();
    const destination = params.destination.toUpperCase();

    if (!this.servesRoute(origin, destination)) {
      return [];
    }

    const cacheKey = buildScraperCacheKey({
      provider: PROVIDER_KEY,
      origin,
      destination,
      date: params.date,
      passengers: params.passengers,
      cabin: params.cabin,
    });
    const cached = sharedScraperCache.get(cacheKey) as RawFlightOffer[] | null;
    if (cached) return cached;

    const url = new URL(ENDPOINT);
    url.searchParams.set("departureAirportIataCode", origin);
    url.searchParams.set("arrivalAirportIataCode", destination);
    url.searchParams.set("outboundDepartureDateFrom", params.date);
    url.searchParams.set("outboundDepartureDateTo", params.date);
    url.searchParams.set("currency", "EUR");

    let response: Response;
    try {
      response = await fetchWithTimeout(url.toString(), REQUEST_TIMEOUT_MS);
    } catch (err) {
      sharedSchemaGuard.recordError(PROVIDER_KEY, err instanceof Error ? err.message : "fetch failed");
      return [];
    }

    if (!response.ok) {
      sharedSchemaGuard.recordError(PROVIDER_KEY, `HTTP ${response.status}`);
      return [];
    }

    let parsed: z.infer<typeof ResponseSchema>;
    try {
      const raw = (await response.json()) as unknown;
      parsed = ResponseSchema.parse(raw);
    } catch (err) {
      sharedSchemaGuard.recordError(PROVIDER_KEY, err instanceof Error ? err.message : "parse failed");
      return [];
    }

    const offers: RawFlightOffer[] = parsed.fares.map((fare, index): RawFlightOffer => {
      const o = fare.outbound;
      const flightNumber = o.flightNumber ?? `FR-${index}`;
      const id = `airline_direct_ryanair-${flightNumber}-${o.departureDate}`.replace(/\s+/g, "");
      return {
        id,
        provider: "airline_scrapers",
        source: "airline_direct_ryanair",
        airline: "FR",
        flightNumber,
        origin: o.departureAirport.iataCode,
        destination: o.arrivalAirport.iataCode,
        departureTime: o.departureDate,
        arrivalTime: o.arrivalDate,
        durationMinutes: durationMinutes(o.departureDate, o.arrivalDate),
        stops: 0,
        stopCities: [],
        price: o.price.value,
        currency: o.price.currencyCode,
        cabinClass: (params.cabin ?? "economy") as CabinClass,
        baggage: {
          cabin: { included: true },
          checked: { included: false },
        },
        refundable: false,
        bookingUrl: `https://www.ryanair.com/gb/en/trip/flights/select?adults=${params.passengers ?? 1}&children=0&infants=0&teens=0&dateOut=${params.date}&dateIn=&originIata=${origin}&destinationIata=${destination}&isReturn=false`,
        deepLink: null,
        bookingToken: null,
        searchId: null,
        gateId: null,
        availabilityState: "reference_only",
        dataFreshness: "live",
        confidence: "high",
        baggageConfirmed: true,
        refundabilityConfirmed: false,
      };
    });

    sharedSchemaGuard.recordSuccess(PROVIDER_KEY, offers.length);
    if (offers.length > 0) {
      sharedScraperCache.set(cacheKey, offers);
    }
    return offers;
  }
}

export const ryanairScraper: AirlineScraper = new RyanairScraper();
