"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn(
      "bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)]",
      className
    )}>
      {children}
    </div>
  );
}
