import { describe, it, expect, beforeEach, vi } from "vitest";

const searchFares = vi.fn();

vi.mock("@/lib/api/travelpayoutsClient", () => ({
  travelpayoutsApi: {
    searchFares: (...a: unknown[]) => searchFares(...a),
  },
  TravelpayoutsConfigError: class TravelpayoutsConfigError extends Error {},
  TravelpayoutsError: class TravelpayoutsError extends Error {
    status = 500;
  },
}));

beforeEach(() => {
  searchFares.mockReset();
});

function mkFare(overrides: Partial<{ from: string; to: string; price: number; dep: string; arr: string; stops: number; airline: string; flightNumber: string }>) {
  return {
    from: overrides.from ?? "DEL",
    to: overrides.to ?? "BOM",
    airline: overrides.airline ?? "6E",
    flightNumber: overrides.flightNumber ?? "123",
    price: overrides.price ?? 5000,
    currency: "INR" as const,
    departureDate: "2026-05-10",
    returnDate: null,
    departureTime: overrides.dep ?? "08:00",
    arrivalTime: overrides.arr ?? "10:00",
    durationMinutes: 120,
    stops: overrides.stops ?? 0,
    sourceApi: "test",
    recordedAt: "2026-04-18T00:00:00Z",
  };
}

describe("findSplitTickets", () => {
  it("returns empty when origin equals destination", async () => {
    const { findSplitTickets } = await import("./splitTicket");
    const r = await findSplitTickets("DEL", "DEL", "2026-05-10");
    expect(r).toEqual([]);
    expect(searchFares).not.toHaveBeenCalled();
  });

  it("returns empty when no direct fare found", async () => {
    searchFares.mockResolvedValue({ fares: [] });
    const { findSplitTickets } = await import("./splitTicket");
    const r = await findSplitTickets("DEL", "BOM", "2026-05-10");
    expect(r).toEqual([]);
  });

  it("finds split via hub when cheaper than direct", async () => {
    searchFares.mockImplementation(async ({ from, to }: { from: string; to: string }) => {
      if (from === "DEL" && to === "BOM") {
        return { fares: [mkFare({ from: "DEL", to: "BOM", price: 10000 })] };
      }
      if (from === "DEL" && to === "BLR") {
        return { fares: [mkFare({ from: "DEL", to: "BLR", price: 3500, dep: "08:00", arr: "10:30" })] };
      }
      if (from === "BLR" && to === "BOM") {
        return { fares: [mkFare({ from: "BLR", to: "BOM", price: 3000, dep: "13:00", arr: "14:30" })] };
      }
      return { fares: [] };
    });
    const { findSplitTickets } = await import("./splitTicket");
    const r = await findSplitTickets("DEL", "BOM", "2026-05-10");
    expect(r.length).toBeGreaterThan(0);
    const blr = r.find((s) => s.hub === "BLR");
    expect(blr).toBeDefined();
    expect(blr!.totalPrice).toBe(6500);
    expect(blr!.savings).toBe(3500);
    expect(blr!.layoverMinutes).toBe(150);
  });

  it("rejects split with layover under 90min", async () => {
    searchFares.mockImplementation(async ({ from, to }: { from: string; to: string }) => {
      if (from === "DEL" && to === "BOM") {
        return { fares: [mkFare({ from: "DEL", to: "BOM", price: 10000 })] };
      }
      if (from === "DEL" && to === "BLR") {
        return { fares: [mkFare({ price: 3500, dep: "08:00", arr: "10:30" })] };
      }
      if (from === "BLR" && to === "BOM") {
        return { fares: [mkFare({ price: 3000, dep: "11:00", arr: "12:30" })] };
      }
      return { fares: [] };
    });
    const { findSplitTickets } = await import("./splitTicket");
    const r = await findSplitTickets("DEL", "BOM", "2026-05-10");
    expect(r.find((s) => s.hub === "BLR")).toBeUndefined();
  });

  it("rejects split when savings under 8% threshold", async () => {
    searchFares.mockImplementation(async ({ from, to }: { from: string; to: string }) => {
      if (from === "DEL" && to === "BOM") {
        return { fares: [mkFare({ price: 10000 })] };
      }
      if (from === "DEL" && to === "BLR") {
        return { fares: [mkFare({ price: 5000, dep: "08:00", arr: "10:30" })] };
      }
      if (from === "BLR" && to === "BOM") {
        return { fares: [mkFare({ price: 4500, dep: "13:00", arr: "14:30" })] };
      }
      return { fares: [] };
    });
    const { findSplitTickets } = await import("./splitTicket");
    const r = await findSplitTickets("DEL", "BOM", "2026-05-10");
    expect(r).toEqual([]);
  });
});

describe("findHiddenCityOpportunities", () => {
  it("returns empty when origin equals destination", async () => {
    const { findHiddenCityOpportunities } = await import("./splitTicket");
    const r = await findHiddenCityOpportunities("DEL", "DEL", "2026-05-10");
    expect(r).toEqual([]);
  });

  it("finds hidden-city fare when through-ticket is cheaper and has stops", async () => {
    searchFares.mockImplementation(async ({ from, to }: { from: string; to: string }) => {
      if (from === "DEL" && to === "BOM") {
        return { fares: [mkFare({ price: 10000 })] };
      }
      if (from === "DEL" && to === "BLR") {
        return { fares: [mkFare({ from: "DEL", to: "BLR", price: 7000, stops: 1 })] };
      }
      return { fares: [] };
    });
    const { findHiddenCityOpportunities } = await import("./splitTicket");
    const r = await findHiddenCityOpportunities("DEL", "BOM", "2026-05-10");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].savings).toBe(3000);
  });

  it("skips non-stop fares (not a hidden-city)", async () => {
    searchFares.mockImplementation(async ({ from, to }: { from: string; to: string }) => {
      if (from === "DEL" && to === "BOM") {
        return { fares: [mkFare({ price: 10000 })] };
      }
      return { fares: [mkFare({ price: 7000, stops: 0 })] };
    });
    const { findHiddenCityOpportunities } = await import("./splitTicket");
    const r = await findHiddenCityOpportunities("DEL", "BOM", "2026-05-10");
    expect(r).toEqual([]);
  });
});
