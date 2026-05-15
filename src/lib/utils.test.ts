import { describe, it, expect } from "vitest";
import { isWalletMatch, sortFlights } from "./utils";
import type { FlightResult } from "./types";
import type { BankOffer } from "./flight/offerEngine";

function makeOffer(overrides: Partial<BankOffer>): BankOffer {
  return {
    id: "o1",
    name: "Test offer",
    type: "percentage",
    value: 10,
    minBooking: 0,
    category: "bank",
    validUntil: new Date("2026-12-31T00:00:00Z"),
    ...overrides,
  };
}

function makeFlight(overrides: Partial<FlightResult>): FlightResult {
  return {
    id: "f1",
    source: "master_api",
    segments: [],
    price: 5000,
    currency: "INR",
    pricePerAdult: 5000,
    basePrice: 5000,
    airline: "6E",
    airlineName: "IndiGo",
    flightNumber: "6E-100",
    origin: "DEL",
    destination: "BOM",
    departureTime: "2026-05-01T08:00:00Z",
    arrivalTime: "2026-05-01T10:00:00Z",
    durationMinutes: 120,
    stops: 0,
    stopCities: [],
    baggage: { cabin: { included: true, weight: 7 }, checked: { included: true, weight: 15 } },
    refundable: false,
    cabinClass: "economy",
    fetchedAt: "2026-04-18T00:00:00Z",
    searchHash: "DEL-BOM-2026-05-01",
    ...overrides,
  };
}

describe("isWalletMatch", () => {
  it("returns false when no owned cards", () => {
    const f = makeFlight({ appliedOffer: makeOffer({ name: "HDFC 10%", bankCode: "HDFC", platform: "makemytrip" }) });
    expect(isWalletMatch(f, [])).toBe(false);
    expect(isWalletMatch(f, undefined)).toBe(false);
  });

  it("returns false when offer has no bankCode", () => {
    const f = makeFlight({ appliedOffer: makeOffer({ name: "x", platform: "ixigo" }) });
    expect(isWalletMatch(f, ["HDFC"])).toBe(false);
  });

  it("matches case-insensitive", () => {
    const f = makeFlight({ appliedOffer: makeOffer({ name: "x", bankCode: "hdfc", platform: "makemytrip" }) });
    expect(isWalletMatch(f, ["HDFC"])).toBe(true);
  });
});

describe("sortFlights wallet_match", () => {
  it("ranks wallet matches first, then by discount, then by price", () => {
    const a = makeFlight({ id: "a", price: 4800, basePrice: 5000, appliedOffer: makeOffer({ bankCode: "SBI", platform: "yatra" }) });
    const b = makeFlight({ id: "b", price: 4500, basePrice: 5000, appliedOffer: makeOffer({ bankCode: "HDFC", platform: "makemytrip" }) });
    const c = makeFlight({ id: "c", price: 4300, basePrice: 5000, appliedOffer: makeOffer({ bankCode: "HDFC", platform: "makemytrip" }) });

    const sorted = sortFlights([a, b, c], "wallet_match", ["HDFC"]);
    expect(sorted.map((f) => f.id)).toEqual(["c", "b", "a"]);
  });

  it("falls back to price when no wallet matches", () => {
    const a = makeFlight({ id: "a", price: 4800 });
    const b = makeFlight({ id: "b", price: 4500 });
    const sorted = sortFlights([a, b], "wallet_match", []);
    expect(sorted.map((f) => f.id)).toEqual(["b", "a"]);
  });
});
