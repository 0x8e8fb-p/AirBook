"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { subscribePriceAlert, getPriceAlerts, removePriceAlert } from "@/app/actions/alertActions";
import { Bell, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";

function AlertsContent() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [price, setPrice] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load alerts on mount
  useState(() => {
    loadAlerts();
  });

  async function loadAlerts() {
    setAlertsLoading(true);
    const data = await getPriceAlerts();
    setAlerts(data);
    setAlertsLoading(false);
  }

  async function handleSubscribe() {
    if (!from || !to || !price) return;
    setLoading(true);
    setError(null);
    const res = await subscribePriceAlert(from, to, Number(price));
    if (!res) {
      setError("Could not create alert. Please check your AirAPI credentials.");
    } else {
      setFrom("");
      setTo("");
      setPrice("");
      await loadAlerts();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await removePriceAlert(id);
    await loadAlerts();
  }

  return (
    <div className="min-h-[100dvh] pt-24 pb-20">
      <div className="container-app max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-[var(--accent-cta)]" />
            <h1 className="text-2xl font-bold">Fare Alerts</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Get notified when prices drop below your target.
          </p>
        </motion.div>

        {/* Subscribe Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-5 mb-8"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Alert
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">From</label>
              <input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} maxLength={3} placeholder="DEL" className="ghost-input w-full text-base font-semibold py-1" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">To</label>
              <input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} maxLength={3} placeholder="BOM" className="ghost-input w-full text-base font-semibold py-1" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Target (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="3500" className="ghost-input w-full text-base font-semibold py-1" />
            </div>
          </div>
          {error && (
            <div className="mt-2 text-xs text-[var(--accent-red)] flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> {error}
            </div>
          )}
          <button onClick={handleSubscribe} disabled={!from || !to || !price || loading}
            className="mt-3 w-full py-2.5 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-30 transition-opacity text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Set Alert
          </button>
        </motion.div>

        {/* Alert List */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Your Alerts</h3>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              No active alerts. Create one above!
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.is_active ? "bg-[var(--accent-green)]" : "bg-[var(--text-muted)]"}`} />
                    <div>
                      <div className="text-sm font-medium">{alert.source_airport} → {alert.destination_airport}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Notify at ₹{alert.target_price} · Expires {new Date(alert.expiry_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(alert.id)}
                    className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--accent-red)]/10 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
