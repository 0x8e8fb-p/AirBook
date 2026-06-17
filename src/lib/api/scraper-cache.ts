// ─── Scraper Hot Cache ─────────────────────────────────────────────
// In-process LRU+TTL cache for scraper responses. Keeps fresh fare
// data accessible across rapid repeat searches without burning a
// network call. Intentionally process-local — for a multi-region
// cache, layer Redis on top via the same get/set surface.
//
// Used by tier-1 / tier-3 scrapers (Google Flights RPC, direct
// airline scrapers). Travelpayouts has its own cache in
// travelpayoutsCache.ts and is unaffected.
// ──────────────────────────────────────────────────────────────────

export const SCRAPER_CACHE_DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 min
export const SCRAPER_CACHE_DEFAULT_MAX_ENTRIES = 500;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class ScraperCache<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxEntries: number = SCRAPER_CACHE_DEFAULT_MAX_ENTRIES,
    private readonly defaultTtlMs: number = SCRAPER_CACHE_DEFAULT_TTL_MS,
  ) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    // Refresh LRU position by re-inserting.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/**
 * Stable cache key for a flight search. Lowercases IATA codes and
 * normalizes optional fields so equivalent searches collide.
 */
export function buildScraperCacheKey(parts: {
  provider: string;
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  passengers?: number;
  cabin?: string;
}): string {
  const segments = [
    parts.provider,
    parts.origin.toUpperCase(),
    parts.destination.toUpperCase(),
    parts.date,
    parts.returnDate ?? "oneway",
    String(parts.passengers ?? 1),
    parts.cabin ?? "economy",
  ];
  return segments.join("|");
}

// Shared singleton — providers can also instantiate their own if
// they need different TTLs or eviction semantics.
export const sharedScraperCache = new ScraperCache();
