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
  FlightStatusSchema,
  FlightBestDealSchema,
  CalendarRawSchema,
  ForecastSchema,
  PredictPriceSchema,
  BestTimeToBookSchema,
  TrendingRoutesSchema,
  OtaComparisonSchema,
  AirlineComparisonSchema,
  BankComboSchema,
  NearbyAirportsSchema,
  DealsTrendsSchema,
  BankOfferSchema,
  BestForRouteSchema,
  AggregatorSearchSchema,
  ProvidersSchema,
  AggregatorBestDealSchema,
  MultiCitySchema,
  DomesticAirportSchema,
  AlertSchema,
  AlertSubscribeSchema,
  RouteStatsSchema,
  AirlinePerfSchema,
  TrafficSummarySchema,
  AirportWeatherSchema,
  ApiEnvelopeSchema,
  type AirportsResponse,
  type AirlinesResponse,
  type FaresResponse,
  type CalendarResponse,
  type CouponsResponse,
  type LiveResponse,
  type RoutesResponse,
  type HealthResponse,
  type FlightStatus,
  type FlightBestDeal,
  type Forecast,
  type PredictPrice,
  type BestTimeToBook,
  type TrendingRoutes,
  type OtaComparison,
  type AirlineComparison,
  type BankCombo,
  type NearbyAirports,
  type DealsTrends,
  type BankOffer,
  type BestForRoute,
  type AggregatorSearch,
  type AggregatorFlight,
  type Providers,
  type AggregatorBestDeal,
  type MultiCity,
  type FareAlert,
  type AirportWeather,
  type SearchAirportsParams,
  type SearchFaresParams,
  type CalendarParams,
  type CouponsParams,
} from "./airApiTypes";
import { cacheGet, cacheSet, cacheKey, CACHE_TTL } from "./airApiCache";

// ── Config ───────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 250;

// ── Errors ───────────────────────────────────────────────
export class AirApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly bodySnippet?: string,
    public readonly code?: string,
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

// ── Env ──────────────────────────────────────────────────
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

// ── Query builder ────────────────────────────────────────
function buildQuery(params: Record<string, unknown>): string {
  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    entries.push([k, String(v)]);
  }
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeText(res: Response): Promise<string | undefined> {
  try {
    const t = await res.text();
    return t.length > 500 ? t.slice(0, 500) + "…" : t;
  } catch {
    return undefined;
  }
}

// ── Core request: unwrap AirAPI envelope ─────────────────

async function requestRaw<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<{ data: T; meta: Record<string, unknown>; pagination?: Record<string, unknown> }> {
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
          "User-Agent": "AirBook/2.0",
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });

      if (res.status >= 500 || res.status === 429) {
        lastErr = new AirApiError(res.status, `AirAPI transient ${res.status} on ${path}`);
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }

      // 403 when API key invalid
      if (res.status === 403) {
        throw new AirApiError(403, "AirAPI invalid credentials", undefined, "AUTH_FORBIDDEN");
      }

      if (!res.ok) {
        const snippet = await safeText(res);
        throw new AirApiError(res.status, `AirAPI ${res.status} on ${path}`, snippet);
      }

      const json = await res.json();

      // AirAPI uses a standardized envelope: { success, data, meta, error?, pagination? }
      if (json && typeof json === "object" && "success" in json && "data" in json) {
        if (!json.success) {
          const code = json.error?.code ?? "API_ERROR";
          const msg = json.error?.message ?? "AirAPI returned error";
          throw new AirApiError(200, msg, undefined, code);
        }
        // Validate the data payload
        const payload = json.data;
        if (payload === null || payload === undefined) {
          throw new AirApiError(200, `AirAPI empty data on ${path}`);
        }
        // For some endpoints AirAPI returns a raw array — in that case wrap into expected shape
        const toValidate = parseWrappedPayload(path, payload);
        const parsed = schema.safeParse(toValidate);
        if (!parsed.success) {
          throw new AirApiError(
            200,
            `AirAPI schema mismatch on ${path}: ${parsed.error.message.slice(0, 200)}`,
          );
        }
        return {
          data: parsed.data,
          meta: json.meta ?? {},
          pagination: json.pagination,
        };
      }

      // Fallback: unparsed response (raw data, no envelope)
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new AirApiError(
          200,
          `AirAPI schema mismatch on ${path}: ${parsed.error.message.slice(0, 200)}`,
        );
      }
      return { data: parsed.data, meta: {} };
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

// Some AirAPI endpoints return the content directly under the envelope without a wrapper key
// e.g. /compare/ota returns { success, data: { route, comparison }, meta } — no problem
// But /aggregator/providers returns { success, data: [{name…}, …], meta } — schema expects { providers: [] }
function parseWrappedPayload(path: string, payload: unknown): unknown {
  // /aggregator/providers returns an array not { providers: [] }
  if (path.includes("/aggregator/providers") && Array.isArray(payload)) {
    return { providers: payload };
  }
  // /aggregator/offers/{provider} returns an array
  if (path.match(/\/aggregator\/offers\/.+/) && Array.isArray(payload)) {
    return { offers: payload };
  }
  // /aggregator/best-deal returns { route, deal, alternatives, metadata } already
  if (path.includes("/aggregator/best-deal") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /aggregator/search-flights returns { success, query, summary, cheapestOption, results }
  if (path.includes("/aggregator/search-flights") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /aggregator/multi-city returns { passengers, legs, total_combined_price, currency }
  if (path.includes("/aggregator/multi-city") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /alerts/list returns an array
  if (path.includes("/alerts/list") && Array.isArray(payload)) {
    return { alerts: payload };
  }
  // /compare/ota and /compare/airline and /compare/bank-combo are already well-shaped
  if (path.includes("/compare/") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /intelligence/*, /routes/trending, /trends/* are already well-shaped
  if (
    (path.includes("/intelligence/") || path.includes("/trends/") || path.includes("/routes/trending"))
    && typeof payload === "object" && payload !== null
  ) {
    return payload;
  }
  // /flights/status returns a single object
  if (path.includes("/flights/status") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /flights/best-deal
  if (path.includes("/flights/best-deal") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /flights/live — wrap if raw array
  if (path.includes("/flights/live") && Array.isArray(payload)) {
    return { flights: payload };
  }
  // /nearby-airports
  if (path.includes("/nearby-airports") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /deals/trends
  if (path.includes("/deals/trends") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /deals/bank-offers — wrap if raw array
  if (path.includes("/deals/bank-offers") && Array.isArray(payload)) {
    return { offers: payload };
  }
  // /search/* endpoints
  if (path.includes("/search/") && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // /analytics/* — wrap arrays
  if (path.includes("/analytics/")) {
    if (Array.isArray(payload)) return { results: payload };
    return payload;
  }
  // /traffic/*
  if (path.includes("/traffic/")) {
    if (Array.isArray(payload)) return { results: payload };
    return payload;
  }
  // /domestic/* — wrap arrays
  if (path.includes("/domestic/")) {
    if (Array.isArray(payload)) return { results: payload };
    return payload;
  }
  // /airports/{iata}/weather
  if (path.match(/\/airports\/[^/]+\/weather/) && typeof payload === "object" && payload !== null) {
    return payload;
  }
  // Default: pass through as-is
  return payload;
}

// ── Cache helper ─────────────────────────────────────────
async function cachedRequest<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<{ data: T }>,
): Promise<T> {
  const hit = await cacheGet<{ data: T }>(key);
  if (hit !== null) return hit.data;
  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSec);
  return fresh.data;
}

// ═════════════════════════════════════════════════════════
//  EXISTING methods (kept backward compatible)
// ═════════════════════════════════════════════════════════

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
  if (p.fresh) return (await fetcher()).data;
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

export async function liveFlights(opts?: { lamin?: number; lamax?: number; lomin?: number; lomax?: number; icao24?: string }): Promise<LiveResponse> {
  const key = cacheKey(["live", opts?.icao24 ?? `${opts?.lamin ?? 0}_${opts?.lamax ?? 0}_${opts?.lomin ?? 0}_${opts?.lomax ?? 0}`]);
  return cachedRequest(key, CACHE_TTL.live, () =>
    requestRaw(`/v1/live${buildQuery(opts ?? {})}`, LiveResponseSchema),
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

// ═════════════════════════════════════════════════════════
//  NEW — Flights group
// ═════════════════════════════════════════════════════════

/** Real-time flight status by flight number (e.g. "6E-2345") */
export async function getFlightStatus(flightNumber: string): Promise<FlightStatus> {
  const { data } = await requestRaw(
    `/v1/flights/status${buildQuery({ flight_number: flightNumber })}`,
    FlightStatusSchema,
  );
  return data;
}

/** Best deal for a route (AI-validated coupon + price) */
export async function getBestDeal(
  source: string,
  destination: string,
  bankName?: string,
  cardType?: string,
): Promise<FlightBestDeal> {
  const key = cacheKey(["best_deal", source, destination, bankName ?? "_", cardType ?? "_"]);
  return cachedRequest(key, 300, () =>
    requestRaw(
      `/v1/flights/best-deal${buildQuery({
        source,
        destination,
        bank_name: bankName,
        card_type: cardType,
      })}`,
      FlightBestDealSchema,
    ),
  );
}

/** Price calendar for a route (raw enriched data with predictions) */
export async function getCalendarRaw(
  source: string,
  destination: string,
  month: string,
): Promise<{ route: string; month: string; prices: Record<string, any>; cheapest_date: string | null; cheapest_price: number | null }> {
  const key = cacheKey(["calendar_raw", source, destination, month]);
  return cachedRequest(key, 1800, () =>
    requestRaw(
      `/v1/flights/calendar${buildQuery({ source, destination, month })}`,
      CalendarRawSchema,
    ),
  );
}

// ═════════════════════════════════════════════════════════
//  NEW — Intelligence
// ═════════════════════════════════════════════════════════

/** 7-90 day price forecast for a route */
export async function getForecast(
  source: string,
  destination: string,
  days = 30,
): Promise<Forecast> {
  const key = cacheKey(["forecast", source, destination, days]);
  return cachedRequest(key, 900, () =>
    requestRaw(
      `/trends/forecast${buildQuery({ source, destination, days })}`,
      ForecastSchema,
    ),
  );
}

/** ML predicted price for a specific flight */
export async function predictPrice(
  source: string,
  destination: string,
  airline: string,
  departDate: string,
): Promise<PredictPrice> {
  const key = cacheKey(["predict", source, destination, airline, departDate]);
  return cachedRequest(key, 600, () =>
    requestRaw(
      `/intelligence/predict-price${buildQuery({ source, destination, airline, depart_date: departDate })}`,
      PredictPriceSchema,
    ),
  );
}

/** Best booking window using historical data */
export async function getBestTimeToBook(
  source: string,
  destination: string,
): Promise<BestTimeToBook> {
  const key = cacheKey(["best_time", source, destination]);
  return cachedRequest(key, 3600, () =>
    requestRaw(
      `/intelligence/best-time-to-book${buildQuery({ source, destination })}`,
      BestTimeToBookSchema,
    ),
  );
}

/** Trending routes (biggest price drops + most searched) */
export async function getTrendingRoutes(limit = 20): Promise<TrendingRoutes> {
  const key = cacheKey(["trending_routes", limit]);
  return cachedRequest(key, 300, () =>
    requestRaw(`/routes/trending${buildQuery({ limit })}`, TrendingRoutesSchema),
  );
}

// ═════════════════════════════════════════════════════════
//  NEW — Compare
// ═════════════════════════════════════════════════════════

/** Compare fares across OTAs for a route */
export async function compareOta(
  source: string,
  destination: string,
): Promise<OtaComparison> {
  const key = cacheKey(["compare_ota", source, destination]);
  return cachedRequest(key, 600, () =>
    requestRaw(
      `/compare/ota${buildQuery({ source, destination })}`,
      OtaComparisonSchema,
    ),
  );
}

/** Compare fares across airlines for a route */
export async function compareAirline(
  source: string,
  destination: string,
): Promise<AirlineComparison> {
  const key = cacheKey(["compare_airline", source, destination]);
  return cachedRequest(key, 600, () =>
    requestRaw(
      `/compare/airline${buildQuery({ source, destination })}`,
      AirlineComparisonSchema,
    ),
  );
}

/** Best bank+card+OTA combo maximizing discounts */
export async function getBankCombo(
  source: string,
  destination: string,
): Promise<BankCombo> {
  const key = cacheKey(["bank_combo", source, destination]);
  return cachedRequest(key, 600, () =>
    requestRaw(
      `/compare/bank-combo${buildQuery({ source, destination })}`,
      BankComboSchema,
    ),
  );
}

// ═════════════════════════════════════════════════════════
//  NEW — Deals
// ═════════════════════════════════════════════════════════

/** Nearby airports within driving distance */
export async function getNearbyAirportDeals(
  iata: string,
  radiusKm = 150,
): Promise<NearbyAirports> {
  const key = cacheKey(["nearby", iata, radiusKm]);
  return cachedRequest(key, 3600, () =>
    requestRaw(
      `/v1/deals/nearby-airports${buildQuery({ iata, radius_km: radiusKm })}`,
      NearbyAirportsSchema,
    ),
  );
}

/** Top cheapest routes and most active airlines */
export async function getDealsTrends(): Promise<DealsTrends> {
  const key = cacheKey(["deals_trends"]);
  return cachedRequest(key, 600, () =>
    requestRaw(`/v1/deals/trends`, DealsTrendsSchema),
  );
}

/** Curated bank & credit card travel offers */
export async function searchBankOffers(
  bank?: string,
  ota?: string,
  limit = 20,
): Promise<BankOffer[]> {
  const key = cacheKey(["bank_offers", bank ?? "_", ota ?? "_", limit]);
  const { data } = await requestRaw(
    `/v1/deals/bank-offers${buildQuery({ bank, ota, limit })}`,
    z.any(), // AirAPI may return array or paginated obj
  );
  if (Array.isArray(data)) return data as BankOffer[];
  // If paginated via ok() envelope it may have been raw array
  return [];
}

// ═════════════════════════════════════════════════════════
//  NEW — Search group (better than /v1/fares)
// ═════════════════════════════════════════════════════════

/** Search fares with advanced filters */
export async function searchFilteredFares(
  source: string,
  destination: string,
  options?: { airline?: string; minPrice?: number; maxPrice?: number; ota?: string; limit?: number },
): Promise<any[]> {
  const key = cacheKey([
    "search_fares",
    source,
    destination,
    options?.airline ?? "_",
    options?.minPrice ?? "_",
    options?.maxPrice ?? "_",
    options?.limit ?? 50,
  ]);
  const { data } = await requestRaw(
    `/search/fares${buildQuery({
      source,
      destination,
      airline: options?.airline,
      min_price: options?.minPrice,
      max_price: options?.maxPrice,
      ota: options?.ota,
      limit: options?.limit ?? 50,
    })}`,
    z.any(),
  );
  if (Array.isArray(data)) return data;
  return data?.results ?? data ?? [];
}

/** Best fare + coupon + bank offer curated combo for a route */
export async function getBestForRoute(
  source: string,
  destination: string,
  bank?: string,
): Promise<BestForRoute> {
  const key = cacheKey(["best_for_route", source, destination, bank ?? "_"]);
  return cachedRequest(key, 600, () =>
    requestRaw(
      `/search/best-for-route${buildQuery({ source, destination, bank })}`,
      BestForRouteSchema,
    ),
  );
}

/** Search coupons with filters */
export async function searchCoupons(
  q?: string,
  bank?: string,
  ota?: string,
  airline?: string,
  limit = 50,
): Promise<any[]> {
  const { data } = await requestRaw(
    `/search/coupons${buildQuery({ q, bank, ota, airline, limit })}`,
    z.any(),
  );
  if (Array.isArray(data)) return data;
  return data?.results ?? data ?? [];
}

/** Search bank & card offers */
export async function searchBankOffersApi(
  bank?: string,
  cardNetwork?: string,
  ota?: string,
  limit = 50,
): Promise<any[]> {
  const { data } = await requestRaw(
    `/search/bank-offers${buildQuery({ bank, card_network: cardNetwork, ota, limit })}`,
    z.any(),
  );
  if (Array.isArray(data)) return data;
  return data?.results ?? data ?? [];
}

// ═════════════════════════════════════════════════════════
//  NEW — Aggregator (Google Flights + Indian OTAs)
// ═════════════════════════════════════════════════════════

/** Search across all Indian OTAs via aggregator */
export async function aggregatorSearch(
  fromCode: string,
  toCode: string,
  departDate: string,
  returnDate?: string,
  providers?: string[],
): Promise<AggregatorSearch> {
  const { data } = await requestRaw(
    `/aggregator/search-flights`,
    AggregatorSearchSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_code: fromCode.toUpperCase(),
        to_code: toCode.toUpperCase(),
        depart_date: departDate,
        ...(returnDate ? { return_date: returnDate } : {}),
        ...(providers ? { providers } : {}),
      }),
    },
  );
  return data;
}

/** List all available providers with fees */
export async function listProviders(): Promise<Providers> {
  const key = cacheKey(["providers"]);
  return cachedRequest(key, 3600, () =>
    requestRaw(`/aggregator/providers`, ProvidersSchema),
  );
}

/** Current offers for a specific provider */
export async function getProviderOffers(provider: string): Promise<any[]> {
  const { data } = await requestRaw(
    `/aggregator/offers/${encodeURIComponent(provider)}`,
    z.any(),
  );
  if (Array.isArray(data)) return data;
  return data?.offers ?? [];
}

/** Aggregator single best deal */
export async function aggregatorBestDeal(
  fromCode: string,
  toCode: string,
  departDate: string,
): Promise<AggregatorBestDeal> {
  const key = cacheKey(["agg_best_deal", fromCode, toCode, departDate]);
  return cachedRequest(key, 300, () =>
    requestRaw(
      `/aggregator/best-deal${buildQuery({
        from_code: fromCode.toUpperCase(),
        to_code: toCode.toUpperCase(),
        depart_date: departDate,
      })}`,
      AggregatorBestDealSchema,
    ),
  );
}

/** Multi-city flight search */
export async function multiCitySearch(
  legs: { from_code: string; to_code: string; date: string }[],
  passengers = 1,
): Promise<MultiCity> {
  const { data } = await requestRaw(
    `/aggregator/multi-city`,
    MultiCitySchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legs: legs.map((l) => ({
        from_code: l.from_code.toUpperCase(),
        to_code: l.to_code.toUpperCase(),
        date: l.date,
      })), passengers }),
    },
  );
  return data;
}

// ═════════════════════════════════════════════════════════
//  NEW — Domestic / Reference
// ═════════════════════════════════════════════════════════

/** India-specific airport list */
export async function getDomesticAirports(): Promise<any[]> {
  const key = cacheKey(["domestic_airports"]);
  const { data } = await cachedRequest(key, 3600, () =>
    requestRaw(`/domestic/airports`, z.any()),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** Single India airport detail */
export async function getDomesticAirport(iata: string): Promise<any> {
  const { data } = await requestRaw(
    `/domestic/airports/${iata.toUpperCase()}`,
    z.any(),
  );
  return data;
}

/** All India domestic routes */
export async function getDomesticRoutes(): Promise<any[]> {
  const key = cacheKey(["domestic_routes"]);
  const { data } = await cachedRequest(key, 3600, () =>
    requestRaw(`/domestic/routes`, z.any()),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** Routes from a specific India airport */
export async function getRoutesFromAirport(iata: string): Promise<any[]> {
  const key = cacheKey(["routes_from", iata]);
  const { data } = await cachedRequest(key, 3600, () =>
    requestRaw(`/domestic/routes/from/${iata.toUpperCase()}`, z.any()),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** India airlines list */
export async function getDomesticAirlines(): Promise<any[]> {
  const key = cacheKey(["domestic_airlines"]);
  const { data } = await cachedRequest(key, 3600, () =>
    requestRaw(`/domestic/airlines`, z.any()),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** Airport weather (METAR) */
export async function getAirportWeather(iata: string): Promise<AirportWeather> {
  const key = cacheKey(["weather", iata]);
  return cachedRequest(key, 1800, () =>
    requestRaw(
      `/v1/airports/${iata.toUpperCase()}/weather`,
      AirportWeatherSchema,
    ),
  );
}

// ═════════════════════════════════════════════════════════
//  NEW — Alerts
// ═════════════════════════════════════════════════════════

export interface AlertRequest {
  source: string;
  destination: string;
  target_price: number;
  expiry_days?: number;
}

/** Subscribe to price-drop alert */
export async function subscribeAlert(req: AlertRequest): Promise<FareAlert> {
  const { data } = await requestRaw(
    `/alerts/subscribe`,
    AlertSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: req.source.toUpperCase(),
        destination: req.destination.toUpperCase(),
        target_price: req.target_price,
        expiry_days: req.expiry_days ?? 30,
      }),
    },
  );
  return data;
}

/** List active alerts */
export async function getAlerts(activeOnly = true): Promise<FareAlert[]> {
  const key = cacheKey(["alerts", activeOnly]);
  const { data } = await cachedRequest(key, 60, () =>
    requestRaw(`/alerts/list${buildQuery({ active_only: activeOnly ? 1 : 0 })}`, z.any()),
  );
  if (Array.isArray(data)) return data;
  return data?.alerts ?? data ?? [];
}

/** Delete an alert */
export async function deleteAlert(id: string): Promise<{ status: string; id: string }> {
  const { data } = await requestRaw(
    `/alerts/${id}`,
    z.object({ status: z.string(), id: z.string() }),
    { method: "DELETE" },
  );
  return data;
}

// ═════════════════════════════════════════════════════════
//  NEW — Analytics
// ═════════════════════════════════════════════════════════

/** Route statistics (price distribution over time) */
export async function getRouteStats(
  source: string,
  destination: string,
): Promise<any[]> {
  const key = cacheKey(["route_stats", source, destination]);
  const { data } = await cachedRequest(key, 600, () =>
    requestRaw(
      `/analytics/route-stats${buildQuery({ source, destination })}`,
      z.any(),
    ),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** Top trending routes by search frequency */
export async function getAnalyticsTrendingRoutes(limit = 20): Promise<any[]> {
  const key = cacheKey(["analytics_trending", limit]);
  const { data } = await cachedRequest(key, 600, () =>
    requestRaw(
      `/analytics/trending-routes${buildQuery({ limit })}`,
      z.any(),
    ),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** Airline performance scores (DGCA OTP, delay, cancellation) */
export async function getAirlinePerformance(
  airline?: string,
): Promise<any[]> {
  const key = cacheKey(["airline_perf", airline ?? "all"]);
  const { data } = await cachedRequest(key, 3600, () =>
    requestRaw(
      `/analytics/airline-performance${buildQuery({ airline })}`,
      z.any(),
    ),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** Market share data */
export async function getMarketShare(): Promise<any[]> {
  const key = cacheKey(["market_share"]);
  const { data } = await cachedRequest(key, 3600, () =>
    requestRaw(`/analytics/market-share`, z.any()),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

// ═════════════════════════════════════════════════════════
//  NEW — Traffic (DGCA data)
// ═════════════════════════════════════════════════════════

export interface TrafficQuery {
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  limit?: number;
  offset?: number;
  city1?: string;
  city2?: string;
  airline?: string;
  quarter?: number;
  country?: string;
}

export async function getTrafficDaily(q: TrafficQuery = {}): Promise<any[]> {
  const { data } = await requestRaw(
    `/traffic/daily${buildQuery({
      from_date: q.fromDate,
      to_date: q.toDate,
      year: q.year,
      month: q.month,
      limit: q.limit ?? 50,
      offset: q.offset ?? 0,
    })}`,
    z.any(),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function getTrafficDomesticCity(q: TrafficQuery = {}): Promise<any[]> {
  const { data } = await requestRaw(
    `/traffic/domestic/city${buildQuery({
      city1: q.city1,
      city2: q.city2,
      year: q.year,
      month: q.month,
      limit: q.limit ?? 50,
      offset: q.offset ?? 0,
    })}`,
    z.any(),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function getTrafficDomesticCarrier(q: TrafficQuery = {}): Promise<any[]> {
  const { data } = await requestRaw(
    `/traffic/domestic/carrier${buildQuery({
      airline: q.airline,
      year: q.year,
      month: q.month,
      limit: q.limit ?? 50,
      offset: q.offset ?? 0,
    })}`,
    z.any(),
  );
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function getTrafficSummary(): Promise<Record<string, unknown>> {
  const { data } = await cachedRequest(
    cacheKey(["traffic_summary"]),
    600,
    () => requestRaw(`/traffic/summary`, TrafficSummarySchema),
  );
  return data as Record<string, unknown>;
}

// ═════════════════════════════════════════════════════════
//  AirApi namespace export (convenient access to everything)
// ═════════════════════════════════════════════════════════

export const airApi = {
  // Reference
  searchAirports,
  listAirlines,
  listRoutes,
  getAirportWeather,
  // Flights
  searchFares,
  faresCalendar,
  getCalendarRaw,
  liveFlights,
  getFlightStatus,
  getBestDeal,
  // Deals
  listCoupons,
  getDealsTrends,
  searchBankOffers,
  getNearbyAirportDeals,
  // Intelligence
  getForecast,
  predictPrice,
  getBestTimeToBook,
  getTrendingRoutes,
  // Compare
  compareOta,
  compareAirline,
  getBankCombo,
  // Search
  searchFilteredFares,
  getBestForRoute,
  searchCoupons,
  searchBankOffersApi,
  // Aggregator
  aggregatorSearch,
  listProviders,
  getProviderOffers,
  aggregatorBestDeal,
  multiCitySearch,
  // Domestic
  getDomesticAirports,
  getDomesticAirport,
  getDomesticRoutes,
  getRoutesFromAirport,
  getDomesticAirlines,
  // Alerts
  subscribeAlert,
  getAlerts,
  deleteAlert,
  // Analytics
  getRouteStats,
  getAnalyticsTrendingRoutes,
  getAirlinePerformance,
  getMarketShare,
  // Traffic
  getTrafficDaily,
  getTrafficDomesticCity,
  getTrafficDomesticCarrier,
  getTrafficSummary,
  // Health
  sourcesHealth,
};

// Type re-exports for convenience
export type {
  AirportsResponse,
  AirlinesResponse,
  FaresResponse,
  CalendarResponse,
  CouponsResponse,
  LiveResponse,
  RoutesResponse,
  HealthResponse,
  FlightStatus,
  FlightBestDeal,
  Forecast,
  PredictPrice,
  BestTimeToBook,
  TrendingRoutes,
  OtaComparison,
  AirlineComparison,
  BankCombo,
  NearbyAirports,
  DealsTrends,
  BankOffer,
  BestForRoute,
  AggregatorSearch,
  AggregatorFlight,
  Providers,
  AggregatorBestDeal,
  MultiCity,
  FareAlert,
  AirportWeather,
  SearchAirportsParams,
  SearchFaresParams,
  CalendarParams,
  CouponsParams,
};
