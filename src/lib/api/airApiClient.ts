import { z } from "zod";
import {
  AirportsResponseSchema,
  AirlinesResponseSchema,
  FaresResponseSchema,
  CalendarResponseSchema,
  CouponsResponseSchema,
  LiveResponseSchema,
  RoutesResponseSchema,
  HealthResponseSchema,
  type AirportsResponse,
  type AirlinesResponse,
  type FaresResponse,
  type CalendarResponse,
  type CouponsResponse,
  type LiveResponse,
  type RoutesResponse,
  type HealthResponse,
  type SearchAirportsParams,
  type SearchFaresParams,
  type CalendarParams,
  type CouponsParams,
} from "./airApiTypes";
import { cacheGet, cacheSet, cacheKey, CACHE_TTL } from "./airApiCache";

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 250;

export class AirApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly bodySnippet?: string,
  ) {
    super(message);
    this.name = "AirApiError";
  }
}

export class AirApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AirApiConfigError";
  }
}

function requireEnv(): { base: string; clientId: string; apiKey: string } {
  const base = process.env.AIRAPI_URL;
  const clientId = process.env.AIRAPI_CLIENT_ID;
  const apiKey = process.env.AIRAPI_KEY;
  if (!base || !clientId || !apiKey) {
    throw new AirApiConfigError(
      "AirAPI environment variables missing: AIRAPI_URL, AIRAPI_CLIENT_ID, AIRAPI_KEY",
    );
  }
  return { base: base.replace(/\/+$/, ""), clientId, apiKey };
}

function buildQuery(params: Record<string, unknown>): string {
  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    entries.push([k, String(v)]);
  }
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

async function requestRaw<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const { base, clientId, apiKey } = requireEnv();
  const url = `${base}${path}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        headers: {
          "X-Client-Id": clientId,
          "X-Api-Key": apiKey,
          Accept: "application/json",
          "User-Agent": "AirBook/1.0",
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });

      if (res.status >= 500 || res.status === 429) {
        lastErr = new AirApiError(res.status, `AirAPI transient ${res.status} on ${path}`);
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      if (!res.ok) {
        const snippet = await safeText(res);
        throw new AirApiError(res.status, `AirAPI ${res.status} on ${path}`, snippet);
      }

      const json = await res.json();
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new AirApiError(200, `AirAPI schema mismatch on ${path}: ${parsed.error.message}`);
      }
      return parsed.data;
    } catch (err) {
      if (err instanceof AirApiError && err.status < 500 && err.status !== 429) throw err;
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new AirApiError(0, `AirAPI request to ${path} failed after ${MAX_RETRIES} attempts`);
}

async function safeText(res: Response): Promise<string | undefined> {
  try {
    const t = await res.text();
    return t.length > 500 ? t.slice(0, 500) + "…" : t;
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function cachedRequest<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSec);
  return fresh;
}

export async function searchAirports(p: SearchAirportsParams): Promise<AirportsResponse> {
  const q = p.q.trim();
  if (q.length < 1) return { airports: [] };
  const key = cacheKey(["airports", q.toLowerCase(), p.limit ?? 10]);
  return cachedRequest(key, CACHE_TTL.airports, () =>
    requestRaw(`/v1/airports${buildQuery({ q, limit: p.limit ?? 10 })}`, AirportsResponseSchema),
  );
}

export async function listAirlines(iata?: string): Promise<AirlinesResponse> {
  const key = cacheKey(["airlines", iata ?? "*"]);
  return cachedRequest(key, CACHE_TTL.airlines, () =>
    requestRaw(`/v1/airlines${buildQuery({ iata })}`, AirlinesResponseSchema),
  );
}

export async function searchFares(p: SearchFaresParams): Promise<FaresResponse> {
  const key = cacheKey([
    "fares",
    p.from,
    p.to,
    p.date,
    p.returnDate ?? "_",
    p.pax ?? 1,
    p.cabin ?? "economy",
  ]);
  const fetcher = () =>
    requestRaw(
      `/v1/fares${buildQuery({
        from: p.from,
        to: p.to,
        date: p.date,
        ret: p.returnDate,
        pax: p.pax ?? 1,
        cabin: p.cabin ?? "economy",
        fresh: p.fresh ? 1 : undefined,
      })}`,
      FaresResponseSchema,
    );
  if (p.fresh) return fetcher();
  return cachedRequest(key, CACHE_TTL.fares, fetcher);
}

export async function faresCalendar(p: CalendarParams): Promise<CalendarResponse> {
  const key = cacheKey(["calendar", p.from, p.to, p.month]);
  return cachedRequest(key, CACHE_TTL.calendar, () =>
    requestRaw(
      `/v1/fares/calendar${buildQuery({ from: p.from, to: p.to, month: p.month })}`,
      CalendarResponseSchema,
    ),
  );
}

export async function listCoupons(p: CouponsParams = {}): Promise<CouponsResponse> {
  const key = cacheKey([
    "coupons",
    p.airline ?? "_",
    p.route ?? "_",
    p.bank ?? "_",
    p.minSpend ?? 0,
    p.userSegment ?? "ALL",
  ]);
  return cachedRequest(key, CACHE_TTL.coupons, () =>
    requestRaw(
      `/v1/coupons${buildQuery({
        airline: p.airline,
        route: p.route,
        bank: p.bank,
        min_spend: p.minSpend,
        user_segment: p.userSegment,
      })}`,
      CouponsResponseSchema,
    ),
  );
}

export async function liveFlights(icao24?: string): Promise<LiveResponse> {
  const key = cacheKey(["live", icao24 ?? "all"]);
  return cachedRequest(key, CACHE_TTL.live, () =>
    requestRaw(`/v1/live${buildQuery({ icao24 })}`, LiveResponseSchema),
  );
}

export async function listRoutes(from?: string, to?: string): Promise<RoutesResponse> {
  const key = cacheKey(["routes", from ?? "_", to ?? "_"]);
  return cachedRequest(key, CACHE_TTL.routes, () =>
    requestRaw(`/v1/routes${buildQuery({ from, to })}`, RoutesResponseSchema),
  );
}

export async function sourcesHealth(): Promise<HealthResponse> {
  return cachedRequest(cacheKey(["health"]), CACHE_TTL.health, () =>
    requestRaw(`/v1/health`, HealthResponseSchema),
  );
}

export const airApi = {
  searchAirports,
  listAirlines,
  searchFares,
  faresCalendar,
  listCoupons,
  liveFlights,
  listRoutes,
  sourcesHealth,
};
