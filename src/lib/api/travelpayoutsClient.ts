import { createHash } from "node:crypto";
import { z } from "zod";
import { cacheGet, cacheSet, cacheKey, CACHE_TTL } from "./travelpayoutsCache";
import {
  AirportSchema,
  AirlineSchema,
  AirportsResponseSchema,
  AirlinesResponseSchema,
  CalendarResponseSchema,
  CouponsResponseSchema,
  FaresResponseSchema,
  type Airport,
  type Airline,
  type CalendarResponse,
  type Coupon,
  type Fare,
  type FlightStatus,
  type LiveFlight,
  type SearchAirportsParams,
  type SearchFaresParams,
  type CalendarParams,
  type CouponsParams,
} from "./travelpayoutsTypes";

const DEFAULT_BASE_URL = "https://api.travelpayouts.com";
const DEFAULT_LOCALE = "en";
const DEFAULT_CURRENCY = "INR";
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 8_000;

type PassengerSet = {
  adults: number;
  children: number;
  infants: number;
};

export type FlightSearchSegment = {
  origin: string;
  destination: string;
  date: string;
};

export type FlightSearchSignaturePayload = {
  marker: string;
  host: string;
  user_ip: string;
  locale: string;
  trip_class: "Y" | "C";
  passengers: PassengerSet;
  segments: FlightSearchSegment[];
  currency?: string;
};

type TravelpayoutsConfig = {
  baseUrl: string;
  token: string;
  marker?: string;
  host?: string;
  defaultUserIp?: string;
};

type CalendarTicket = {
  origin?: string;
  destination?: string;
  price?: number;
  transfers?: number;
  airline?: string;
  flight_number?: string | number | null;
  departure_at?: string | null;
  return_at?: string | null;
  expires_at?: string | null;
};

type LatestPrice = {
  origin?: string;
  destination?: string;
  value?: number;
  price?: number;
  airline?: string;
  departure_at?: string;
  return_at?: string | null;
  transfers?: number;
};

type RealtimeTerm = {
  price?: number;
  unified_price?: number;
  currency?: string;
  url?: string;
  gate_id?: string | number;
};

type RealtimeFlight = {
  arrival?: string;
  departure?: string;
  operating_carrier?: string;
  marketing_carrier?: string;
  number?: string | number;
  departure_date?: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  duration?: number;
  local_departure_timestamp?: number;
  local_arrival_timestamp?: number;
};

export class TravelpayoutsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TravelpayoutsConfigError";
  }
}

export class TravelpayoutsError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: string,
    public code?: string,
  ) {
    super(message);
    this.name = "TravelpayoutsError";
  }
}

function normalizeBaseUrl(raw: string | undefined): string {
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function getConfig(): TravelpayoutsConfig {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) {
    throw new TravelpayoutsConfigError(
      "Travelpayouts token missing: set TRAVELPAYOUTS_TOKEN",
    );
  }
  return {
    baseUrl: normalizeBaseUrl(process.env.TRAVELPAYOUTS_API_BASE),
    token,
    marker: process.env.TRAVELPAYOUTS_MARKER,
    host: process.env.TRAVELPAYOUTS_HOST,
    defaultUserIp: process.env.TRAVELPAYOUTS_DEFAULT_USER_IP,
  };
}

function getRealtimeConfig(): Required<TravelpayoutsConfig> {
  const config = getConfig();
  if (!config.marker || !config.host || !config.defaultUserIp) {
    throw new TravelpayoutsConfigError(
      "Real-time Travelpayouts search requires TRAVELPAYOUTS_MARKER, TRAVELPAYOUTS_HOST, and TRAVELPAYOUTS_DEFAULT_USER_IP",
    );
  }
  if (/^(127\.|0\.0\.0\.0|localhost$)/i.test(config.defaultUserIp)) {
    throw new TravelpayoutsConfigError(
      "TRAVELPAYOUTS_DEFAULT_USER_IP must be a public user IP, not localhost",
    );
  }
  return config as Required<TravelpayoutsConfig>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson<T>(
  pathOrUrl: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const config = getConfig();
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${config.baseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const fetchOpts: RequestInit = {
        ...init,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "x-access-token": config.token,
          "User-Agent": "TheWingsScan/1.0 Travelpayouts",
          ...(init.headers ?? {}),
        },
      };

      let res: Response;
      try {
        res = await fetch(url, fetchOpts);
      } catch (fetchErr) {
        if (
          fetchErr instanceof TypeError &&
          (fetchErr.message.includes("AbortSignal") || fetchErr.message.includes("signal"))
        ) {
          // If the runtime rejects the signal due to class/polyfill mismatch, fallback to no signal.
          delete fetchOpts.signal;
          res = await fetch(url, fetchOpts);
        } else {
          throw fetchErr;
        }
      }
      clearTimeout(timeout);

      if ((res.status >= 500 || res.status === 429) && attempt < MAX_RETRIES) {
        lastErr = new TravelpayoutsError(res.status, `Travelpayouts transient ${res.status} on ${url}`);
        await sleep(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new TravelpayoutsError(res.status, `Travelpayouts ${res.status} on ${url}`, body);
      }

      const json = await res.json();
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new TravelpayoutsError(
          200,
          `Travelpayouts schema mismatch on ${url}: ${parsed.error.message.slice(0, 240)}`,
        );
      }
      return parsed.data;
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
      if (err instanceof TravelpayoutsError) throw err;
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
    }
  }

  if (lastErr instanceof Error) throw lastErr;
  throw new TravelpayoutsError(0, `Travelpayouts request failed on ${pathOrUrl}`);
}

function matchesQuery(values: Array<string | null | undefined>, query: string): boolean {
  const q = query.trim().toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(q));
}

function mapAirport(raw: unknown): Airport | null {
  const r = raw as Record<string, unknown>;
  const code = String(r.code ?? r.iata ?? "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return null;
  const coordinates = (r.coordinates ?? {}) as Record<string, unknown>;
  const candidate = {
    iata: code,
    icao: typeof r.icao === "string" ? r.icao : null,
    name: String(r.name ?? r.name_translations ?? code),
    city: String(r.city_code ?? r.city ?? code),
    country: String(r.country_code ?? r.country ?? ""),
    latitude: typeof coordinates.lat === "number" ? coordinates.lat : null,
    longitude: typeof coordinates.lon === "number" ? coordinates.lon : null,
    timezone: typeof r.time_zone === "string" ? r.time_zone : null,
  };
  const parsed = AirportSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function mapAirline(raw: unknown): Airline | null {
  const r = raw as Record<string, unknown>;
  const code = String(r.code ?? r.iata ?? "").toUpperCase();
  if (!/^[A-Z0-9]{2,3}$/.test(code)) return null;
  const parsed = AirlineSchema.safeParse({
    iata: code,
    icao: typeof r.icao === "string" ? r.icao : null,
    name: String(r.name ?? code),
    alias: null,
    callsign: null,
    country: typeof r.country_code === "string" ? r.country_code : null,
    active: r.is_active === false ? false : true,
  });
  return parsed.success ? parsed.data : null;
}

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

function normalizeFlightNumber(airline: string, flightNumber: string | number | null | undefined): string {
  if (flightNumber === null || flightNumber === undefined || flightNumber === "") return "";
  const raw = String(flightNumber).trim();
  if (raw.toUpperCase().startsWith(airline.toUpperCase())) return raw;
  return `${airline}-${raw}`;
}

function normalizeCalendarRows(json: unknown): CalendarTicket[] {
  const root = json as Record<string, unknown>;
  const data = root.data ?? root;
  if (Array.isArray(data)) return data as CalendarTicket[];
  if (data && typeof data === "object") {
    return Object.values(data as Record<string, unknown>) as CalendarTicket[];
  }
  return [];
}

function calendarTicketToFare(
  row: CalendarTicket,
  origin: string,
  destination: string,
  fallbackDate: string,
): Fare | null {
  const price = Number(row.price);
  if (!(price > 0)) return null;
  const airline = String(row.airline ?? "TP").toUpperCase();
  const departureDate = (row.departure_at ?? fallbackDate).slice(0, 10);
  const fare = {
    from: String(row.origin ?? origin).toUpperCase(),
    to: String(row.destination ?? destination).toUpperCase(),
    airline,
    flightNumber: normalizeFlightNumber(airline, row.flight_number),
    price,
    currency: DEFAULT_CURRENCY,
    departureDate,
    returnDate: row.return_at ? row.return_at.slice(0, 10) : null,
    departureTime: row.departure_at ?? `${departureDate}T00:00:00`,
    arrivalTime: null,
    durationMinutes: null,
    stops: Number.isFinite(row.transfers) ? Number(row.transfers) : 0,
    sourceApi: "travelpayouts_calendar",
    recordedAt: row.expires_at ?? new Date().toISOString(),
    bookingToken: null,
    searchId: null,
    gateId: null,
  };
  const parsed = FaresResponseSchema.shape.fares.element.safeParse(fare);
  return parsed.success ? parsed.data : null;
}

function flightDateTime(date?: string, time?: string, timestamp?: number): string | null {
  if (timestamp && Number.isFinite(timestamp)) return new Date(timestamp * 1000).toISOString();
  if (date && time) return `${date}T${time}:00`;
  if (date) return `${date}T00:00:00`;
  return null;
}

function chooseCheapestTerm(terms: unknown): RealtimeTerm | null {
  if (!terms || typeof terms !== "object") return null;
  const all = Object.values(terms as Record<string, RealtimeTerm>)
    .filter((term) => Number(term.unified_price ?? term.price) > 0)
    .sort((a, b) => Number(a.unified_price ?? a.price) - Number(b.unified_price ?? b.price));
  return all[0] ?? null;
}

function realtimeProposalToFare(
  proposal: Record<string, unknown>,
  origin: string,
  destination: string,
  fallbackDate: string,
  searchId: string,
): Fare | null {
  const term = chooseCheapestTerm(proposal.terms);
  if (!term) return null;

  const segment = Array.isArray(proposal.segment) ? proposal.segment : [];
  const flights: RealtimeFlight[] = segment.flatMap((leg) => {
    const records = (leg as Record<string, unknown>).flight;
    return Array.isArray(records) ? (records as RealtimeFlight[]) : [];
  });
  const first = flights[0] ?? {};
  const last = flights[flights.length - 1] ?? first;
  const airline = String(first.operating_carrier ?? first.marketing_carrier ?? "TP").toUpperCase();
  const departureTime = flightDateTime(
    first.departure_date,
    first.departure_time,
    first.local_departure_timestamp,
  ) ?? `${fallbackDate}T00:00:00`;
  const arrivalTime = flightDateTime(
    last.arrival_date,
    last.arrival_time,
    last.local_arrival_timestamp,
  );

  const fare = {
    from: String(first.departure ?? origin).toUpperCase(),
    to: String(last.arrival ?? destination).toUpperCase(),
    airline,
    flightNumber: normalizeFlightNumber(airline, first.number),
    price: Number(term.unified_price ?? term.price),
    currency: DEFAULT_CURRENCY,
    departureDate: departureTime.slice(0, 10),
    returnDate: null,
    departureTime,
    arrivalTime,
    durationMinutes: Number.isFinite(first.duration) ? Number(first.duration) : null,
    stops: Math.max(0, flights.length - 1),
    sourceApi: "travelpayouts_realtime",
    recordedAt: new Date().toISOString(),
    bookingToken: term.url ?? null,
    searchId,
    gateId: term.gate_id ?? null,
  };
  const parsed = FaresResponseSchema.shape.fares.element.safeParse(fare);
  return parsed.success ? parsed.data : null;
}

function cabinToTripClass(cabin?: SearchFaresParams["cabin"]): "Y" | "C" {
  return cabin === "business" || cabin === "first" ? "C" : "Y";
}

function sortedNestedValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => sortedNestedValues(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .flatMap((key) => sortedNestedValues((value as Record<string, unknown>)[key]));
  }
  if (value === undefined || value === null) return [];
  return [String(value)];
}

export function buildFlightSearchSignature(
  token: string,
  payload: FlightSearchSignaturePayload,
): { source: string; md5: string } {
  const values = Object.keys(payload)
    .sort()
    .flatMap((key) => sortedNestedValues((payload as unknown as Record<string, unknown>)[key]));
  const source = [token, ...values].join(":");
  return {
    source,
    md5: createHash("md5").update(source).digest("hex"),
  };
}

async function searchRealtimeFares(params: SearchFaresParams): Promise<Fare[]> {
  const config = getRealtimeConfig();
  const payloadWithoutSignature: FlightSearchSignaturePayload = {
    marker: config.marker,
    host: config.host,
    user_ip: config.defaultUserIp,
    locale: process.env.TRAVELPAYOUTS_LOCALE ?? DEFAULT_LOCALE,
    trip_class: cabinToTripClass(params.cabin),
    passengers: {
      adults: Math.max(1, Math.min(params.pax ?? 1, 9)),
      children: 0,
      infants: 0,
    },
    segments: [
      { origin: params.from, destination: params.to, date: params.date },
      ...(params.returnDate ? [{ origin: params.to, destination: params.from, date: params.returnDate }] : []),
    ],
    currency: DEFAULT_CURRENCY.toLowerCase(),
  };
  const signature = buildFlightSearchSignature(config.token, payloadWithoutSignature);
  const initResponse = await requestJson(
    "/v1/flight_search",
    z.any(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payloadWithoutSignature, signature: signature.md5 }),
    },
  );
  const searchId = String(
    (initResponse as Record<string, unknown>).search_id ??
      ((initResponse as Record<string, unknown>).meta as Record<string, unknown> | undefined)?.uuid ??
      "",
  );
  if (!searchId) return [];

  const fares: Fare[] = [];
  for (let i = 0; i < 5; i++) {
    await sleep(i === 0 ? 350 : 700);
    const response = await requestJson(`/v1/flight_search_results?uuid=${encodeURIComponent(searchId)}`, z.any());
    if (!Array.isArray(response)) continue;

    for (const chunk of response as Array<Record<string, unknown>>) {
      const proposals = Array.isArray(chunk.proposals) ? chunk.proposals : [];
      for (const proposal of proposals as Array<Record<string, unknown>>) {
        const fare = realtimeProposalToFare(proposal, params.from, params.to, params.date, searchId);
        if (fare) fares.push(fare);
      }
    }
    if (fares.length > 0) break;
  }
  return fares;
}

async function fetchCalendarRows(origin: string, destination: string, month: string): Promise<CalendarTicket[]> {
  const key = cacheKey(["travelpayouts", "calendar", origin, destination, month]);
  const hit = await cacheGet<CalendarTicket[]>(key);
  if (hit) return hit;

  const path =
    `/v1/prices/calendar?origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    `&depart_date=${encodeURIComponent(month)}` +
    `&calendar_type=departure_date&currency=${DEFAULT_CURRENCY}`;
  const json = await requestJson(path, z.any());
  const rows = normalizeCalendarRows(json);
  await cacheSet(key, rows, CACHE_TTL.calendar);
  return rows;
}

export async function searchAirports(params: SearchAirportsParams) {
  const key = cacheKey(["travelpayouts", "airports", DEFAULT_LOCALE]);
  let records = await cacheGet<Airport[]>(key);
  if (!records) {
    const json = await requestJson("/data/en/airports.json", z.array(z.any()));
    records = json.map(mapAirport).filter((a): a is Airport => a !== null);
    await cacheSet(key, records, CACHE_TTL.airports);
  }

  const q = params.q.trim();
  const filtered = records
    .filter((airport) => matchesQuery([airport.iata, airport.name, airport.city, airport.country], q))
    .slice(0, params.limit ?? 10);
  return AirportsResponseSchema.parse({ airports: filtered });
}

export async function listAirlines() {
  const key = cacheKey(["travelpayouts", "airlines", DEFAULT_LOCALE]);
  let records = await cacheGet<Airline[]>(key);
  if (!records) {
    const json = await requestJson("/data/en/airlines.json", z.array(z.any()));
    records = json.map(mapAirline).filter((a): a is Airline => a !== null);
    await cacheSet(key, records, CACHE_TTL.airlines);
  }
  return AirlinesResponseSchema.parse({ airlines: records });
}

export async function searchFares(params: SearchFaresParams) {
  const useRealtime = process.env.TRAVELPAYOUTS_ENABLE_REALTIME_SEARCH === "true";
  if (useRealtime) {
    try {
      const realtime = await searchRealtimeFares(params);
      if (realtime.length > 0) return FaresResponseSchema.parse({ fares: realtime });
    } catch (err) {
      if (!(err instanceof TravelpayoutsConfigError)) {
        console.warn("Travelpayouts real-time search failed; using cached fare data", err);
      }
    }
  }

  const month = monthFromDate(params.date);
  const rows = await fetchCalendarRows(params.from, params.to, month);
  const fares = rows
    .filter((row) => (row.departure_at ?? "").slice(0, 10) === params.date)
    .map((row) => calendarTicketToFare(row, params.from, params.to, params.date))
    .filter((fare): fare is Fare => fare !== null);
  return FaresResponseSchema.parse({ fares });
}

export async function faresCalendar(params: CalendarParams): Promise<CalendarResponse> {
  const rows = await fetchCalendarRows(params.from, params.to, params.month);
  const days = rows
    .map((row) => {
      const date = (row.departure_at ?? "").slice(0, 10);
      if (!date) return null;
      return {
        date,
        cheapest: Number(row.price) > 0 ? Number(row.price) : null,
        currency: DEFAULT_CURRENCY,
      };
    })
    .filter((row): row is { date: string; cheapest: number | null; currency: "INR" } => row !== null);
  return CalendarResponseSchema.parse({ days });
}

export async function listCoupons(_params: CouponsParams = {}) {
  void _params;
  const raw = process.env.TRAVELPAYOUTS_PARTNER_OFFERS_JSON;
  if (!raw) return CouponsResponseSchema.parse({ coupons: [] });
  try {
    const coupons = JSON.parse(raw) as Coupon[];
    return CouponsResponseSchema.parse({ coupons });
  } catch {
    return CouponsResponseSchema.parse({ coupons: [] });
  }
}

async function latestPrices(origin?: string, limit = 30): Promise<LatestPrice[]> {
  const params = new URLSearchParams({
    currency: DEFAULT_CURRENCY,
    period_type: "year",
    one_way: "true",
    show_to_affiliates: "true",
    limit: String(Math.min(limit, 1000)),
  });
  if (origin) params.set("origin", origin);
  const json = await requestJson(`/v2/prices/latest?${params.toString()}`, z.any());
  const data = (json as Record<string, unknown>).data ?? json;
  return Array.isArray(data) ? (data as LatestPrice[]) : [];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], pct: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * pct))] ?? null;
}

async function routeFaresForAnalysis(origin: string, destination: string): Promise<Fare[]> {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const month = tomorrow.slice(0, 7);
  const rows = await fetchCalendarRows(origin, destination, month);
  return rows
    .map((row) => calendarTicketToFare(row, origin, destination, (row.departure_at ?? tomorrow).slice(0, 10)))
    .filter((fare): fare is Fare => fare !== null);
}

export async function getDealsTrends() {
  const rows = await latestPrices(undefined, 50).catch(() => []);
  const routes = rows
    .map((row) => ({
      source_airport: String(row.origin ?? "").toUpperCase(),
      destination_airport: String(row.destination ?? "").toUpperCase(),
      airline: String(row.airline ?? "Travelpayouts"),
      price: Number(row.value ?? row.price ?? 0),
    }))
    .filter((row) => row.source_airport && row.destination_airport && row.price > 0)
    .sort((a, b) => a.price - b.price);

  const airlineCounts = new Map<string, number>();
  for (const route of routes) {
    airlineCounts.set(route.airline, (airlineCounts.get(route.airline) ?? 0) + 1);
  }

  return {
    top_cheapest_routes: routes.slice(0, 12),
    most_active_airlines: Array.from(airlineCounts.entries())
      .map(([airline, samples]) => ({ airline, samples }))
      .sort((a, b) => b.samples - a.samples),
  };
}

export async function getTrendingRoutes(limit = 20) {
  const trends = await getDealsTrends();
  return {
    biggest_drops: trends.top_cheapest_routes.slice(0, limit).map((route) => ({
      route: `${route.source_airport}-${route.destination_airport}`,
      drop_pct: 0,
      week_avg: route.price,
      current_price: route.price,
    })),
  };
}

export async function getNearbyAirportDeals(iata: string, _radiusKm = 150) {
  void _radiusKm;
  const rows = await latestPrices(iata, 20).catch(() => []);
  return rows.map((row) => ({
    source_airport: String(row.origin ?? iata).toUpperCase(),
    destination_airport: String(row.destination ?? "").toUpperCase(),
    price: Number(row.value ?? row.price ?? 0),
    airline: row.airline ?? "Travelpayouts",
  })).filter((row) => row.destination_airport && row.price > 0);
}

export async function searchBankOffers(_bank?: string, _ota?: string, limit = 50) {
  void _bank;
  void _ota;
  const coupons = (await listCoupons()).coupons;
  return coupons.slice(0, limit).map((coupon) => ({
    title: coupon.description ?? coupon.code,
    discount_type: coupon.discountType,
    discount_value: coupon.discountValue,
    bank_name: coupon.bankName ?? "Travelpayouts partner",
    card_type: coupon.cardType,
    min_spend: coupon.minSpend,
  }));
}

export async function searchCoupons(_q?: string, _bank?: string, _ota?: string, _airline?: string, limit = 50) {
  void _q;
  void _bank;
  void _ota;
  void _airline;
  return (await listCoupons()).coupons.slice(0, limit);
}

export async function getForecast(origin: string, destination: string, _days = 30) {
  void _days;
  const fares = await routeFaresForAnalysis(origin, destination);
  const prices = fares.map((fare) => fare.price).filter((price) => price > 0);
  const median = percentile(prices, 0.5);
  const p75 = percentile(prices, 0.75);
  const p25 = percentile(prices, 0.25);
  return {
    median,
    p75,
    p25,
    sample_size: prices.length,
    recommendation: prices.length === 0 ? "insufficient_data" : "compare_dates",
  };
}

export async function predictPrice(origin: string, destination: string, airline: string, departDate: string) {
  const month = departDate.slice(0, 7);
  const rows = await fetchCalendarRows(origin, destination, month);
  const fares = rows
    .map((row) => calendarTicketToFare(row, origin, destination, (row.departure_at ?? departDate).slice(0, 10)))
    .filter((fare): fare is Fare => fare !== null);
  const prices = fares.map((fare) => fare.price);
  const selected = fares.find((fare) => fare.departureDate === departDate && (!airline || fare.airline === airline));
  const predicted = selected?.price ?? percentile(prices, 0.5) ?? 0;
  return {
    predicted_price: predicted,
    confidence_low: percentile(prices, 0.25) ?? predicted,
    confidence_high: percentile(prices, 0.75) ?? predicted,
    model_version: "travelpayouts-cache-v1",
    training_samples: prices.length,
  };
}

export async function getBestTimeToBook(origin: string, destination: string) {
  const fares = await routeFaresForAnalysis(origin, destination);
  const prices = fares.map((fare) => fare.price);
  const median = percentile(prices, 0.5) ?? 0;
  const cheapest = [...fares].sort((a, b) => a.price - b.price)[0];
  return {
    recommendation: prices.length > 0 ? "Compare flexible dates before booking" : "Search a route to collect fare signals",
    price_trend: prices.length > 1 && cheapest?.price && cheapest.price < median ? "falling" : "stable",
    cheapest_day_of_week: cheapest ? new Date(cheapest.departureDate).toLocaleDateString("en-IN", { weekday: "long" }) : "Unknown",
    cheapest_month: cheapest ? new Date(cheapest.departureDate).toLocaleDateString("en-IN", { month: "long" }) : "Unknown",
  };
}

export async function compareOta(origin: string, destination: string) {
  const fares = await routeFaresForAnalysis(origin, destination);
  const bySource = new Map<string, Fare[]>();
  for (const fare of fares) {
    const key = fare.sourceApi;
    bySource.set(key, [...(bySource.get(key) ?? []), fare]);
  }
  const comparison: Record<string, { cheapest: number; average: number; count: number; airlines: string[] }> = {};
  for (const [source, sourceFares] of bySource) {
    const prices = sourceFares.map((fare) => fare.price);
    comparison[source] = {
      cheapest: Math.min(...prices),
      average: Math.round(average(prices)),
      count: sourceFares.length,
      airlines: Array.from(new Set(sourceFares.map((fare) => fare.airline))),
    };
  }
  const cheapestSource = Object.entries(comparison).sort((a, b) => a[1].cheapest - b[1].cheapest)[0]?.[0] ?? null;
  return { comparison, cheapest_source: cheapestSource };
}

export async function compareAirline(origin: string, destination: string) {
  const fares = await routeFaresForAnalysis(origin, destination);
  const byAirline = new Map<string, Fare[]>();
  for (const fare of fares) byAirline.set(fare.airline, [...(byAirline.get(fare.airline) ?? []), fare]);
  return {
    ranked_airlines: Array.from(byAirline.entries())
      .map(([airline, airlineFares]) => {
        const prices = airlineFares.map((fare) => fare.price);
        return {
          airline,
          cheapest: Math.min(...prices),
          average: Math.round(average(prices)),
          count: airlineFares.length,
        };
      })
      .sort((a, b) => a.cheapest - b.cheapest),
  };
}

export async function getBankCombo(origin: string, destination: string) {
  const fares = await routeFaresForAnalysis(origin, destination);
  const cheapest = [...fares].sort((a, b) => a.price - b.price)[0];
  if (!cheapest) return { best_combo: null, all_combos: [] };
  return {
    best_combo: {
      base_price: cheapest.price,
      bank_savings: 0,
      effective_price: cheapest.price,
      best_bank_offer: null,
    },
    all_combos: [],
  };
}

export async function getBestForRoute(origin: string, destination: string, _bank?: string) {
  void _bank;
  const fares = await routeFaresForAnalysis(origin, destination);
  return [...fares].sort((a, b) => a.price - b.price)[0] ?? null;
}

export async function aggregatorSearch(
  fromCode: string,
  toCode: string,
  departDate: string,
  _returnDate?: string,
  _providers?: string[],
) {
  void _returnDate;
  void _providers;
  const { fares } = await searchFares({ from: fromCode, to: toCode, date: departDate });
  const results = fares
    .sort((a, b) => a.price - b.price)
    .map((fare) => ({
      provider: "Travelpayouts",
      flight: {
        airline_name: fare.airline,
        flight_number: fare.flightNumber,
        departure_display: fare.departureTime,
        arrival_display: fare.arrivalTime ?? "Arrival TBA",
        duration: fare.durationMinutes ? `${fare.durationMinutes}m` : "Duration TBA",
        stops: fare.stops,
        source_url: null,
      },
      priceDetails: {
        best_price: fare.price,
        savings: 0,
        applied_offer: null,
      },
    }));
  return {
    cheapestOption: results[0] ?? null,
    results,
    summary: {
      totalOptions: results.length,
      providersCount: results.length > 0 ? 1 : 0,
      cheapestBasePrice: results[0]?.priceDetails.best_price ?? 0,
      dateAdjusted: false,
    },
    note: "Travelpayouts cached fare data is shown unless real-time search is enabled.",
  };
}

export async function aggregatorBestDeal(fromCode: string, toCode: string, departDate: string) {
  return (await aggregatorSearch(fromCode, toCode, departDate)).cheapestOption;
}

export async function multiCitySearch(legs: { from_code: string; to_code: string; date: string }[], passengers = 1) {
  const results = await Promise.all(
    legs.map((leg) => searchFares({ from: leg.from_code, to: leg.to_code, date: leg.date, pax: passengers })),
  );
  return { legs: results.map((result) => result.fares), passengers };
}

export async function listProviders() {
  return [{ id: "travelpayouts", name: "Travelpayouts / Aviasales", active: true }];
}

export async function getProviderOffers(_provider: string) {
  void _provider;
  return searchCoupons();
}

export async function getBestDeal(origin: string, destination: string, _bankName?: string, _cardType?: string) {
  void _bankName;
  void _cardType;
  return getBestForRoute(origin, destination);
}

export async function getFlightStatus(_flightNumber: string): Promise<FlightStatus | null> {
  void _flightNumber;
  return null;
}

export async function getAirportWeather(_iata: string) {
  void _iata;
  return null;
}

export async function liveFlights(_bounds?: { lamin: number; lamax: number; lomin: number; lomax: number }): Promise<{ flights: LiveFlight[] }> {
  void _bounds;
  return { flights: [] };
}

export async function getTrafficDaily(_params?: unknown) {
  void _params;
  return [];
}

export async function getTrafficSummary() {
  return null;
}

export async function createBookingLink(searchId: string, bookingToken: string) {
  const encodedSearch = encodeURIComponent(searchId);
  const encodedToken = bookingToken.split("/").map(encodeURIComponent).join("/");
  return requestJson(`/v1/flight_searches/${encodedSearch}/clicks/${encodedToken}.json`, z.object({
    url: z.string().url(),
    gate_id: z.union([z.string(), z.number()]).optional(),
    click_id: z.union([z.string(), z.number()]).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    method: z.string().optional(),
  }));
}

export async function subscribeAlert() {
  return null;
}

export async function getAlerts() {
  return [];
}

export async function deleteAlert() {
  return null;
}

export const travelpayoutsApi = {
  searchAirports,
  listAirlines,
  searchFares,
  faresCalendar,
  listCoupons,
  liveFlights,
  getFlightStatus,
  getBestDeal,
  getAirportWeather,
  aggregatorSearch,
  aggregatorBestDeal,
  multiCitySearch,
  listProviders,
  getProviderOffers,
  getDealsTrends,
  getNearbyAirportDeals,
  searchBankOffers,
  searchCoupons,
  getForecast,
  predictPrice,
  getBestTimeToBook,
  getTrendingRoutes,
  compareOta,
  compareAirline,
  getBankCombo,
  getBestForRoute,
  getTrafficDaily,
  getTrafficSummary,
  createBookingLink,
  subscribeAlert,
  getAlerts,
  deleteAlert,
};
