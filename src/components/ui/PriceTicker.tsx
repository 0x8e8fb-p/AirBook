"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export function PriceTicker({
  value,
  prefix = "",
  suffix = "",
  className = "",
  duration = 1.2
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayReady, setDisplayReady] = useState(false);

  useEffect(() => {
    setDisplayReady(true);
    // Don't animate if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      count.set(value);
      return;
    }
    
    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1] // Custom Expo Out
    });

    return controls.stop;
  }, [value, duration, count]);

  if (!displayReady) return <span className={className}>{prefix}{value}{suffix}</span>;

  return (
    <span className={`inline-flex items-center ${className}`}>
      {prefix && <span className="opacity-80 mr-1">{prefix}</span>}
      <motion.span>{rounded}</motion.span>
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}
