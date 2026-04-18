import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("rateLimit (in-memory fallback)", () => {
  it("allows up to the limit then blocks", async () => {
    const { rateLimit } = await import("./rateLimit");
    const key = `t:${Math.random()}`;

    const r1 = await rateLimit({ key, limit: 2, windowSec: 60 });
    const r2 = await rateLimit({ key, limit: 2, windowSec: 60 });
    const r3 = await rateLimit({ key, limit: 2, windowSec: 60 });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r1.limit).toBe(2);
  });

  it("returns X-RateLimit-* header map", async () => {
    const { rateLimit, rateLimitHeaders } = await import("./rateLimit");
    const result = await rateLimit({ key: `h:${Math.random()}`, limit: 5, windowSec: 30 });
    const h = rateLimitHeaders(result);
    expect(h["X-RateLimit-Limit"]).toBe("5");
    expect(h["X-RateLimit-Remaining"]).toBe("4");
    expect(Number(h["X-RateLimit-Reset"])).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("uses Upstash pipeline when env is set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { result: 1 },
          { result: 1 },
          { result: 60 },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { rateLimit } = await import("./rateLimit");
    const result = await rateLimit({ key: "rl:search:1.2.3.4", limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://redis.test/pipeline");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });
});

describe("getClientIp", () => {
  it("prefers x-forwarded-for first entry", async () => {
    const { getClientIp } = await import("./rateLimit");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1", "x-real-ip": "10.0.0.2" },
    });
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", async () => {
    const { getClientIp } = await import("./rateLimit");
    const req = new Request("http://x", { headers: { "x-real-ip": "198.51.100.7" } });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("returns unknown when no header present", async () => {
    const { getClientIp } = await import("./rateLimit");
    const req = new Request("http://x");
    expect(getClientIp(req)).toBe("unknown");
  });
});
