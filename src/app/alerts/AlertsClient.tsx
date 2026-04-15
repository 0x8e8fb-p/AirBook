"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, ArrowRight } from "lucide-react";
import { createAlert, deleteAlert, toggleAlert } from "./actions";

interface DBAlert {
  id: string;
  origin: string;
  destination: string;
  target_price: number;
  is_active: boolean;
  created_at: string;
}

export function AlertsClient({ initialAlerts }: { initialAlerts: DBAlert[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true);
    await createAlert(formData);
    setIsSubmitting(false);
    setShowCreate(false);
  };

  return (
    <div className="container-app py-12 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-2xl font-bold tracking-tight mb-2">Price Alerts</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Get notified when fares drop below your target price.
        </p>
      </motion.div>

      {/* Create Alert */}
      <div className="mb-8">
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 border border-dashed border-[var(--border-strong)] rounded-[var(--radius-lg)] text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        ) : (
          <form action={handleCreate} className="border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 bg-[var(--bg-subtle)]">
            <h3 className="text-sm font-semibold mb-4">New Alert</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">From (IATA)</label>
                <input
                  name="origin"
                  required
                  type="text"
                  maxLength={3}
                  placeholder="DEL"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">To (IATA)</label>
                <input
                  name="destination"
                  required
                  type="text"
                  maxLength={3}
                  placeholder="BOM"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors uppercase"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Target Price (₹)</label>
              <input
                name="targetPrice"
                required
                type="number"
                placeholder="4000"
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[var(--accent-cta)] text-[var(--text-inverse)] text-sm font-medium rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {initialAlerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">No alerts yet. Create one to get started.</p>
          </div>
        ) : (
          initialAlerts.map((alert) => (
            <motion.div
              layout
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-[var(--radius-lg)] p-4 flex items-center gap-4 transition-colors ${
                alert.is_active ? "border-[var(--border-default)]" : "border-[var(--border-muted)] opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <span>{alert.origin}</span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>{alert.destination}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Alert when below <span className="font-mono font-medium text-[var(--text-secondary)]">₹{alert.target_price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle */}
                <button
                  onClick={() => toggleAlert(alert.id, alert.is_active)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    alert.is_active ? "bg-[var(--accent-green)]/30" : "bg-[var(--accent-primary-dim)]"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    alert.is_active ? "left-[18px] bg-[var(--accent-green)]" : "left-0.5 bg-[var(--text-muted)]"
                  }`} />
                </button>

                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
