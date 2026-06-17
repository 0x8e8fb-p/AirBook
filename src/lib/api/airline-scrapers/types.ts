// ─── Airline Scraper Shared Types ──────────────────────────────────
// Common contract every direct-airline scraper implements. The
// registry (./index.ts) wraps these as a single FlightProvider so the
// orchestrator stays uniform.
// ──────────────────────────────────────────────────────────────────

import type { FlightSearchParams, RawFlightOffer } from "../flight-data-provider";

export interface AirlineScraper {
  /** IATA carrier code, e.g. "FR" for Ryanair, "6E" for IndiGo. */
  readonly carrier: string;
  /** Human-readable name for logs and status. */
  readonly name: string;
  /** Read env to decide whether this carrier is enabled. */
  isEnabled(): boolean;
  /** Cheap check to skip carriers that don't serve the route. */
  servesRoute(origin: string, destination: string): boolean;
  /** Returns offers for this carrier only. Empty array on no match. */
  search(params: FlightSearchParams): Promise<RawFlightOffer[]>;
}
