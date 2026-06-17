// ─── Direct Airline Scraper Registry ───────────────────────────────
// Aggregates per-carrier scrapers behind a single FlightProvider so
// the orchestrator stays uniform. Each scraper is responsible for:
//   - its own env-gated isEnabled()
//   - its own servesRoute() short-circuit
//   - its own caching and schema-guard reporting
//
// To add a new carrier: implement AirlineScraper in a sibling file,
// register it in REGISTERED_SCRAPERS below.
// ──────────────────────────────────────────────────────────────────

import type { FlightProvider, FlightSearchParams, RawFlightOffer } from "../flight-data-provider";
import { ryanairScraper } from "./ryanair";
import type { AirlineScraper } from "./types";

const REGISTERED_SCRAPERS: AirlineScraper[] = [ryanairScraper];

class AirlineScrapersProvider implements FlightProvider {
  readonly name = "airline_scrapers" as const;

  isAvailable(): boolean {
    return REGISTERED_SCRAPERS.some((s) => s.isEnabled());
  }

  async search(params: FlightSearchParams): Promise<RawFlightOffer[]> {
    const enabled = REGISTERED_SCRAPERS.filter(
      (s) => s.isEnabled() && s.servesRoute(params.origin, params.destination),
    );
    if (enabled.length === 0) return [];

    const results = await Promise.all(
      enabled.map(async (scraper) => {
        try {
          return await scraper.search(params);
        } catch {
          // Each scraper already records its own errors via schema-guard
          // and returns []; a thrown error here means an unexpected bug
          // we don't want to surface to the orchestrator.
          return [];
        }
      }),
    );

    return results.flat();
  }
}

export const airlineScrapersProvider = new AirlineScrapersProvider();
