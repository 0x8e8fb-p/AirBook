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

describe("airApiClient", () => {
  it("sends X-Client-Id and X-Api-Key headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ airports: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { searchAirports } = await import("./airApiClient");
    await searchAirports({ q: "del" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/v1/airports?q=del&limit=10");
    expect((init.headers as Record<string, string>)["X-Client-Id"]).toBe("cid");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("secret");
  });

  it("throws AirApiConfigError when env missing", async () => {
    delete process.env.AIRAPI_URL;
    vi.stubGlobal("fetch", vi.fn());
    const { searchAirports, AirApiConfigError } = await import("./airApiClient");
    await expect(searchAirports({ q: "del" })).rejects.toBeInstanceOf(AirApiConfigError);
  });

  it("retries on 5xx then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ airports: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { searchAirports } = await import("./airApiClient");
    const out = await searchAirports({ q: "bom" });
    expect(out.airports).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("bad", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const { searchAirports, AirApiError } = await import("./airApiClient");
    await expect(searchAirports({ q: "xyz" })).rejects.toBeInstanceOf(AirApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects on schema mismatch", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ not_airports: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { searchAirports } = await import("./airApiClient");
    await expect(searchAirports({ q: "del" })).rejects.toThrow(/schema mismatch/);
  });
});
