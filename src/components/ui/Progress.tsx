"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export function Progress({ value, max = 100, className }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div
      className={cn(
        "h-1.5 w-full rounded-full bg-[var(--deep)] overflow-hidden",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--aurora-gold)] transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
