"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { createPriceFreeze } from "@/app/actions/priceFreezeActions";
import { formatPrice } from "@/lib/constants";

interface Props {
  origin: string;
  destination: string;
  departureDate: string;
  airline: string;
  flightNumber?: string | null;
  lockedPrice: number;
  basePrice: number;
}

type State = "idle" | "loading" | "locked" | "error";

export function PriceFreezeButton(props: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    if (!session?.user) {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    setState("loading");
    const res = await createPriceFreeze(props);
    if (res.success) {
      setState("locked");
      setMsg(res.alreadyExisted ? "Already locked" : "Locked for 24h");
    } else {
      setState("error");
      setMsg(res.error ?? "Failed");
    }
  }

  if (state === "locked") {
    return (
      <div className="w-full py-3 px-4 rounded-[var(--radius-lg)] border border-[var(--accent-green)]/40 bg-[var(--accent-green)]/10 flex items-center gap-2 text-sm">
        <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" />
        <div className="flex-1">
          <div className="font-semibold text-[var(--accent-green)]">
            Price locked at {formatPrice(props.lockedPrice)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {msg} — complete booking before expiry
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={state === "loading"}
        className="w-full py-3 px-4 rounded-[var(--radius-lg)] border border-[var(--accent-cta)]/40 bg-[var(--accent-cta)]/5 hover:bg-[var(--accent-cta)]/10 transition-colors flex items-center gap-2 text-sm disabled:opacity-60"
      >
        <Lock className="w-4 h-4 text-[var(--accent-cta)]" />
        <div className="flex-1 text-left">
          <div className="font-semibold text-[var(--accent-cta)]">
            {state === "loading" ? "Locking…" : "Lock this price for 24h"}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Compare later without losing this fare
          </div>
        </div>
      </button>
      {state === "error" && msg && (
        <div className="mt-1 text-[11px] text-red-500">{msg}</div>
      )}
    </div>
  );
}
