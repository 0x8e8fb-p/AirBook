import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
//  Base schemas (what AirAPI stores in Supabase / returns)
// ═══════════════════════════════════════════════════════════════

export const AirportSchema = z.object({
  iata: z.string().length(3),
  icao: z.string().length(4).optional().nullable(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  timezone: z.string().optional().nullable(),
});
export type Airport = z.infer<typeof AirportSchema>;

export const AirlineSchema = z.object({
  iata: z.string().length(2).or(z.string().length(3)),
  icao: z.string().length(3).optional().nullable(),
  name: z.string(),
  alias: z.string().optional().nullable(),
  callsign: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  active: z.boolean(),
});
export type Airline = z.infer<typeof AirlineSchema>;

export const FareSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  airline: z.string(),
  flightNumber: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  currency: z.literal("INR").default("INR"),
  departureDate: z.string(),
  returnDate: z.string().optional().nullable(),
  departureTime: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  durationMinutes: z.number().int().nonnegative().optional().nullable(),
  stops: z.number().int().nonnegative().optional().nullable(),
  sourceApi: z.string(),
  recordedAt: z.string(),
});
export type Fare = z.infer<typeof FareSchema>;

export const CalendarDaySchema = z.object({
  date: z.string(),
  cheapest: z.number().nonnegative().nullable(),
  currency: z.literal("INR").default("INR"),
});
export type CalendarDay = z.infer<typeof CalendarDaySchema>;

export const CouponSchema = z.object({
  code: z.string(),
  description: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED", "BOGO"]),
  discountValue: z.number().nonnegative(),
  maxDiscount: z.number().nonnegative().nullable(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  minSpend: z.number().nonnegative().nullable(),
  applicableAirlines: z.array(z.string()).default([]),
  applicableRoutes: z.array(z.string()).default([]),
  userSegment: z.enum(["NEW", "RETURNING", "ALL"]).default("ALL"),
  bankName: z.string().nullable(),
  cardType: z.string().nullable(),
  otaName: z.string().nullable(),
  currency: z.string().default("INR"),
  sourceSite: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  isVerified: z.boolean().default(false),
  successRate: z.number().min(0).max(100).nullable(),
});
export type Coupon = z.infer<typeof CouponSchema>;

export const LiveFlightSchema = z.object({
  icao24: z.string(),
  callsign: z.string().nullable(),
  originCountry: z.string().nullable(),
  longitude: z.number().nullable(),
  latitude: z.number().nullable(),
  baroAltitude: z.number().nullable(),
  onGround: z.boolean().nullable(),
  velocity: z.number().nullable(),
  trueTrack: z.number().nullable(),
  verticalRate: z.number().nullable(),
  updatedAt: z.string(),
});
export type LiveFlight = z.infer<typeof LiveFlightSchema>;

export const RouteSchema = z.object({
  airline: z.string(),
  sourceAirport: z.string().length(3),
  destinationAirport: z.string().length(3),
  stops: z.number().int().nonnegative(),
  equipment: z.string().nullable(),
});
export type Route = z.infer<typeof RouteSchema>;

export const SourceHealthSchema = z.object({
  source: z.string(),
  lastOk: z.string().nullable(),
  lastError: z.string().nullable(),
  lastErrorMsg: z.string().nullable(),
  failStreak: z.number().int().nonnegative(),
  circuitOpen: z.boolean(),
  updatedAt: z.string(),
});
export type SourceHealth = z.infer<typeof SourceHealthSchema>;

// ═══════════════════════════════════════════════════════════════
//  AirAPI response envelope (what every ok()/err() wrapped ep returns)
// ═══════════════════════════════════════════════════════════════

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.string().optional(),
});

export const ApiMetaSchema = z.object({
  cached: z.boolean().default(false),
  cache_ttl_seconds: z.number().default(0),
  data_source: z.string().default(""),
  api_version: z.string().default("2.1.0"),
  timestamp: z.string(),
  latency_ms: z.number().optional(),
});

export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_next: z.boolean(),
  has_prev: z.boolean(),
});
export type PaginationMeta = z.infer<typeof PaginationSchema>;

export function ApiEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    meta: ApiMetaSchema,
    error: z.union([z.null(), ApiErrorSchema]),
    pagination: PaginationSchema.optional(),
  });
}

// ═══════════════════════════════════════════════════════════════
//  Client-level response shapes (back-compat helpers)
// ═══════════════════════════════════════════════════════════════

export const AirportsResponseSchema = z.object({
  airports: z.array(AirportSchema),
});
export type AirportsResponse = z.infer<typeof AirportsResponseSchema>;

export const AirlinesResponseSchema = z.object({
  airlines: z.array(AirlineSchema),
});
export type AirlinesResponse = z.infer<typeof AirlinesResponseSchema>;

export const FaresResponseSchema = z.object({
  fares: z.array(FareSchema),
  cacheAgeSec: z.number().int().nonnegative().optional(),
});
export type FaresResponse = z.infer<typeof FaresResponseSchema>;

export const CalendarResponseSchema = z.object({
  days: z.array(CalendarDaySchema),
});
export type CalendarResponse = z.infer<typeof CalendarResponseSchema>;

export const CouponsResponseSchema = z.object({
  coupons: z.array(CouponSchema),
});
export type CouponsResponse = z.infer<typeof CouponsResponseSchema>;

export const LiveResponseSchema = z.object({
  flights: z.array(LiveFlightSchema),
});
export type LiveResponse = z.infer<typeof LiveResponseSchema>;

export const RoutesResponseSchema = z.object({
  routes: z.array(RouteSchema),
});
export type RoutesResponse = z.infer<typeof RoutesResponseSchema>;

export const HealthResponseSchema = z.object({
  sources: z.array(SourceHealthSchema),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

// ═══════════════════════════════════════════════════════════════
//  Request params
// ═══════════════════════════════════════════════════════════════

export interface SearchFaresParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  pax?: number;
  cabin?: CabinClass;
  fresh?: boolean;
}

export interface CalendarParams {
  from: string;
  to: string;
  month: string;
}

export interface CouponsParams {
  airline?: string;
  route?: string;
  bank?: string;
  minSpend?: number;
  userSegment?: "NEW" | "RETURNING" | "ALL";
}

export interface SearchAirportsParams {
  q: string;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════
//  NEW — Raw AirAPI endpoint response schemas (after envelope unwrap)
// ═══════════════════════════════════════════════════════════════

// ── /flights/status ─────────────────────────────────────────
export const FlightStatusSchema = z.object({
  flight_number: z.string(),
  callsign: z.string().nullable(),
  status: z.enum(["landed", "taxiing", "airborne", "unknown"]),
  position: z.object({
    lat: z.number().nullable(),
    lon: z.number().nullable(),
    altitude_m: z.number().nullable(),
  }),
  velocity_kmh: z.number(),
  origin_country: z.string().nullable(),
  on_ground: z.boolean(),
  true_track: z.number().nullable(),
  vertical_rate: z.number().nullable(),
  icao24: z.string().nullable(),
  last_contact: z.string().nullable(),
});
export type FlightStatus = z.infer<typeof FlightStatusSchema>;

// ── /flights/best-deal ──────────────────────────────────────
export const FlightBestDealSchema = z.object({
  route: z.string(),
  airline: z.string(),
  base_price: z.number(),
  convenience_fee: z.number(),
  lowest_effective_price: z.number(),
  savings: z.number(),
  platform: z.string().nullable(),
  confidence: z.string(),
  applied_coupon: z.any().nullable(),
  coupon_score: z.number().nullable(),
  ai_verdict: z.any().nullable(),
});
export type FlightBestDeal = z.infer<typeof FlightBestDealSchema>;

// ── /flights/calendar (raw) ────────────────────────────────
export const CalendarPriceEntrySchema = z.object({
  price: z.number(),
  airline: z.string(),
  source: z.string(),
  is_predicted: z.boolean().optional(),
});
export const CalendarRawSchema = z.object({
  route: z.string(),
  month: z.string(),
  prices: z.record(z.string(), CalendarPriceEntrySchema),
  cheapest_date: z.string().nullable(),
  cheapest_price: z.number().nullable(),
});
export type CalendarRaw = z.infer<typeof CalendarRawSchema>;

// ── /trends/forecast ────────────────────────────────────────
export const ForecastSchema = z.object({
  route: z.string(),
  median: z.number().nullable(),
  mean: z.number().nullable(),
  p25: z.number().nullable(),
  p75: z.number().nullable(),
  sample_size: z.number().nullable(),
  recommendation: z.string(),
  ml_predicted_price: z.number().optional().nullable(),
  ml_confidence: z.string().optional().nullable(),
  ml_model_age_days: z.number().optional().nullable(),
});
export type Forecast = z.infer<typeof ForecastSchema>;

// ── /intelligence/predict-price ────────────────────────────
export const PredictPriceSchema = z.object({
  route: z.string(),
  airline: z.string(),
  depart_date: z.string(),
  predicted_price: z.number().nullable(),
  confidence_low: z.number().nullable(),
  confidence_high: z.number().nullable(),
  currency: z.string(),
  recommendation: z.string(),
  model_version: z.string(),
  training_samples: z.number(),
});
export type PredictPrice = z.infer<typeof PredictPriceSchema>;

// ── /intelligence/best-time-to-book ─────────────────────────
export const BestTimeToBookSchema = z.object({
  route: z.string(),
  recommendation: z.string(),
  optimal_window_days: z.array(z.number()),
  price_trend: z.enum(["rising", "falling", "stable"]),
  cheapest_day_of_week: z.string(),
  cheapest_month: z.string(),
  analysis: z.record(z.string(), z.number().nullable()),
});
export type BestTimeToBook = z.infer<typeof BestTimeToBookSchema>;

// ── /routes/trending ───────────────────────────────────────
export const TrendingRoutesSchema = z.object({
  biggest_drops: z.array(z.object({
    route: z.string(),
    current_price: z.number(),
    week_avg: z.number(),
    drop_pct: z.number(),
  })),
  most_searched: z.array(z.object({
    route: z.string(),
    samples: z.number(),
  })),
  generated_at: z.string(),
});
export type TrendingRoutes = z.infer<typeof TrendingRoutesSchema>;

// ── /compare/ota ───────────────────────────────────────────
export const OtaComparisonSchema = z.object({
  route: z.string(),
  sources_count: z.number(),
  cheapest_source: z.string().nullable(),
  comparison: z.record(z.string(), z.object({
    count: z.number(),
    cheapest: z.number(),
    average: z.number(),
    most_recent: z.string(),
    airlines: z.array(z.string()),
    sample_fares: z.array(z.any()),
  })),
});
export type OtaComparison = z.infer<typeof OtaComparisonSchema>;

// ── /compare/airline ───────────────────────────────────────
export const AirlineComparisonSchema = z.object({
  route: z.string(),
  airlines_count: z.number(),
  ranked_airlines: z.array(z.object({
    airline: z.string(),
    count: z.number(),
    cheapest: z.number(),
    average: z.number(),
    sources: z.array(z.string()),
    most_recent: z.string(),
  })),
  comparison: z.record(z.string(), z.object({
    count: z.number(),
    cheapest: z.number(),
    average: z.number(),
    sources: z.array(z.string()),
    most_recent: z.string(),
  })),
});
export type AirlineComparison = z.infer<typeof AirlineComparisonSchema>;

// ── /compare/bank-combo ────────────────────────────────────
export const BankComboSchema = z.object({
  route: z.string(),
  best_combo: z.any().nullable(),
  all_combos: z.array(z.any()),
  bank_offers_available: z.number(),
});
export type BankCombo = z.infer<typeof BankComboSchema>;

// ── /nearby-airports ───────────────────────────────────────
export const NearbyAirportSchema = z.object({
  iata: z.string(),
  name: z.string().nullable(),
  city: z.string().nullable(),
  distance_km: z.number(),
  cheapest_fare: z.number().nullable(),
  example_route: z.string().nullable(),
  route_source: z.string().nullable(),
});
export const NearbyAirportsSchema = z.object({
  origin: z.string(),
  radius_km: z.number(),
  nearby: z.array(NearbyAirportSchema),
});
export type NearbyAirports = z.infer<typeof NearbyAirportsSchema>;

// ── /trends ────────────────────────────────────────────────
export const DealsTrendsSchema = z.object({
  top_cheapest_routes: z.array(z.any()),
  most_active_airlines: z.array(z.object({ airline: z.string(), samples: z.number() })),
});
export type DealsTrends = z.infer<typeof DealsTrendsSchema>;

// ── /bank-offers ───────────────────────────────────────────
export const BankOfferSchema = z.object({
  offer_id: z.string(),
  bank_name: z.string(),
  card_type: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  discount_type: z.string(),
  discount_value: z.number(),
  max_discount: z.number().nullable(),
  min_spend: z.number().nullable(),
  valid_until: z.string().nullable(),
  applicable_otas: z.array(z.string()).nullable(),
  applicable_airlines: z.array(z.string()).nullable(),
  source_url: z.string().nullable(),
});
export type BankOffer = z.infer<typeof BankOfferSchema>;

// ── /search/best-for-route ────────────────────────────────
export const BestForRouteSchema = z.object({
  route: z.string(),
  best_fare: z.any().nullable(),
  best_coupon: z.any().nullable(),
  best_bank_offer: z.any().nullable(),
  base_price: z.number(),
  total_savings: z.number(),
  effective_price: z.number(),
  other_fares: z.array(z.any()),
});
export type BestForRoute = z.infer<typeof BestForRouteSchema>;

// ── /aggregator/search-flights ─────────────────────────────
export const AggregatorFlightSchema = z.object({
  provider: z.string(),
  flight: z.object({
    airline: z.string(),
    airline_name: z.string(),
    flight_number: z.string(),
    departure: z.string(),
    departure_display: z.string(),
    arrival_display: z.string(),
    duration: z.string(),
    stops: z.number(),
    base_price: z.number(),
    price: z.number(),
    source_url: z.string(),
  }),
  priceDetails: z.object({
    best_price: z.number(),
    savings: z.number(),
    applied_offer: z.any().nullable(),
  }),
});
export const AggregatorSearchSchema = z.object({
  success: z.boolean(),
  query: z.any(),
  summary: z.any(),
  cheapestOption: AggregatorFlightSchema.nullable(),
  results: z.array(AggregatorFlightSchema),
  note: z.string().optional(),
});
export type AggregatorSearch = z.infer<typeof AggregatorSearchSchema>;
export type AggregatorFlight = z.infer<typeof AggregatorFlightSchema>;

// ── /aggregator/providers ────────────────────────────────
export const ProviderSchema = z.object({
  name: z.string(),
  display_name: z.string(),
  convenience_fee: z.number(),
  active: z.boolean(),
});
export const ProvidersSchema = z.object({
  providers: z.array(ProviderSchema),
});
export type Providers = z.infer<typeof ProvidersSchema>;

// ── /aggregator/best-deal ─────────────────────────────────
export const AggregatorBestDealSchema = z.object({
  route: z.string(),
  deal: z.any().nullable(),
  alternatives: z.array(z.any()),
  metadata: z.any(),
});
export type AggregatorBestDeal = z.infer<typeof AggregatorBestDealSchema>;

// ── /aggregator/multi-city ─────────────────────────────────
export const MultiCityLegSchema = z.object({
  from: z.string(),
  to: z.string(),
  date: z.string(),
  date_adjusted: z.boolean(),
  best_option: AggregatorFlightSchema.nullable(),
  options_count: z.number(),
});
export const MultiCitySchema = z.object({
  passengers: z.number(),
  legs: z.array(MultiCityLegSchema),
  total_combined_price: z.number().nullable(),
  currency: z.string(),
});
export type MultiCity = z.infer<typeof MultiCitySchema>;

// ── /domestic/airport detail ──────────────────────────────
export const DomesticAirportSchema = z.object({
  iata: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string().nullable(),
  country: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  tier: z.number().nullable(),
  popular: z.boolean().nullable(),
});

// ── /alerts ───────────────────────────────────────────────
export const AlertSchema = z.object({
  id: z.string(),
  source_airport: z.string(),
  destination_airport: z.string(),
  target_price: z.number(),
  expiry_date: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});
export type FareAlert = z.infer<typeof AlertSchema>;

export const AlertSubscribeSchema = z.object({
  id: z.string(),
  source_airport: z.string(),
  destination_airport: z.string(),
  target_price: z.number(),
  expiry_date: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});

// ── /analytics ────────────────────────────────────────────
export const RouteStatsSchema = z.object({
  route: z.string().optional(),
  avg_price: z.number().nullable(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),
  sample_count: z.number().nullable(),
  stat_date: z.string().nullable(),
});
export const AirlinePerfSchema = z.object({
  airline: z.string(),
  on_time_pct: z.number().nullable(),
  avg_delay_min: z.number().nullable(),
  cancellation_pct: z.number().nullable(),
});

// ── /traffic ──────────────────────────────────────────────
export const TrafficSummarySchema = z.record(z.string(), z.any());

// ── /airports/{iata}/weather ─────────────────────────────
export const AirportWeatherSchema = z.object({
  temperature_c: z.number().nullable(),
  wind_speed_kmh: z.number().nullable(),
  visibility_km: z.number().nullable(),
  condition: z.string().nullable(),
  raw_metar: z.string().nullable(),
});
export type AirportWeather = z.infer<typeof AirportWeatherSchema>;
