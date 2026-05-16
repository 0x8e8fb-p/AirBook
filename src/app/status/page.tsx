"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Gauge,
  Globe2,
  Loader2,
  MapPin,
  Plane,
  Radar,
  Search,
} from "lucide-react";

import { getFlightStatus, getLiveFlightsSnapshot } from "@/app/actions/flightActions";
import { Footer } from "@/components/layout/Footer";

interface FlightPosition {
  lat: number;
  lon: number;
  altitude_m?: number;
}

interface FlightStatusInfo {
  flight_number: string;
  callsign?: string;
  icao24?: string;
  status: string;
  position: FlightPosition | null;
  velocity_kmh?: number;
  origin_country?: string;
  last_contact?: string;
}

interface LiveFlightInfo {
  callsign?: string;
  originCountry?: string;
  latitude?: number;
  longitude?: number;
  onGround?: boolean;
}

const STATUS_TONE: Record<string, { pill: string; dot: string }> = {
  airborne: {
    pill: "border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
    dot: "bg-[var(--accent-green)]",
  },
  taxiing: {
    pill: "border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
    dot: "bg-[var(--accent-amber)]",
  },
  landed: {
    pill: "border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]",
  },
  unknown: {
    pill: "border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
    dot: "bg-[var(--accent-red)]",
  },
};

function formatLocalDateTime(value?: string) {
  if (!value) return "Unavailable";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable";
  }

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeFlightInput(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").trim();
}

export default function StatusPage() {
  const [flightNum, setFlightNum] = useState("");
  const [status, setStatus] = useState<FlightStatusInfo | null>(null);
  const [live, setLive] = useState<LiveFlightInfo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const normalizedFlight = normalizeFlightInput(flightNum);

  const resetLookup = () => {
    setFlightNum("");
    setStatus(null);
    setLive(null);
    setSearchAttempted(false);
    setLookupError(null);
  };

  async function check() {
    if (!normalizedFlight) return;

    setLoading(true);
    setLookupError(null);
    setSearchAttempted(true);

    const [statusResult, liveResult] = await Promise.allSettled([
      getFlightStatus(normalizedFlight),
      getLiveFlightsSnapshot({ lamin: 6, lamax: 37, lomin: 68, lomax: 97.5 }),
    ]);

    if (statusResult.status === "fulfilled") {
      const nextStatus = statusResult.value as FlightStatusInfo | null;
      setStatus(nextStatus);

      if (!nextStatus) {
        setLookupError("We could not match that flight number right now. Check the format and try again.");
      }
    } else {
      setStatus(null);
      setLookupError("We could not load this flight’s live status right now. Please try again shortly.");
    }

    if (liveResult.status === "fulfilled" && liveResult.value?.flights) {
      setLive((liveResult.value.flights as LiveFlightInfo[]).slice(0, 8));
    } else {
      setLive([]);
    }

    setLoading(false);
  }

  const hasCoordinates = useMemo(() => {
    return Boolean(
      status?.position &&
        Number.isFinite(status.position.lat) &&
        Number.isFinite(status.position.lon),
    );
  }, [status]);

  const statusTone = STATUS_TONE[status?.status ?? "unknown"] || STATUS_TONE.unknown;
  const displayFlightNumber = status?.flight_number || normalizedFlight;
  const displayCallsign = status?.callsign || status?.icao24 || "Live identifier unavailable";

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-kicker mb-4">
                <Radar className="h-3.5 w-3.5" />
                Flight status
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Track one flight clearly, and keep regional airspace context close by.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Check operational status, last reported position, and a live regional snapshot in a layout tuned for phones, tablets, and desktop screens.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Plane,
                    title: "Single-flight lookup",
                    body: "Search by flight number to review operational details without extra clutter.",
                  },
                  {
                    icon: MapPin,
                    title: "Last reported position",
                    body: "Coordinates, speed, and altitude stay readable when tracking is available.",
                  },
                  {
                    icon: Globe2,
                    title: "Regional live snapshot",
                    body: "Use nearby live-aircraft context when you want a broader operational picture.",
                  },
                ].map((item) => (
                  <div key={item.title} className="surface-card rounded-[24px] p-4">
                    <item.icon className="mb-3 h-4 w-4 text-[var(--accent-cta)]" />
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="surface-card rounded-[32px] p-5 md:p-6"
            >
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Track a flight
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Flight number
                  </span>
                  <input
                    value={flightNum}
                    onChange={(event) => setFlightNum(normalizeFlightInput(event.target.value))}
                    onKeyDown={(event) => event.key === "Enter" && check()}
                    placeholder="AI302 or 6E2345"
                    className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 text-base font-semibold tracking-[0.08em] text-[var(--text-primary)]"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Enter the airline code and flight number together for the cleanest match.
                  </p>
                  <button
                    type="button"
                    onClick={check}
                    disabled={!normalizedFlight || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Track flight
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="mt-6 space-y-6" aria-live="polite">
          {loading ? (
            <div className="surface-card rounded-[32px] p-6 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking live operational updates for {normalizedFlight}…
              </div>
            </div>
          ) : null}

          {lookupError && searchAttempted ? (
            <div className="rounded-[28px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5 text-sm text-[var(--accent-red)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">Status lookup needs another try</div>
                  <p className="mt-1.5 leading-relaxed">{lookupError}</p>
                </div>
              </div>
            </div>
          ) : null}

          {status ? (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card rounded-[32px] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-primary-dim)] text-[var(--accent-cta)]">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Tracked flight</div>
                    <h2 className="mt-1 text-2xl font-semibold">{displayFlightNumber}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{displayCallsign}</p>
                  </div>
                </div>

                <span className={`status-pill ${statusTone.pill}`}>
                  <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                  {status.status}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="surface-soft rounded-[22px] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <MapPin className="h-3.5 w-3.5" />
                    Position
                  </div>
                  <div className="text-lg font-semibold">
                    {hasCoordinates ? `${status.position?.lat?.toFixed(2)}°, ${status.position?.lon?.toFixed(2)}°` : "Unavailable"}
                  </div>
                </div>

                <div className="surface-soft rounded-[22px] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <Gauge className="h-3.5 w-3.5" />
                    Speed
                  </div>
                  <div className="text-lg font-semibold">
                    {typeof status.velocity_kmh === "number" ? `${status.velocity_kmh} km/h` : "Unavailable"}
                  </div>
                </div>

                <div className="surface-soft rounded-[22px] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <Radar className="h-3.5 w-3.5" />
                    Altitude
                  </div>
                  <div className="text-lg font-semibold">
                    {typeof status.position?.altitude_m === "number" ? `${Math.round(status.position.altitude_m).toLocaleString("en-IN")} m` : "Ground or unavailable"}
                  </div>
                </div>

                <div className="surface-soft rounded-[22px] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Last contact
                  </div>
                  <div className="text-lg font-semibold">{formatLocalDateTime(status.last_contact)}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {status.origin_country
                    ? `Reported origin: ${status.origin_country}. Operational updates can lag slightly behind the aircraft's latest movement.`
                    : "Operational updates can lag slightly behind the aircraft's latest movement, especially during fast transitions on the ground."}
                </div>

                <button
                  type="button"
                  onClick={resetLookup}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Track another flight
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.section>
          ) : null}

          {live && live.length > 0 ? (
            <section className="surface-card rounded-[32px] p-5 md:p-6">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Regional snapshot</div>
                  <h2 className="mt-1 text-xl font-semibold">Aircraft currently in the air</h2>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  Use this quick regional snapshot as supporting operational context while you track a specific flight.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {live.map((flight, index) => (
                  <div key={`${flight.callsign || "flight"}-${index}`} className="surface-soft rounded-[22px] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{flight.callsign?.trim() || "Identifier unavailable"}</div>
                        <div className="mt-1 text-[11px] text-[var(--text-muted)]">{flight.originCountry || "Origin unavailable"}</div>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${flight.onGround ? "bg-[var(--text-muted)]" : "bg-[var(--accent-green)]"}`} />
                    </div>
                    <div className="mt-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {typeof flight.latitude === "number" && typeof flight.longitude === "number"
                        ? `${flight.latitude.toFixed(1)}°, ${flight.longitude.toFixed(1)}°`
                        : "Position temporarily unavailable"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  );
}
