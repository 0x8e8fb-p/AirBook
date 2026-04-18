import { describe, it, expect, beforeEach, vi } from "vitest";

const findFirst = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();
const update = vi.fn();
const findMany = vi.fn();
const getServerSession = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    priceFreeze: {
      findFirst: (...a: unknown[]) => findFirst(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      create: (...a: unknown[]) => create(...a),
      update: (...a: unknown[]) => update(...a),
      findMany: (...a: unknown[]) => findMany(...a),
    },
  },
}));

vi.mock("next-auth/next", () => ({
  getServerSession: (...a: unknown[]) => getServerSession(...a),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

beforeEach(() => {
  findFirst.mockReset();
  findUnique.mockReset();
  create.mockReset();
  update.mockReset();
  findMany.mockReset();
  getServerSession.mockReset();
});

function futureDate(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("createPriceFreeze", () => {
  it("rejects unauthenticated users", async () => {
    getServerSession.mockResolvedValue(null);
    const { createPriceFreeze } = await import("./priceFreezeActions");
    const r = await createPriceFreeze({
      origin: "DEL",
      destination: "BOM",
      departureDate: futureDate(10),
      airline: "6E",
      flightNumber: "123",
      lockedPrice: 5000,
      basePrice: 4500,
    });
    expect(r.success).toBe(false);
    expect(r.error).toBe("Not authenticated");
  });

  it("rejects non-positive prices", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    const { createPriceFreeze } = await import("./priceFreezeActions");
    const r = await createPriceFreeze({
      origin: "DEL",
      destination: "BOM",
      departureDate: futureDate(10),
      airline: "6E",
      flightNumber: null,
      lockedPrice: 0,
      basePrice: 0,
    });
    expect(r.success).toBe(false);
    expect(r.error).toBe("Invalid price");
  });

  it("rejects past dates", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    const { createPriceFreeze } = await import("./priceFreezeActions");
    const r = await createPriceFreeze({
      origin: "DEL",
      destination: "BOM",
      departureDate: futureDate(-1),
      airline: "6E",
      flightNumber: null,
      lockedPrice: 5000,
      basePrice: 4500,
    });
    expect(r.success).toBe(false);
    expect(r.error).toBe("Date in past");
  });

  it("creates new freeze when no existing", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "f1", lockedPrice: 5000 });
    const { createPriceFreeze } = await import("./priceFreezeActions");
    const r = await createPriceFreeze({
      origin: "DEL",
      destination: "BOM",
      departureDate: futureDate(10),
      airline: "6E",
      flightNumber: "123",
      lockedPrice: 5000,
      basePrice: 4500,
    });
    expect(r.success).toBe(true);
    expect(r.alreadyExisted).toBe(false);
    expect(create).toHaveBeenCalledOnce();
  });

  it("returns existing freeze without creating duplicate", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findFirst.mockResolvedValue({ id: "f0", lockedPrice: 4800 });
    const { createPriceFreeze } = await import("./priceFreezeActions");
    const r = await createPriceFreeze({
      origin: "DEL",
      destination: "BOM",
      departureDate: futureDate(10),
      airline: "6E",
      flightNumber: "123",
      lockedPrice: 5000,
      basePrice: 4500,
    });
    expect(r.success).toBe(true);
    expect(r.alreadyExisted).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("redeemPriceFreeze", () => {
  it("rejects when not owner", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue({ id: "f1", userId: "u2", redeemed: false, expiresAt: new Date(Date.now() + 3600_000) });
    const { redeemPriceFreeze } = await import("./priceFreezeActions");
    const r = await redeemPriceFreeze("f1");
    expect(r.success).toBe(false);
  });

  it("rejects expired freeze", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue({ id: "f1", userId: "u1", redeemed: false, expiresAt: new Date(Date.now() - 1000) });
    const { redeemPriceFreeze } = await import("./priceFreezeActions");
    const r = await redeemPriceFreeze("f1");
    expect(r.success).toBe(false);
    expect(r.error).toBe("Expired");
  });

  it("redeems valid freeze", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue({ id: "f1", userId: "u1", redeemed: false, expiresAt: new Date(Date.now() + 3600_000) });
    update.mockResolvedValue({});
    const { redeemPriceFreeze } = await import("./priceFreezeActions");
    const r = await redeemPriceFreeze("f1");
    expect(r.success).toBe(true);
    expect(update).toHaveBeenCalledOnce();
  });
});
