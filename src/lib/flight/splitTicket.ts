import { airApi, AirApiConfigError, AirApiError } from "@/lib/api/airApiClient";
import type { Fare } from "@/lib/api/airApiTypes";

const HUB_CANDIDATES = ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU"];
const MIN_LAYOVER_MIN = 90;
const MAX_LAYOVER_MIN = 360;
const SAVINGS_THRESHOLD = 0.08; // 8% cheaper than direct to show

export interface SplitTicketSuggestion {
  hub: string;
  leg1: Fare;
  leg2: Fare;
  totalPrice: number;
  directPrice: number;
  savings: number;
  savingsPct: number;
  layoverMinutes: number;
}

function cheapestFare(fares: Fare[]): Fare | null {
  if (fares.length === 0) return null;
  return fares.reduce((cheapest, f) => (f.price > 0 && f.price < cheapest.price ? f : cheapest), fares[0]);
}

function isoDateTime(date: string, hhmm?: string | null): Date | null {
  const t = hhmm ?? "00:00";
  const d = new Date(`${date}T${t.length === 5 ? t : "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function findSplitTickets(
  origin: string,
  destination: string,
  date: string,
): Promise<SplitTicketSuggestion[]> {
  if (origin === destination) return [];

  try {
    const direct = await airApi.searchFares({ from: origin, to: destination, date });
    const directFare = cheapestFare(direct.fares);
    if (!directFare) return [];

    const directPrice = directFare.price;
    const hubs = HUB_CANDIDATES.filter((h) => h !== origin && h !== destination);

    const legPairs = await Promise.all(
      hubs.map(async (hub) => {
        try {
          const [leg1Res, leg2Res] = await Promise.all([
            airApi.searchFares({ from: origin, to: hub, date }),
            airApi.searchFares({ from: hub, to: destination, date }),
          ]);
          return { hub, leg1: cheapestFare(leg1Res.fares), leg2: cheapestFare(leg2Res.fares) };
        } catch {
          return { hub, leg1: null as Fare | null, leg2: null as Fare | null };
        }
      }),
    );

    const suggestions: SplitTicketSuggestion[] = [];
    for (const { hub, leg1, leg2 } of legPairs) {
      if (!leg1 || !leg2) continue;
      const total = leg1.price + leg2.price;
      if (total >= directPrice * (1 - SAVINGS_THRESHOLD)) continue;

      const arr1 = isoDateTime(leg1.departureDate, leg1.arrivalTime);
      const dep2 = isoDateTime(leg2.departureDate, leg2.departureTime);
      let layover = MIN_LAYOVER_MIN + 1;
      if (arr1 && dep2) {
        layover = Math.round((dep2.getTime() - arr1.getTime()) / 60_000);
      }
      if (layover < MIN_LAYOVER_MIN || layover > MAX_LAYOVER_MIN) continue;

      suggestions.push({
        hub,
        leg1,
        leg2,
        totalPrice: total,
        directPrice,
        savings: directPrice - total,
        savingsPct: (directPrice - total) / directPrice,
        layoverMinutes: layover,
      });
    }

    suggestions.sort((a, b) => b.savings - a.savings);
    return suggestions.slice(0, 3);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) return [];
    console.error("findSplitTickets failed:", err);
    return [];
  }
}

export interface HiddenCitySuggestion {
  throughDestination: string;
  fare: Fare;
  directPrice: number;
  savings: number;
  savingsPct: number;
}

/**
 * Hidden-city: user wants A→B. Find fares A→C (C further than B) that route through B.
 * If A→C is cheaper than A→B direct, passenger can book A→C and disembark at B.
 * Legal gray zone in many jurisdictions — UI must warn.
 */
export async function findHiddenCityOpportunities(
  origin: string,
  destination: string,
  date: string,
): Promise<HiddenCitySuggestion[]> {
  if (origin === destination) return [];

  try {
    const direct = await airApi.searchFares({ from: origin, to: destination, date });
    const directFare = cheapestFare(direct.fares);
    if (!directFare) return [];

    const directPrice = directFare.price;
    const throughCandidates = HUB_CANDIDATES.filter((h) => h !== origin && h !== destination);

    const probes = await Promise.all(
      throughCandidates.map(async (city) => {
        try {
          const { fares } = await airApi.searchFares({ from: origin, to: city, date });
          const candidate = fares.find((f) => {
            if (f.price <= 0) return false;
            if ((f.stops ?? 0) === 0) return false;
            return f.price < directPrice * (1 - SAVINGS_THRESHOLD);
          });
          return candidate ? { city, fare: candidate } : null;
        } catch {
          return null;
        }
      }),
    );

    const suggestions: HiddenCitySuggestion[] = [];
    for (const probe of probes) {
      if (!probe) continue;
      suggestions.push({
        throughDestination: probe.city,
        fare: probe.fare,
        directPrice,
        savings: directPrice - probe.fare.price,
        savingsPct: (directPrice - probe.fare.price) / directPrice,
      });
    }

    suggestions.sort((a, b) => b.savings - a.savings);
    return suggestions.slice(0, 2);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) return [];
    console.error("findHiddenCityOpportunities failed:", err);
    return [];
  }
}
