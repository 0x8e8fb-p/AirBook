// ============================================
// AirBook — Zod Validators
// ============================================

import { z } from 'zod';

const iataCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Must be a valid 3-letter IATA code');

const cabinClassSchema = z.enum(['economy', 'premium_economy', 'business', 'first']);

/** Calendar request */
export const calendarRequestSchema = z.object({
  origin: iataCodeSchema,
  destination: iataCodeSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2035),
  cabinClass: cabinClassSchema.optional().default('economy'),
});
