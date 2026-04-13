"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, Plane, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

interface PriceAlert {
  id: string;
  origin: string;
  destination: string;
  targetPrice: number;
  email: string;
  createdAt: string;
  active: boolean;
}

const DEMO_ALERTS: PriceAlert[] = [
  { id: "1", origin: "DEL", destination: "BOM", targetPrice: 4000, email: "user@example.com", createdAt: "2026-04-10", active: true },
  { id: "2", origin: "BLR", destination: "GOI", targetPrice: 3500, email: "user@example.com", createdAt: "2026-04-12", active: true },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(DEMO_ALERTS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ origin: "", destination: "", targetPrice: "", email: "" });

  const handleCreate = () => {
    if (!form.origin || !form.destination || !form.targetPrice || !form.email) return;
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      origin: form.origin.toUpperCase(),
      destination: form.destination.toUpperCase(),
      targetPrice: parseInt(form.targetPrice),
      email: form.email,
      createdAt: new Date().toISOString().split("T")[0],
      active: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setForm({ origin: "", destination: "", targetPrice: "", email: "" });
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggle = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="min-h-[100dvh]">
      <div className="container-app py-12 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-bold tracking-tight mb-2">Price Alerts</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Get notified when fares drop below your target price.
          </p>
        </motion.div>

        {/* Create Alert */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-3 border border-dashed border-[var(--border-strong)] rounded-[var(--radius-lg)] text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Alert
            </button>
          ) : (
            <div className="border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 bg-[var(--bg-subtle)]">
              <h3 className="text-sm font-semibold mb-4">New Alert</h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">From (IATA)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    placeholder="DEL"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">To (IATA)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="BOM"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Target Price (₹)</label>
                  <input
                    type="number"
                    value={form.targetPrice}
                    onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                    placeholder="4000"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-[var(--accent-cta)] text-[var(--text-inverse)] text-sm font-medium rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Alert List */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">No alerts yet. Create one to get started.</p>
            </div>
          ) : (
            alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`border rounded-[var(--radius-lg)] p-4 flex items-center gap-4 transition-colors ${
                  alert.active ? "border-[var(--border-default)]" : "border-[var(--border-muted)] opacity-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <span>{alert.origin}</span>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>{alert.destination}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Alert when below <span className="font-mono font-medium text-[var(--text-secondary)]">₹{alert.targetPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(alert.id)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      alert.active ? "bg-[var(--accent-green)]/30" : "bg-white/[0.06]"
                    }`}
                    aria-label={alert.active ? "Disable alert" : "Enable alert"}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      alert.active ? "left-[18px] bg-[var(--accent-green)]" : "left-0.5 bg-[var(--text-muted)]"
                    }`} />
                  </button>

                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                    aria-label="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
