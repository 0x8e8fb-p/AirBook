// ─── Simulated Flight Provider ─────────────────────────────────────
// Generates realistic flight data based on real airline schedules
// and route patterns. Activated when live API providers are unavailable.
// Uses real flight numbers, realistic durations, and market-appropriate
// pricing for both domestic (India) and international routes.
// ──────────────────────────────────────────────────────────────────

import type { CabinClass } from "@/lib/types";
import type { FlightProvider, FlightSearchParams, RawFlightOffer } from "./flight-data-provider";

// ── Real airline schedules for popular India routes ─────────────────

interface RouteSchedule {
  airline: string;
  flightNumber: string;
  depHour: number;
  depMin: number;
  durationMinutes: number;
  stops: number;
  stopAirport?: string;
}

type RouteKey = string; // "ORIGIN-DESTINATION"

const REAL_SCHEDULES: Record<RouteKey, RouteSchedule[]> = {
  // ── Delhi (DEL) routes ──
  "DEL-BOM": [
    { airline: "6E", flightNumber: "6E-5213", depHour: 6, depMin: 30, durationMinutes: 130, stops: 0 },
    { airline: "AI", flightNumber: "AI-865", depHour: 7, depMin: 0, durationMinutes: 125, stops: 0 },
    { airline: "UK", flightNumber: "UK-981", depHour: 8, depMin: 15, durationMinutes: 120, stops: 0 },
    { airline: "6E", flightNumber: "6E-2301", depHour: 9, depMin: 45, durationMinutes: 135, stops: 0 },
    { airline: "SG", flightNumber: "SG-8157", depHour: 11, depMin: 30, durationMinutes: 145, stops: 0 },
    { airline: "AI", flightNumber: "AI-807", depHour: 14, depMin: 0, durationMinutes: 120, stops: 0 },
    { airline: "6E", flightNumber: "6E-5215", depHour: 16, depMin: 30, durationMinutes: 130, stops: 0 },
    { airline: "UK", flightNumber: "UK-995", depHour: 18, depMin: 0, durationMinutes: 125, stops: 0 },
    { airline: "6E", flightNumber: "6E-5382", depHour: 20, depMin: 30, durationMinutes: 135, stops: 0 },
    { airline: "SG", flightNumber: "SG-8163", depHour: 22, depMin: 0, durationMinutes: 140, stops: 0 },
  ],
  "DEL-BLR": [
    { airline: "6E", flightNumber: "6E-6401", depHour: 5, depMin: 45, durationMinutes: 165, stops: 0 },
    { airline: "AI", flightNumber: "AI-502", depHour: 7, depMin: 30, durationMinutes: 155, stops: 0 },
    { airline: "UK", flightNumber: "UK-811", depHour: 9, depMin: 0, durationMinutes: 160, stops: 0 },
    { airline: "6E", flightNumber: "6E-2153", depHour: 11, depMin: 15, durationMinutes: 170, stops: 0 },
    { airline: "SG", flightNumber: "SG-513", depHour: 14, depMin: 30, durationMinutes: 165, stops: 0 },
    { airline: "AI", flightNumber: "AI-805", depHour: 16, depMin: 45, durationMinutes: 155, stops: 0 },
    { airline: "6E", flightNumber: "6E-6405", depHour: 19, depMin: 0, durationMinutes: 170, stops: 0 },
    { airline: "QP", flightNumber: "QP-1328", depHour: 21, depMin: 30, durationMinutes: 160, stops: 0 },
  ],
  "DEL-CCU": [
    { airline: "6E", flightNumber: "6E-2014", depHour: 6, depMin: 0, durationMinutes: 150, stops: 0 },
    { airline: "AI", flightNumber: "AI-401", depHour: 8, depMin: 30, durationMinutes: 145, stops: 0 },
    { airline: "SG", flightNumber: "SG-263", depHour: 11, depMin: 45, durationMinutes: 155, stops: 0 },
    { airline: "6E", flightNumber: "6E-6512", depHour: 14, depMin: 15, durationMinutes: 150, stops: 0 },
    { airline: "AI", flightNumber: "AI-763", depHour: 17, depMin: 30, durationMinutes: 145, stops: 0 },
    { airline: "6E", flightNumber: "6E-2018", depHour: 20, depMin: 0, durationMinutes: 155, stops: 0 },
  ],
  "DEL-HYD": [
    { airline: "6E", flightNumber: "6E-5601", depHour: 6, depMin: 30, durationMinutes: 140, stops: 0 },
    { airline: "AI", flightNumber: "AI-544", depHour: 9, depMin: 0, durationMinutes: 135, stops: 0 },
    { airline: "UK", flightNumber: "UK-879", depHour: 12, depMin: 15, durationMinutes: 140, stops: 0 },
    { airline: "6E", flightNumber: "6E-5605", depHour: 15, depMin: 45, durationMinutes: 145, stops: 0 },
    { airline: "SG", flightNumber: "SG-716", depHour: 18, depMin: 30, durationMinutes: 140, stops: 0 },
  ],
  "DEL-MAA": [
    { airline: "6E", flightNumber: "6E-5412", depHour: 5, depMin: 30, durationMinutes: 175, stops: 0 },
    { airline: "AI", flightNumber: "AI-439", depHour: 8, depMin: 0, durationMinutes: 170, stops: 0 },
    { airline: "SG", flightNumber: "SG-305", depHour: 13, depMin: 15, durationMinutes: 180, stops: 0 },
    { airline: "6E", flightNumber: "6E-2715", depHour: 17, depMin: 45, durationMinutes: 175, stops: 0 },
  ],
  "DEL-GOI": [
    { airline: "6E", flightNumber: "6E-5102", depHour: 7, depMin: 0, durationMinutes: 160, stops: 0 },
    { airline: "AI", flightNumber: "AI-657", depHour: 11, depMin: 30, durationMinutes: 155, stops: 0 },
    { airline: "SG", flightNumber: "SG-287", depHour: 14, depMin: 45, durationMinutes: 165, stops: 0 },
    { airline: "6E", flightNumber: "6E-2307", depHour: 18, depMin: 0, durationMinutes: 160, stops: 0 },
  ],

  // ── Mumbai (BOM) routes ──
  "BOM-DEL": [
    { airline: "6E", flightNumber: "6E-5214", depHour: 7, depMin: 0, durationMinutes: 130, stops: 0 },
    { airline: "AI", flightNumber: "AI-866", depHour: 8, depMin: 30, durationMinutes: 125, stops: 0 },
    { airline: "UK", flightNumber: "UK-982", depHour: 10, depMin: 0, durationMinutes: 120, stops: 0 },
    { airline: "6E", flightNumber: "6E-2302", depHour: 13, depMin: 15, durationMinutes: 135, stops: 0 },
    { airline: "AI", flightNumber: "AI-808", depHour: 16, depMin: 30, durationMinutes: 120, stops: 0 },
    { airline: "6E", flightNumber: "6E-5383", depHour: 19, depMin: 0, durationMinutes: 130, stops: 0 },
    { airline: "SG", flightNumber: "SG-8158", depHour: 21, depMin: 30, durationMinutes: 140, stops: 0 },
  ],
  "BOM-BLR": [
    { airline: "6E", flightNumber: "6E-5095", depHour: 6, depMin: 15, durationMinutes: 100, stops: 0 },
    { airline: "AI", flightNumber: "AI-604", depHour: 8, depMin: 45, durationMinutes: 95, stops: 0 },
    { airline: "UK", flightNumber: "UK-851", depHour: 11, depMin: 0, durationMinutes: 100, stops: 0 },
    { airline: "6E", flightNumber: "6E-5372", depHour: 14, depMin: 30, durationMinutes: 100, stops: 0 },
    { airline: "SG", flightNumber: "SG-435", depHour: 17, depMin: 15, durationMinutes: 105, stops: 0 },
    { airline: "6E", flightNumber: "6E-5097", depHour: 20, depMin: 0, durationMinutes: 100, stops: 0 },
  ],
  "BOM-GOI": [
    { airline: "6E", flightNumber: "6E-6171", depHour: 7, depMin: 30, durationMinutes: 65, stops: 0 },
    { airline: "AI", flightNumber: "AI-685", depHour: 10, depMin: 0, durationMinutes: 60, stops: 0 },
    { airline: "SG", flightNumber: "SG-401", depHour: 13, depMin: 45, durationMinutes: 70, stops: 0 },
    { airline: "6E", flightNumber: "6E-5283", depHour: 16, depMin: 15, durationMinutes: 65, stops: 0 },
    { airline: "UK", flightNumber: "UK-751", depHour: 19, depMin: 0, durationMinutes: 60, stops: 0 },
  ],
};

// ── Seasonal price factors (multiplier applied to base price) ──────

function getSeasonalPriceFactor(dateString: string, route: string): number {
  const date = new Date(dateString);
  const month = date.getMonth(); // 0 = Jan
  const dayOfWeek = date.getDay(); // 0 = Sun

  // Domestic price seasonality
  const isInternational = ["DXB", "SIN", "BKK", "LHR", "JFK", "CDG", "SYD"].some(
    (code) => route.includes(code),
  );

  // Summer holidays (May-June)
  if (month === 4 || month === 5) return isInternational ? 1.35 : 1.25;
  // Diwali season (Oct-Nov)
  if (month === 9 || month === 10) return isInternational ? 1.2 : 1.3;
  // Christmas/New Year (Dec)
  if (month === 11) return isInternational ? 1.5 : 1.4;
  // Weekend premium
  if (dayOfWeek === 5 || dayOfWeek === 6) return 1.15;
  // Mid-week discount
  if (dayOfWeek === 2 || dayOfWeek === 3) return 0.88;
  // Monsoon (July-Aug) - slight discount
  if (month === 6 || month === 7) return 0.92;

  return 1.0;
}

function getBasePriceForRoute(origin: string, destination: string, stops: number): number {
  const routeKey = `${origin}-${destination}`;
  const isInternational = ["DXB", "SIN", "BKK", "LHR", "JFK", "CDG", "SYD"].some(
    (code) => routeKey.includes(code),
  );

  if (isInternational) {
    // International pricing in INR
    if (routeKey.includes("LHR") || routeKey.includes("JFK")) return stops > 0 ? 42000 : 55000;
    if (routeKey.includes("SIN")) return stops > 0 ? 15000 : 22000;
    if (routeKey.includes("BKK")) return stops > 0 ? 11000 : 16000;
    return stops > 0 ? 10000 : 15000; // DXB, others
  }

  // Domestic pricing in INR
  const distanceMap: Record<string, number> = {
    "DEL-BOM": 5200,
    "BOM-DEL": 5200,
    "DEL-BLR": 6200,
    "BLR-DEL": 6200,
    "DEL-CCU": 5500,
    "CCU-DEL": 5500,
    "DEL-HYD": 4800,
    "HYD-DEL": 4800,
    "DEL-MAA": 6800,
    "MAA-DEL": 6800,
    "BOM-BLR": 3500,
    "BLR-BOM": 3500,
    "BOM-CCU": 6000,
    "CCU-BOM": 6000,
    "BOM-GOI": 2800,
    "GOI-BOM": 2800,
    "DEL-GOI": 5800,
    "GOI-DEL": 5800,
    "BLR-MAA": 1600,
    "MAA-BLR": 1600,
    "BLR-GOI": 2200,
    "BLR-HYD": 1800,
    "HYD-BLR": 1800,
    "MAA-BOM": 4200,
    "BOM-MAA": 4200,
  };

  return distanceMap[routeKey] || 4500;
}

function adjustForCabin(basePrice: number, cabin: CabinClass): number {
  switch (cabin) {
    case "premium_economy":
      return basePrice * 1.5;
    case "business":
      return basePrice * 2.8;
    case "first":
      return basePrice * 5.5;
    default:
      return basePrice;
  }
}

// ── Simulated Provider ──────────────────────────────────────────────

class SimulatedProvider implements FlightProvider {
  readonly name = "simulated" as const;

  // Always available. This is the no-paid-API tool's last-resort
  // flight source, intentionally with no env gate. Dedupe in the
  // orchestrator already ranks live providers above it.
  isAvailable(): boolean {
    return true;
  }

  async search(params: FlightSearchParams): Promise<RawFlightOffer[]> {
    try {
      return this.generateOffers(params);
    } catch (err) {
      console.warn("[simulated] generation failed, returning minimum fallback:", err);
      return this.minimumFallback(params);
    }
  }

  private generateOffers(params: FlightSearchParams): RawFlightOffer[] {
    const origin = params.origin.toUpperCase();
    const destination = params.destination.toUpperCase();
    const routeKey = `${origin}-${destination}`;
    const reverseRouteKey = `${destination}-${origin}`;

    // Try exact route, then reverse route (most airlines fly both ways)
    let schedules = REAL_SCHEDULES[routeKey];

    if (!schedules) {
      // Check reverse route and mirror it with adjusted times
      const reverseSchedules = REAL_SCHEDULES[reverseRouteKey];
      if (reverseSchedules) {
        schedules = reverseSchedules.map((s) => ({
          ...s,
          depHour: (s.depHour + Math.floor((s.durationMinutes + 60) / 60) + 1) % 24,
        }));
      }
    }

    // If no schedule exists, generate generic ones
    if (!schedules || schedules.length === 0) {
      schedules = this.generateGenericSchedules(origin, destination);
    }

    const cabin = params.cabin || "economy";
    const basePrice = getBasePriceForRoute(origin, destination, 0);

    const offers: RawFlightOffer[] = schedules.map((schedule, index) => {
      const seasonalFactor = getSeasonalPriceFactor(params.date, routeKey);
      const airlineFactor = this.getAirlinePriceFactor(schedule.airline);
      const rawPrice = Math.round(basePrice * seasonalFactor * airlineFactor);
      const cabinPrice = Math.round(adjustForCabin(rawPrice, cabin));

      // Add slight random variation (±8%)
      const randomVariation = 0.92 + Math.random() * 0.16;
      const finalPrice = Math.round(cabinPrice * randomVariation);

      const depHour = schedule.depHour;
      const depMin = schedule.depMin;
      const durationMin = schedule.durationMinutes;

      const depDate = new Date(params.date);
      depDate.setHours(depHour, depMin, 0, 0);

      const arrDate = new Date(depDate.getTime() + durationMin * 60 * 1000);

      const formatDate = (d: Date) => d.toISOString().replace(".000Z", "");

      return {
        id: `sim-${schedule.airline}-${schedule.flightNumber}-${params.date}-${index}`,
        provider: "simulated",
        source: "master_api",
        airline: schedule.airline,
        flightNumber: schedule.flightNumber,
        origin,
        destination,
        departureTime: formatDate(depDate),
        arrivalTime: formatDate(arrDate),
        durationMinutes: durationMin,
        stops: schedule.stops,
        stopCities: schedule.stopAirport ? [schedule.stopAirport] : [],
        price: finalPrice,
        currency: "INR",
        cabinClass: cabin,
        baggage: {
          cabin: { included: true, weight: 7 },
          checked: {
            included: true,
            weight: cabin === "business" || cabin === "first" ? 30 : 15,
          },
        },
        refundable: schedule.stops === 0,
        seatsRemaining: Math.floor(Math.random() * 15) + 1,
        bookingUrl: null,
        deepLink: null,
        bookingToken: null,
        searchId: null,
        gateId: null,
        availabilityState: "reference_only",
        dataFreshness: "unknown",
        confidence: "low",
        baggageConfirmed: false,
        refundabilityConfirmed: false,
      };
    });

    return offers;
  }

  private getAirlinePriceFactor(airline: string): number {
    // Full-service carriers are pricier than LCCs
    const budgetCarriers = ["6E", "SG", "G8", "I5", "QP", "IX", "AK", "FD", "TR", "FZ", "G9"];
    const fullService = ["AI", "UK", "EK", "QR", "SQ", "BA", "LH", "CX", "EY"];
    
    if (budgetCarriers.includes(airline)) return 0.82;
    if (fullService.includes(airline)) return 1.15;
    return 1.0;
  }

  private generateGenericSchedules(origin: string, destination: string): RouteSchedule[] {
    // Generate realistic schedules for unlisted routes
    const isInternational = ["DXB", "SIN", "BKK", "LHR"].some(
      (code) => destination.includes(code) || origin.includes(code),
    );

    const durationMin = isInternational ? 180 + Math.floor(Math.random() * 300) : 60 + Math.floor(Math.random() * 120);
    const airlines = isInternational
      ? ["AI", "6E", "EK", "SG"]
      : ["6E", "AI", "SG", "UK"];

    return Array.from({ length: 4 + Math.floor(Math.random() * 3) }, (_, i) => ({
      airline: airlines[i % airlines.length],
      flightNumber: `${airlines[i % airlines.length]}-${100 + Math.floor(Math.random() * 9000)}`,
      depHour: (6 + i * 4) % 24,
      depMin: [0, 15, 30, 45][Math.floor(Math.random() * 4)],
      durationMinutes: durationMin + Math.floor(Math.random() * 30),
      stops: Math.random() > 0.7 ? 1 : 0,
    }));
  }

  // Absolute floor: if everything else throws, return 4 plausible
  // offers so the UI never gets an empty array.
  private minimumFallback(params: FlightSearchParams): RawFlightOffer[] {
    const origin = params.origin.toUpperCase();
    const destination = params.destination.toUpperCase();
    const cabin = (params.cabin || "economy") as CabinClass;
    const baseTimes = [
      { hour: 7, min: 0 },
      { hour: 11, min: 30 },
      { hour: 16, min: 0 },
      { hour: 20, min: 30 },
    ];
    const airlines = ["6E", "AI", "UK", "SG"];

    return baseTimes.map((t, i) => {
      const depDate = new Date(params.date);
      depDate.setHours(t.hour, t.min, 0, 0);
      const durationMin = 120 + i * 10;
      const arrDate = new Date(depDate.getTime() + durationMin * 60 * 1000);
      const formatDate = (d: Date) => d.toISOString().replace(".000Z", "");
      const airline = airlines[i];
      const flightNumber = `${airline}-${1000 + i * 13}`;
      return {
        id: `sim-fallback-${airline}-${flightNumber}-${params.date}-${i}`,
        provider: "simulated",
        source: "master_api",
        airline,
        flightNumber,
        origin,
        destination,
        departureTime: formatDate(depDate),
        arrivalTime: formatDate(arrDate),
        durationMinutes: durationMin,
        stops: 0,
        stopCities: [],
        price: 5500 + i * 400,
        currency: "INR",
        cabinClass: cabin,
        baggage: {
          cabin: { included: true, weight: 7 },
          checked: { included: true, weight: 15 },
        },
        refundable: false,
        seatsRemaining: 9 - i,
        bookingUrl: null,
        deepLink: null,
        bookingToken: null,
        searchId: null,
        gateId: null,
        availabilityState: "reference_only",
        dataFreshness: "unknown",
        confidence: "low",
        baggageConfirmed: false,
        refundabilityConfirmed: false,
      } satisfies RawFlightOffer;
    });
  }
}

export const simulatedProvider = new SimulatedProvider();
