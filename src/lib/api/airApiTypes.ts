import { z } from "zod";

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

export const FaresResponseSchema = z.object({
  fares: z.array(FareSchema),
  cacheAgeSec: z.number().int().nonnegative().optional(),
});
export type FaresResponse = z.infer<typeof FaresResponseSchema>;

export const AirportsResponseSchema = z.object({
  airports: z.array(AirportSchema),
});
export type AirportsResponse = z.infer<typeof AirportsResponseSchema>;

export const AirlinesResponseSchema = z.object({
  airlines: z.array(AirlineSchema),
});
export type AirlinesResponse = z.infer<typeof AirlinesResponseSchema>;

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
