"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PriceTickerProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function PriceTicker({
  value,
  duration = 1.2,
  prefix = "₹",
  suffix,
  className,
}: PriceTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    startRef.current = start;

    function animate(now: number) {
      const elapsed = (now - startRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted = new Intl.NumberFormat("en-IN").format(displayValue);

  return (
    <span
      ref={elRef}
      className={cn("font-mono-price tabular-nums", className)}
      aria-live="polite"
      aria-label={`${prefix}${formatted}${suffix ? ` ${suffix}` : ""}`}
    >
      {prefix}
      {formatted}
      {suffix && <span className="ml-1 text-[0.8em] opacity-70">{suffix}</span>}
    </span>
  );
}
