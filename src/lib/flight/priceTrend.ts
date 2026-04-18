import { prisma } from "@/lib/prisma";

export type TrendVerdict = "DROP_LIKELY" | "RISING" | "STABLE" | "INSUFFICIENT_DATA";

export interface TrendResult {
  verdict: TrendVerdict;
  currentLow: number | null;
  avg7d: number | null;
  avg30d: number | null;
  sampleCount: number;
  confidence: "high" | "medium" | "low";
  message: string;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

/** Analyze PriceHistory rows for a route+departureDate and classify direction. */
export async function analyzePriceTrend(
  origin: string,
  destination: string,
  departureDate: string,
): Promise<TrendResult> {
  const depDate = new Date(departureDate);
  if (Number.isNaN(depDate.getTime())) {
    return empty("INSUFFICIENT_DATA", "Invalid date");
  }

  const route = await prisma.flightRoute.findUnique({
    where: { origin_destination: { origin, destination } },
  });
  if (!route) return empty("INSUFFICIENT_DATA", "No price history yet for this route");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const history = await prisma.priceHistory.findMany({
    where: {
      routeId: route.id,
      departureDate: {
        gte: new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate()),
        lt: new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate() + 1),
      },
      recordedAt: { gte: thirtyDaysAgo },
      basePrice: { gt: 0 },
    },
    orderBy: { recordedAt: "asc" },
    select: { effectivePrice: true, recordedAt: true },
  });

  if (history.length < 3) {
    return empty("INSUFFICIENT_DATA", `Only ${history.length} data point${history.length === 1 ? "" : "s"} so far`);
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = history.filter((r) => r.recordedAt.getTime() >= sevenDaysAgo);

  const avg30d = average(history.map((r) => r.effectivePrice));
  const avg7d = average(recent.map((r) => r.effectivePrice));
  const currentLow = history[history.length - 1]?.effectivePrice ?? null;

  if (avg30d === null || avg7d === null || currentLow === null) {
    return empty("INSUFFICIENT_DATA", "Price data incomplete");
  }

  const confidence: TrendResult["confidence"] =
    history.length >= 20 ? "high" : history.length >= 8 ? "medium" : "low";

  const dropThreshold = 0.03;
  const pctVs30d = (currentLow - avg30d) / avg30d;
  const pct7dVs30d = (avg7d - avg30d) / avg30d;

  if (currentLow <= avg30d * (1 - dropThreshold) && pct7dVs30d < 0) {
    return {
      verdict: "DROP_LIKELY",
      currentLow,
      avg7d,
      avg30d,
      sampleCount: history.length,
      confidence,
      message: `Price is ${Math.round(Math.abs(pctVs30d) * 100)}% below the 30-day average — watch for further drops`,
    };
  }

  if (currentLow >= avg30d * 1.08 && pct7dVs30d > 0.03) {
    return {
      verdict: "RISING",
      currentLow,
      avg7d,
      avg30d,
      sampleCount: history.length,
      confidence,
      message: `Price up ${Math.round(pctVs30d * 100)}% vs 30-day average — book now before it climbs further`,
    };
  }

  return {
    verdict: "STABLE",
    currentLow,
    avg7d,
    avg30d,
    sampleCount: history.length,
    confidence,
    message: "Price is holding steady around the 30-day average",
  };
}

function empty(verdict: TrendVerdict, message: string): TrendResult {
  return {
    verdict,
    currentLow: null,
    avg7d: null,
    avg30d: null,
    sampleCount: 0,
    confidence: "low",
    message,
  };
}
