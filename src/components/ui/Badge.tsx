"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "deal";
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantStyles: Record<string, string> = {
  default: "bg-white/5 text-[var(--text-secondary)] border-white/10",
  success: "bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20",
  warning: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border-[var(--accent-amber)]/20",
  danger: "bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20",
  deal: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20",
};

export function Badge({ variant = "default", children, className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-full)] border",
        "transition-colors duration-[var(--duration-base)]",
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
