"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingDown, TrendingUp, Minus, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { createAlert } from "@/app/actions/alertActions";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

interface PriceHistory {
  id: string;
  departureDate: string;
  effectivePrice: number;
  basePrice: number;
  airline: string;
  recordedAt: string;
}

export function PriceTrendChart({ origin, destination, date }: { origin: string, destination: string, date: string }) {
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/prices/history?origin=${origin}&destination=${destination}&date=${date}`);
        const json = await res.json();
        
        if (json.success && json.history && json.history.length > 0) {
          const formatted = json.history.map((h: PriceHistory) => ({
            time: new Date(h.recordedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            price: h.effectivePrice,
            basePrice: h.basePrice,
            airline: h.airline
          }));
          
          if (isMounted) setData(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch price history", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [origin, destination, date]);

  if (loading || data.length < 2) {
    return null; // Don't show chart if we don't have enough data points to show a trend
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const diff = lastPrice - firstPrice;
  const isDrop = diff < 0;
  const isRise = diff > 0;

  const handleCreateAlert = async () => {
    if (!session?.user) {
      alert("Please sign in to create price alerts.");
      return;
    }
    setCreatingAlert(true);
    // Target price is 5% lower than current lowest
    const targetPrice = Math.floor(lastPrice * 0.95);
    const res = await createAlert(origin, destination, targetPrice);
    setCreatingAlert(false);
    if (res) {
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 3000);
    } else {
      alert("Failed to create alert.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 mb-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            Price Trend
            {isDrop && <span className="flex items-center text-[10px] bg-[var(--accent-green)]/10 text-[var(--accent-green)] px-1.5 py-0.5 rounded font-medium"><TrendingDown className="w-3 h-3 mr-1" /> Dropping</span>}
            {isRise && <span className="flex items-center text-[10px] bg-[var(--accent-red)]/10 text-[var(--accent-red)] px-1.5 py-0.5 rounded font-medium"><TrendingUp className="w-3 h-3 mr-1" /> Rising</span>}
            {!isDrop && !isRise && <span className="flex items-center text-[10px] bg-[var(--border-strong)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded font-medium"><Minus className="w-3 h-3 mr-1" /> Stable</span>}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Historical lowest prices for this route and date.</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xs text-[var(--text-muted)]">Current Lowest</div>
          <div className="font-mono-price font-semibold mb-2">{formatPrice(lastPrice)}</div>
          
          {session?.user && (
            <button 
              onClick={handleCreateAlert}
              disabled={creatingAlert || alertSuccess}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-[var(--radius-sm)] transition-colors ${
                alertSuccess 
                  ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)]" 
                  : "bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent-cta)] hover:text-[var(--accent-cta)]"
              }`}
            >
              {creatingAlert ? <Loader2 className="w-3 h-3 animate-spin" /> : alertSuccess ? <CheckCircle2 className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
              {alertSuccess ? "Alert Set" : "Alert me if it drops"}
            </button>
          )}
        </div>
      </div>
      
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDrop ? "var(--accent-green)" : isRise ? "var(--accent-red)" : "var(--accent-cta)"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isDrop ? "var(--accent-green)" : isRise ? "var(--accent-red)" : "var(--accent-cta)"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-muted)" />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={['dataMin - 500', 'dataMax + 500']} 
              hide 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}
              itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
              formatter={(value: any) => [formatPrice(Number(value)), 'Price']}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isDrop ? "var(--accent-green)" : isRise ? "var(--accent-red)" : "var(--accent-cta)"} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}