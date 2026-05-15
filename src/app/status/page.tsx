"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getFlightStatus, getLiveFlightsSnapshot } from "@/app/actions/flightActions";
import type { FlightStatus, LiveFlight } from "@/lib/api/travelpayoutsTypes";
import { Search, Plane, Radar, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

const SEVEN_DAYS_FROM_NOW = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

export default function StatusPage() {
  const [flightNum, setFlightNum] = useState("");
  const [status, setStatus] = useState<FlightStatus | null>(null);
  const [live, setLive] = useState<LiveFlight[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    if (!flightNum) return;
    setLoading(true);
    const [s, l] = await Promise.allSettled([
      getFlightStatus(flightNum),
      getLiveFlightsSnapshot({ lamin: 6, lamax: 37, lomin: 68, lomax: 97.5 }),
    ]);
    setStatus(s.status === "fulfilled" ? s.value : null);
    setLive(l.status === "fulfilled" ? l.value.flights.slice(0, 10) : null);
    setLoading(false);
  }

  const statusColor: Record<string, string> = {
    airborne: "text-[var(--accent-green)]",
    taxiing: "text-[var(--accent-cta)]",
    landed: "text-[var(--text-muted)]",
    unknown: "text-[var(--accent-red)]",
  };

  return (
    <div className="min-h-[100dvh] pt-24 pb-20">
      <div className="container-app max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Radar className="w-5 h-5 text-[var(--accent-cta)]" />
            <h1 className="text-2xl font-bold">Route Tools</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Travelpayouts focuses on fares and booking handoffs, so this page keeps lightweight route utilities while live movement data remains disabled.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-5 mb-8"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Flight Number</label>
              <input
                value={flightNum}
                onChange={(e) => setFlightNum(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && check()}
                placeholder="e.g. 6E-2345"
                className="ghost-input w-full text-lg font-semibold py-1"
              />
            </div>
            <button onClick={check} disabled={!flightNum || loading}
              className="self-end px-5 py-2.5 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {status && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <Plane className="w-5 h-5 text-[var(--accent-cta)]" />
                <div>
                  <div className="text-lg font-bold">{status.flight_number}</div>
                  <div className="text-sm text-[var(--text-muted)]">{status.callsign || status.icao24}</div>
                </div>
                <div className={`ml-auto text-lg font-bold capitalize ${statusColor[status.status] || "text-[var(--text-primary)]"}`}>
                  {status.status}
                </div>
              </div>

              {status.position && (status.position.lat || status.position.lon) && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-[var(--bg-base)] rounded-[var(--radius-md)]">
                    <MapPin className="w-4 h-4 mx-auto mb-1 text-[var(--text-muted)]" />
                    <div className="text-sm font-bold">{status.position.lat?.toFixed(2)}°, {status.position.lon?.toFixed(2)}°</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Position</div>
                  </div>
                  <div className="text-center p-3 bg-[var(--bg-base)] rounded-[var(--radius-md)]">
                    <div className={`text-sm font-bold ${status.status === "airborne" ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"}`}>
                      {status.velocity_kmh} km/h
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Speed</div>
                  </div>
                  <div className="text-center p-3 bg-[var(--bg-base)] rounded-[var(--radius-md)]">
                    <div className="text-sm font-bold">
                      {status.position.altitude_m ? `${Math.round(status.position.altitude_m)}m` : "Ground"}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Altitude</div>
                  </div>
                </div>
              )}

              {status.origin_country && (
                <div className="text-xs text-[var(--text-secondary)]">
                  Origin country: {status.origin_country} · Last contact: {status.last_contact ? new Date(status.last_contact).toLocaleString() : "N/A"}
                </div>
              )}
            </div>

            <Link
              href={`/intelligence?from=${flightNum?.slice(0, 2) || ""}&to=BOM&date=${SEVEN_DAYS_FROM_NOW}`}
              className="block w-full py-3 bg-[var(--accent-primary-dim)] border border-[var(--accent-cta)]/20 text-[var(--accent-cta)] font-semibold rounded-[var(--radius-md)] text-center text-sm hover:bg-[var(--accent-cta)] hover:text-[var(--text-inverse)] transition-colors"
            >
              Check Price Intelligence →
            </Link>
          </motion.div>
        )}

        {/* Live Flights */}
        {live && live.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Radar className="w-4 h-4" />
              Live over India
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {live.map((f: LiveFlight, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)] text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${f.onGround ? "bg-[var(--text-muted)]" : "bg-[var(--accent-green)]"}`} />
                    <div>
                      <div className="font-medium">{f.callsign || "UNKNOWN"}</div>
                      <div className="text-[var(--text-muted)]">{f.originCountry}</div>
                    </div>
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {f.latitude?.toFixed(1)}°, {f.longitude?.toFixed(1)}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
