import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.AIRAPI_URL = "https://api.test";
  process.env.AIRAPI_CLIENT_ID = "cid";
  process.env.AIRAPI_KEY = "secret";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function mockCoupons(coupons: Array<Record<string, unknown>>) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ coupons }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
}

const baseCoupon = {
  code: "X",
  description: null,
  discountType: "PERCENTAGE" as const,
  discountValue: 10,
  maxDiscount: 500,
  validFrom: null,
  validUntil: null,
  minSpend: 0,
  applicableAirlines: [],
  applicableRoutes: [],
  userSegment: "ALL" as const,
  bankName: null as string | null,
  cardType: null,
  otaName: null,
  currency: "INR",
  sourceSite: null,
  sourceUrl: null,
  isVerified: false,
  successRate: null,
};

describe("offerEngine UPI autopick", () => {
  it("applies PhonePe offer even when user has no saved cards", async () => {
    mockCoupons([{ ...baseCoupon, code: "PHPE10", bankName: "PhonePe" }]);
    const { getOffersForUser } = await import("./offerEngine");
    const offers = await getOffersForUser([], 5000);
    expect(offers.map((o) => o.bankCode)).toContain("PHONEPE");
  });

  it("applies Paytm wallet offer for guest user", async () => {
    mockCoupons([{ ...baseCoupon, code: "PTM10", bankName: "Paytm Wallet" }]);
    const { getOffersForUser } = await import("./offerEngine");
    const offers = await getOffersForUser(undefined, 5000);
    expect(offers.map((o) => o.bankCode)).toContain("PAYTM");
  });

  it("still gates HDFC offer behind card ownership", async () => {
    mockCoupons([
      { ...baseCoupon, code: "HDFC10", bankName: "HDFC" },
      { ...baseCoupon, code: "CRED10", bankName: "CRED" },
    ]);
    const { getOffersForUser } = await import("./offerEngine");
    const guest = await getOffersForUser([], 5000);
    expect(guest.map((o) => o.bankCode)).toEqual(["CRED"]);

    const hdfcOwner = await getOffersForUser(["HDFC"], 5000);
    expect(new Set(hdfcOwner.map((o) => o.bankCode))).toEqual(new Set(["HDFC", "CRED"]));
  });
});
