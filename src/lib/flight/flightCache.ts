import { EnrichedFlight } from '@/app/actions/flightActions';

interface CacheEntry {
  flights: EnrichedFlight[];
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class FlightCache {
  private cache: Map<string, CacheEntry> = new Map();

  get(key: string): EnrichedFlight[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.flights;
  }

  set(key: string, flights: EnrichedFlight[]): void {
    this.cache.set(key, {
      flights,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const flightCache = new FlightCache();
