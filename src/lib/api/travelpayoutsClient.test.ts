import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.TRAVELPAYOUTS_API_BASE = "https://api.travelpayouts.com";
  process.env.TRAVELPAYOUTS_TOKEN = "token-123";
  process.env.TRAVELPAYOUTS_MARKER = "marker-456";
  process.env.TRAVELPAYOUTS_HOST = "thewingsscan.com";
  process.env.TRAVELPAYOUTS_DEFAULT_USER_IP = "203.0.113.10";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("travelpayoutsClient", () => {
  it("sends x-access-token and maps airport records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            code: "DEL",
            name: "Indira Gandhi International Airport",
            city_code: "DEL",
            country_code: "IN",
            time_zone: "Asia/Kolkata",
            coordinates: { lat: 28.5562, lon: 77.1 },
          },
          {
            code: "BOM",
            name: "Chhatrapati Shivaji Maharaj International Airport",
            city_code: "BOM",
            country_code: "IN",
            time_zone: "Asia/Kolkata",
            coordinates: { lat: 19.0896, lon: 72.8656 },
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { searchAirports } = await import("./travelpayoutsClient");
    const out = await searchAirports({ q: "del", limit: 5 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.travelpayouts.com/data/en/airports.json");
    expect((init.headers as Record<string, string>)["x-access-token"]).toBe("token-123");
    expect(out.airports).toEqual([
      {
        iata: "DEL",
        icao: null,
        name: "Indira Gandhi International Airport",
        city: "DEL",
        country: "IN",
        latitude: 28.5562,
        longitude: 77.1,
        timezone: "Asia/Kolkata",
      },
    ]);
  });

  it("builds the real-time search signature from token, marker, and sorted values", async () => {
    const { buildFlightSearchSignature } = await import("./travelpayoutsClient");

    const signature = buildFlightSearchSignature("secret-token", {
      marker: "12345",
      host: "thewingsscan.com",
      user_ip: "203.0.113.10",
      locale: "en",
      trip_class: "Y",
      passengers: { adults: 1, children: 0, infants: 0 },
      segments: [
        { origin: "DEL", destination: "BOM", date: "2026-06-10" },
        { origin: "BOM", destination: "DEL", date: "2026-06-17" },
      ],
      currency: "inr",
    });

    expect(signature.source).toBe(
      "secret-token:inr:thewingsscan.com:en:12345:1:0:0:2026-06-10:BOM:DEL:2026-06-17:DEL:BOM:Y:203.0.113.10",
    );
    expect(signature.md5).toBe("c4eec69db92dba22cbe2415a2838377a");
  });

  it("maps fare calendar data into internal fares", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            "2026-06-10": {
              origin: "DEL",
              destination: "BOM",
              price: 4321,
              transfers: 0,
              airline: "6E",
              flight_number: 204,
              departure_at: "2026-06-10T07:30:00+05:30",
              return_at: null,
              expires_at: "2026-06-01T00:00:00Z",
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { travelpayoutsApi } = await import("./travelpayoutsClient");
    const out = await travelpayoutsApi.searchFares({
      from: "DEL",
      to: "BOM",
      date: "2026-06-10",
      pax: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.travelpayouts.com/v1/prices/calendar?origin=DEL&destination=BOM&depart_date=2026-06&calendar_type=departure_date&currency=INR",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-access-token": "token-123" }),
      }),
    );
    expect(out.fares).toEqual([
      {
        from: "DEL",
        to: "BOM",
        airline: "6E",
        flightNumber: "6E-204",
        price: 4321,
        currency: "INR",
        departureDate: "2026-06-10",
        returnDate: null,
        departureTime: "2026-06-10T07:30:00+05:30",
        arrivalTime: null,
        durationMinutes: null,
        stops: 0,
        sourceApi: "travelpayouts_calendar",
        recordedAt: "2026-06-01T00:00:00Z",
        bookingToken: null,
        searchId: null,
        gateId: null,
      },
    ]);
  });
});
