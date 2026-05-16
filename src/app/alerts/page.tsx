"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Loader2,
  LogIn,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { getPriceAlerts, removePriceAlert, subscribePriceAlert } from "@/app/actions/alertActions";
import { formatPrice } from "@/lib/constants";

type PriceAlerts = Awaited<ReturnType<typeof getPriceAlerts>>;

function sanitizeIata(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function formatExpiryDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AlertField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(sanitizeIata(event.target.value))}
        maxLength={3}
        placeholder={placeholder}
        className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 text-lg font-semibold tracking-[0.14em] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
      />
    </label>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="surface-card animate-pulse rounded-[24px] p-4">
          <div className="h-3 w-28 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-4 h-6 w-40 rounded-full bg-[var(--bg-subtle)]" />
          <div className="mt-3 h-3 w-56 rounded-full bg-[var(--bg-subtle)]" />
        </div>
      ))}
    </div>
  );
}

function AlertsContent() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [price, setPrice] = useState("");
  const [alerts, setAlerts] = useState<PriceAlerts>([]);
  const [loading, setLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => from.length === 3 && to.length === 3 && Number(price) > 0 && from !== to,
    [from, price, to],
  );

  const loadAlerts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setAlertsLoading(true);
      setError(null);
    }

    try {
      const data = await getPriceAlerts();
      setAlerts(data);
    } catch {
      setAlerts([]);
      setError("We could not load your saved alerts right now. Please try again shortly.");
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      setAlertsLoading(true);
      try {
        const data = await getPriceAlerts();
        if (cancelled) return;
        setAlerts(data);
      } catch {
        if (cancelled) return;
        setAlerts([]);
        setError("We could not load your saved alerts right now. Please try again shortly.");
      } finally {
        if (!cancelled) {
          setAlertsLoading(false);
        }
      }
    }

    void fetchAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubscribe() {
    if (!canSubmit) return;

    if (!isAuthenticated) {
      setNotice(null);
      setError("Sign in to save and manage fare alerts across your devices.");
      return;
    }

    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const targetPrice = Number(price);
      const response = await subscribePriceAlert(from, to, targetPrice);

      if (!response) {
        setError("We could not save that alert just now. Please sign in again and retry.");
      } else {
        setFrom("");
        setTo("");
        setPrice("");
        setNotice(`Alert saved for ${response.source_airport} → ${response.destination_airport} at ${formatPrice(response.target_price)}.`);
        await loadAlerts(false);
      }
    } catch {
      setError("We could not save that alert right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setNotice(null);
    setError(null);

    try {
      await removePriceAlert(id);
      setNotice("Alert removed.");
      await loadAlerts(false);
    } catch {
      setError("We could not remove that alert right now. Please try again shortly.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="container-app py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-kicker mb-4">
                <Bell className="h-3.5 w-3.5" />
                Fare alerts
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
                Save the routes you care about and return when the fare looks better.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Alerts help you watch a target fare without refreshing the route constantly. Set a threshold, keep the route in view, and jump back into live search when the timing feels right.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Clean route tracking",
                    body: "Save the price you care about and keep your watchlist tidy across devices.",
                  },
                  {
                    icon: Sparkles,
                    title: "Fewer manual checks",
                    body: "Let AirBook remember the route so you only come back when it matters.",
                  },
                  {
                    icon: Bell,
                    title: "Move into live search later",
                    body: "Use alerts as the reminder layer, then confirm current availability in live search before booking.",
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
              transition={{ delay: 0.08 }}
              className="surface-card rounded-[32px] p-5 md:p-6"
            >
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Save a route alert
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AlertField label="From" placeholder="DEL" value={from} onChange={setFrom} />
                <AlertField label="To" placeholder="BOM" value={to} onChange={setTo} />
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Target fare
                </span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSubscribe()}
                  placeholder="3500"
                  className="ghost-input h-[58px] w-full rounded-[22px] border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] px-4 text-lg font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                />
              </label>

              {!isAuthenticated ? (
                <div className="mt-4 rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                  Sign in to save alerts and manage them from any device.
                  <div className="mt-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cta)] hover:underline"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in now
                    </Link>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubscribe}
                disabled={!canSubmit || loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {loading ? "Saving alert…" : isAuthenticated ? "Save fare alert" : "Sign in to save alerts"}
              </button>

              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                Alerts help you know when it is worth reopening the route in live search.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="mt-6 space-y-4" aria-live="polite">
          {notice ? (
            <div className="rounded-[24px] border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 p-4 text-sm text-[var(--accent-green)]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>{notice}</div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[24px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-4 text-sm text-[var(--accent-red)]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>{error}</div>
              </div>
            </div>
          ) : null}
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--accent-cta)]" />
            <h2 className="text-lg font-semibold">Saved alerts</h2>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
            Track the routes you want to revisit later, then move into live search when the moment is right.
          </p>

          <div className="mt-5">
            {alertsLoading ? (
              <AlertsSkeleton />
            ) : alerts.length === 0 ? (
              <div className="surface-card rounded-[30px] p-5 md:p-6">
                <div className="text-lg font-semibold">
                  {isAuthenticated ? "No saved alerts yet" : "Sign in to start saving alerts"}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {isAuthenticated
                    ? "Create your first alert above to keep a close eye on a route without checking it manually every day."
                    : "Your saved routes appear here after you sign in and create alerts for the fares you want to watch."}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {isAuthenticated ? (
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                    >
                      Start live search
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                  >
                    Explore routes
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const isDeleting = deletingId === alert.id;

                  return (
                    <div key={alert.id} className="surface-card rounded-[24px] p-4 md:p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="status-pill border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
                              Active
                            </span>
                            <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                              Expires {formatExpiryDate(alert.expiry_date)}
                            </span>
                          </div>

                          <div className="mt-4 text-lg font-semibold">
                            {alert.source_airport} → {alert.destination_airport}
                          </div>
                          <div className="mt-1 text-sm text-[var(--text-secondary)]">
                            Alert me when the route falls to {formatPrice(alert.target_price)} or lower.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(alert.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[var(--accent-red)]/20 px-4 py-2.5 text-sm font-semibold text-[var(--accent-red)] transition-colors hover:bg-[var(--accent-red)]/10 disabled:opacity-40 md:self-center"
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Remove alert
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense>
      <AlertsContent />
    </Suspense>
  );
}
