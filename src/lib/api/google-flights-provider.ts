// ─── Google Flights Provider (Python bridge) ──────────────────────
// Spawns `python3 scripts/google-flights-rpc.py`, pipes search params
// as JSON on stdin, parses JSON results from stdout, and maps them
// into the orchestrator's RawFlightOffer shape.
//
// Requirements (developer side):
//   - python3 on PATH
//   - `pip install -r scripts/requirements.txt`
//
// Failure modes — all silent, all return []:
//   - python3 not found → first call detects it, future calls short-circuit
//   - fast-flights not installed → script returns success=false / kind=import
//   - Google blocks the request / RPC schema rotated → success=false / kind=fetch
//   - Anything else → caught, logged once, return []
//
// Behavioural notes:
//   - First spawn is slow (~500 ms cold). Subsequent are faster.
//   - Caches a "python is missing" flag in-process so we don't keep
//     trying to spawn a binary that isn't there.
// ──────────────────────────────────────────────────────────────────

import { execFile } from "node:child_process";
import type { CabinClass } from "@/lib/types";
import type {
  FlightProvider,
  FlightSearchParams,
  RawFlightOffer,
} from "./flight-data-provider";

const TIMEOUT_MS = Number(process.env.GF_TIMEOUT_MS || 18_000);

// Paths resolved lazily so static analysers in Turbopack don't try
// to bundle .venv/bin/python3 as an asset (it's a symlink to
// /opt/homebrew/... which trips the "points out of filesystem root"
// guard). The default python binary is "python3" on PATH; set
// GF_PYTHON_BIN in .env to point at the project-local venv:
//
//   GF_PYTHON_BIN=./.venv/bin/python3
function getScriptPath(): string {
  return `${process.cwd()}/scripts/google-flights-rpc.py`;
}

function getPythonBin(): string {
  return process.env.GF_PYTHON_BIN || "python3";
}

// In-process memoization. Once we discover python3 isn't on PATH we
// stop trying for the lifetime of this process. Restart the dev server
// after installing python if you flip it.
let pythonMissing = false;

interface PythonFlight {
  airline: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
  price: number;
  is_best?: boolean;
}

interface PythonResponse {
  success: boolean;
  flights?: PythonFlight[];
  kind?: "import" | "fetch" | "parse";
  error?: string;
}

function runPythonBridge(params: FlightSearchParams): Promise<PythonResponse> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      date: params.date,
      passengers: params.passengers ?? 1,
      cabin: params.cabin ?? "economy",
    });

    const child = execFile(
      getPythonBin(),
      [getScriptPath()],
      { timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          // ENOENT is the "binary not found" case. Memoise it.
          const code = (err as NodeJS.ErrnoException).code;
          if (code === "ENOENT") {
            pythonMissing = true;
          }
          reject(
            new Error(
              `python bridge failed (${code ?? "exec"}): ${err.message}${
                stderr ? ` | stderr: ${stderr.slice(0, 240)}` : ""
              }`,
            ),
          );
          return;
        }

        try {
          resolve(JSON.parse(stdout) as PythonResponse);
        } catch (parseErr) {
          reject(
            new Error(
              `python bridge returned non-JSON: ${(parseErr as Error).message} | head: ${stdout.slice(0, 200)}`,
            ),
          );
        }
      },
    );

    child.stdin?.write(payload);
    child.stdin?.end();
  });
}

// "07:30 AM" → "07:30" then combined with the search date to produce ISO.
// fast-flights returns times without a date.
function combineWithDate(dateYmd: string, timeStr: string): string {
  const cleaned = (timeStr || "").trim();
  if (!cleaned) return `${dateYmd}T00:00:00`;

  // Try `HH:MM AM/PM` and `HH:MM`.
  const m = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return `${dateYmd}T00:00:00`;

  let hour = Number.parseInt(m[1] ?? "0", 10);
  const min = Number.parseInt(m[2] ?? "0", 10);
  const ampm = (m[3] || "").toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const hh = String(hour).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return `${dateYmd}T${hh}:${mm}:00`;
}

// "2 hr 35 min" → 155
function parseDurationMinutes(raw: string): number {
  if (!raw) return 0;
  const hr = /(\d+)\s*hr/.exec(raw)?.[1];
  const mn = /(\d+)\s*min/.exec(raw)?.[1];
  return (Number(hr ?? 0) * 60) + Number(mn ?? 0);
}

// "IndiGo · 6E 5213" or "Air India" → ["AI", "AI-505"] best-effort.
function inferAirline(raw: string): { code: string; flightNumber: string } {
  if (!raw) return { code: "XX", flightNumber: "" };

  // Look for "<2-letter code> <digits>" in the raw airline string.
  const m = raw.match(/\b([A-Z0-9]{2})\s?[-\s]?(\d{1,5})\b/);
  if (m) return { code: m[1], flightNumber: `${m[1]}-${m[2]}` };

  // Common airline name → IATA map.
  const lookup: Record<string, string> = {
    "indigo": "6E",
    "air india": "AI",
    "vistara": "UK",
    "spicejet": "SG",
    "akasa": "QP",
    "emirates": "EK",
    "qatar": "QR",
    "singapore": "SQ",
    "lufthansa": "LH",
    "british airways": "BA",
    "turkish": "TK",
    "etihad": "EY",
  };
  const lower = raw.toLowerCase();
  for (const [name, code] of Object.entries(lookup)) {
    if (lower.includes(name)) return { code, flightNumber: "" };
  }
  return { code: raw.slice(0, 2).toUpperCase(), flightNumber: "" };
}

function mapToOffer(
  flight: PythonFlight,
  params: FlightSearchParams,
  index: number,
): RawFlightOffer {
  const dep = combineWithDate(params.date, flight.departure_time);
  const arr = combineWithDate(params.date, flight.arrival_time);
  const duration = parseDurationMinutes(flight.duration);
  const { code, flightNumber } = inferAirline(flight.airline);

  return {
    id: `gf-${code}-${flightNumber || index}-${dep}`,
    provider: "google_flights",
    source: "google_flights_rpc",
    airline: code,
    flightNumber: flightNumber || `${code}-${100 + index}`,
    origin: params.origin.toUpperCase(),
    destination: params.destination.toUpperCase(),
    departureTime: dep,
    arrivalTime: arr,
    durationMinutes: duration,
    stops: flight.stops ?? 0,
    stopCities: [],
    price: Math.max(0, Math.round(flight.price || 0)),
    currency: "INR",
    cabinClass: (params.cabin || "economy") as CabinClass,
    baggage: {
      cabin: { included: false },
      checked: { included: false },
    },
    refundable: false,
    bookingUrl: null,
    deepLink: null,
    bookingToken: null,
    searchId: null,
    gateId: null,
    availabilityState: "reference_only",
    dataFreshness: "live",
    confidence: flight.is_best ? "high" : "medium",
    baggageConfirmed: false,
    refundabilityConfirmed: false,
  };
}

async function getBaseUrl(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const host = (await headers()).get("host");
    if (!host) return null;
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  } catch {
    return null;
  }
}

class GoogleFlightsProvider implements FlightProvider {
  readonly name = "google_flights" as const;

  isAvailable(): boolean {
    if (process.env.GF_DISABLED === "true") return false;
    const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    if (!isServerless && pythonMissing) return false;
    return true;
  }

  async search(params: FlightSearchParams): Promise<RawFlightOffer[]> {
    try {
      let response: PythonResponse | null = null;
      const baseUrl = await getBaseUrl();

      if (baseUrl) {
        try {
          const url = new URL(`${baseUrl}/api/flights`);
          url.searchParams.set("origin", params.origin);
          url.searchParams.set("destination", params.destination);
          url.searchParams.set("date", params.date);
          url.searchParams.set("passengers", String(params.passengers ?? 1));
          url.searchParams.set("cabin", params.cabin ?? "economy");

          const res = await fetch(url.toString(), { cache: "no-store" });
          if (res.ok) {
            response = (await res.json()) as PythonResponse;
          } else {
            console.warn(
              `[google-flights] API endpoint returned status ${res.status}, falling back to local bridge.`,
            );
          }
        } catch (fetchErr) {
          console.warn(
            "[google-flights] API endpoint fetch failed, falling back to local bridge:",
            fetchErr instanceof Error ? fetchErr.message : fetchErr,
          );
        }
      }

      if (!response) {
        response = await runPythonBridge(params);
      }

      if (!response.success) {
        console.warn(
          `[google-flights] ${response.kind ?? "error"}: ${response.error ?? "unknown"}`,
        );
        return [];
      }
      const flights = response.flights ?? [];
      return flights
        .filter((f) => f && f.price > 0)
        .map((f, i) => mapToOffer(f, params, i));
    } catch (err) {
      console.warn(
        "[google-flights] search failed:",
        err instanceof Error ? err.message : err,
      );
      return [];
    }
  }
}

export const googleFlightsProvider = new GoogleFlightsProvider();
