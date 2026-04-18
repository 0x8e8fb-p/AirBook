import { describe, it, expect, beforeEach, vi } from "vitest";

const findUnique = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    flightRoute: { findUnique: (...a: unknown[]) => findUnique(...a) },
    priceHistory: { findMany: (...a: unknown[]) => findMany(...a) },
  },
}));

beforeEach(() => {
  findUnique.mockReset();
  findMany.mockReset();
});

function mkRow(price: number, daysAgo: number) {
  return {
    effectivePrice: price,
    recordedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  };
}

describe("analyzePriceTrend", () => {
  it("returns INSUFFICIENT_DATA when route missing", async () => {
    findUnique.mockResolvedValue(null);
    const { analyzePriceTrend } = await import("./priceTrend");
    const r = await analyzePriceTrend("DEL", "BOM", "2026-05-10");
    expect(r.verdict).toBe("INSUFFICIENT_DATA");
  });

  it("returns INSUFFICIENT_DATA when fewer than 3 rows", async () => {
    findUnique.mockResolvedValue({ id: "r1" });
    findMany.mockResolvedValue([mkRow(5000, 1), mkRow(5100, 2)]);
    const { analyzePriceTrend } = await import("./priceTrend");
    const r = await analyzePriceTrend("DEL", "BOM", "2026-05-10");
    expect(r.verdict).toBe("INSUFFICIENT_DATA");
    expect(r.sampleCount).toBe(0);
  });

  it("classifies DROP_LIKELY when current low is 5%+ below 30d avg and 7d avg trending down", async () => {
    findUnique.mockResolvedValue({ id: "r1" });
    findMany.mockResolvedValue([
      mkRow(6000, 25),
      mkRow(6200, 22),
      mkRow(6100, 20),
      mkRow(6000, 18),
      mkRow(5500, 5),
      mkRow(5400, 3),
      mkRow(5200, 1),
    ]);
    const { analyzePriceTrend } = await import("./priceTrend");
    const r = await analyzePriceTrend("DEL", "BOM", "2026-05-10");
    expect(r.verdict).toBe("DROP_LIKELY");
    expect(r.currentLow).toBe(5200);
  });

  it("classifies RISING when current low is 8%+ above 30d avg and 7d climbing", async () => {
    findUnique.mockResolvedValue({ id: "r1" });
    findMany.mockResolvedValue([
      mkRow(5000, 25),
      mkRow(5100, 22),
      mkRow(5000, 20),
      mkRow(5100, 18),
      mkRow(5500, 5),
      mkRow(5700, 3),
      mkRow(5800, 1),
    ]);
    const { analyzePriceTrend } = await import("./priceTrend");
    const r = await analyzePriceTrend("DEL", "BOM", "2026-05-10");
    expect(r.verdict).toBe("RISING");
  });

  it("classifies STABLE when within normal band", async () => {
    findUnique.mockResolvedValue({ id: "r1" });
    findMany.mockResolvedValue([
      mkRow(5000, 25),
      mkRow(5100, 20),
      mkRow(5050, 15),
      mkRow(5020, 10),
      mkRow(5080, 5),
      mkRow(5030, 1),
    ]);
    const { analyzePriceTrend } = await import("./priceTrend");
    const r = await analyzePriceTrend("DEL", "BOM", "2026-05-10");
    expect(r.verdict).toBe("STABLE");
  });
});
