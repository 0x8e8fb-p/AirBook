// ============================================
// FareCracker — Zod Validators
// ============================================

import { z } from 'zod';

/** Airport IATA code (3 uppercase letters) */
export const iataCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Must be a valid 3-letter IATA code');

/** Date string in YYYY-MM-DD format */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

/** Passenger count validation */
export const passengerCountSchema = z.object({
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).max(8),
  infants: z.number().int().min(0).max(4),
}).refine(
  (data) => data.infants <= data.adults,
  { message: 'Number of infants cannot exceed number of adults' }
).refine(
  (data) => data.adults + data.children + data.infants <= 9,
  { message: 'Total passengers cannot exceed 9' }
);

/** Cabin class validation */
export const cabinClassSchema = z.enum(['economy', 'premium_economy', 'business', 'first']);

/** Full search params validation */
export const searchParamsSchema = z.object({
  origin: iataCodeSchema,
  destination: iataCodeSchema,
  departureDate: dateStringSchema,
  returnDate: dateStringSchema.optional(),
  passengers: passengerCountSchema,
  cabinClass: cabinClassSchema,
  flexibleDates: z.number().int().min(0).max(3).optional(),
}).refine(
  (data) => data.origin !== data.destination,
  { message: 'Origin and destination must be different' }
).refine(
  (data) => {
    const depDate = new Date(data.departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return depDate >= today;
  },
  { message: 'Departure date must be today or in the future' }
).refine(
  (data) => {
    if (!data.returnDate) return true;
    return new Date(data.returnDate) >= new Date(data.departureDate);
  },
  { message: 'Return date must be on or after departure date' }
);

/** Airport search query */
export const airportSearchSchema = z.object({
  q: z.string().min(1).max(50),
  limit: z.number().int().min(1).max(20).optional().default(8),
});

/** Calendar request */
export const calendarRequestSchema = z.object({
  origin: iataCodeSchema,
  destination: iataCodeSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2027),
  cabinClass: cabinClassSchema.optional().default('economy'),
});

export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type AirportSearchInput = z.infer<typeof airportSearchSchema>;
export type CalendarRequestInput = z.infer<typeof calendarRequestSchema>;
