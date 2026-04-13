// ============================================
// AirBook — Search Orchestrator
// ============================================
// Fires parallel searches across all APIs, normalizes results,
// deduplicates, ranks, and caches.

import type { FlightResult, FlightSource, SearchParams, SearchResults, SortOption } from '../types';
import { generateSearchHash } from '../utils';
import { API_CONFIG } from '../constants';
import { searchDuffel } from './duffel';
import { searchKiwi } from './kiwi';
import { searchSerpApi } from './serpapi';
import { generateMockResults } from './mock-data';

interface SourceResult {
  source: FlightSource;
  status: 'success' | 'error' | 'timeout';
  results: FlightResult[];
  responseTimeMs: number;
  error?: string;
}

/**
 * Execute a single source search with timeout and error handling
 */
async function searchWithTimeout(
  source: FlightSource,
  searchFn: () => Promise<FlightResult[]>,
  timeoutMs: number = API_CONFIG.SEARCH_TIMEOUT_MS
): Promise<SourceResult> {
  const startTime = Date.now();

  try {
    const results = await Promise.race([
      searchFn(),
      new Promise<FlightResult[]>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      ),
    ]);

    return {
      source,
      status: 'success',
      results,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === 'timeout';
    return {
      source,
      status: isTimeout ? 'timeout' : 'error',
      results: [],
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deduplicate flights by matching flight number + departure time.
 * When duplicates are found, keep the one with the lowest price.
 */
function deduplicateFlights(flights: FlightResult[]): FlightResult[] {
  const seen = new Map<string, FlightResult>();

  for (const flight of flights) {
    // Create a dedup key from flight number + departure date
    const depDate = flight.departureTime.substring(0, 10); // YYYY-MM-DD
    const key = `${flight.flightNumber}_${depDate}_${flight.origin}_${flight.destination}`;

    const existing = seen.get(key);
    if (!existing || flight.price < existing.price) {
      seen.set(key, flight);
    }
  }

  return Array.from(seen.values());
}

/**
 * Sort flights based on selected option
 */
export function sortFlights(flights: FlightResult[], sortBy: SortOption): FlightResult[] {
  const sorted = [...flights];

  switch (sortBy) {
    case 'cheapest':
      return sorted.sort((a, b) => a.price - b.price);
    case 'fastest':
      return sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case 'earliest_departure':
      return sorted.sort((a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
    case 'latest_departure':
      return sorted.sort((a, b) =>
        new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
      );
    case 'best_value':
      // Score: normalize price and duration, weight them
      return sorted.sort((a, b) => {
        const maxPrice = Math.max(...sorted.map((f) => f.price));
        const maxDur = Math.max(...sorted.map((f) => f.durationMinutes));
        const scoreA = (a.price / maxPrice) * 0.6 + (a.durationMinutes / maxDur) * 0.3 + (a.stops * 0.1);
        const scoreB = (b.price / maxPrice) * 0.6 + (b.durationMinutes / maxDur) * 0.3 + (b.stops * 0.1);
        return scoreA - scoreB;
      });
    default:
      return sorted;
  }
}

/**
 * Main search orchestrator — fires all APIs in parallel
 */
export async function orchestrateSearch(params: SearchParams): Promise<SearchResults> {
  const searchHash = generateSearchHash(params);
  const searchId = `search_${searchHash}_${Date.now()}`;

  // Check if we have any API keys configured
  const hasDuffel = !!process.env.DUFFEL_ACCESS_TOKEN;
  const hasKiwi = !!process.env.KIWI_API_KEY;
  const hasSerpApi = !!process.env.SERPAPI_API_KEY;
  const hasAnyApi = hasDuffel || hasKiwi || hasSerpApi;

  let sourceResults: SourceResult[];

  if (!hasAnyApi) {
    // No API keys — use mock data for demo
    console.log('[Orchestrator] No API keys configured, using mock data');
    const mockResults = generateMockResults(params);
    sourceResults = [{
      source: 'duffel' as FlightSource,
      status: 'success',
      results: mockResults,
      responseTimeMs: 150,
    }];
  } else {
    // Fire all configured searches in parallel
    const searches: Promise<SourceResult>[] = [];

    if (hasDuffel) {
      searches.push(searchWithTimeout('duffel', () => searchDuffel(params)));
    }
    if (hasKiwi) {
      searches.push(searchWithTimeout('kiwi', () => searchKiwi(params)));
    }
    if (hasSerpApi) {
      searches.push(searchWithTimeout('serpapi', () => searchSerpApi(params)));
    }

    sourceResults = await Promise.all(searches);
  }

  // Collect all flights from all sources
  const allFlights = sourceResults.flatMap((sr) => sr.results);

  // Deduplicate
  const uniqueFlights = deduplicateFlights(allFlights);

  // Sort by cheapest (default)
  const sortedFlights = sortFlights(uniqueFlights, 'cheapest');

  // Calculate summary stats
  const cheapest = sortedFlights.length > 0
    ? Math.min(...sortedFlights.map((f) => f.price))
    : 0;
  const fastest = sortedFlights.length > 0
    ? Math.min(...sortedFlights.map((f) => f.durationMinutes))
    : 0;

  return {
    flights: sortedFlights,
    searchParams: params,
    sources: sourceResults.map((sr) => ({
      source: sr.source,
      status: sr.status,
      resultCount: sr.results.length,
      responseTimeMs: sr.responseTimeMs,
      error: sr.error,
    })),
    totalResults: sortedFlights.length,
    cheapest,
    fastest,
    searchId,
  };
}
