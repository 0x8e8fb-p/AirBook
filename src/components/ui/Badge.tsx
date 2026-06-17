"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "live";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  /** Show a pulsing dot before the label (auto-on for the "live" variant). */
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--accent-primary-dim)] text-[var(--text-secondary)] border-[var(--border-default)]",
  success:
    "bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)] text-[var(--accent-green)] border-[color-mix(in_srgb,var(--accent-green)_20%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] text-[var(--accent-amber)] border-[color-mix(in_srgb,var(--accent-amber)_22%,transparent)]",
  danger:
    "bg-[color-mix(in_srgb,var(--accent-red)_10%,transparent)] text-[var(--accent-red)] border-[color-mix(in_srgb,var(--accent-red)_20%,transparent)]",
  info:
    "bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] text-[var(--accent-cyan)] border-[color-mix(in_srgb,var(--accent-cyan)_22%,transparent)]",
  live:
    "bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)] text-[var(--accent-green)] border-[color-mix(in_srgb,var(--accent-green)_24%,transparent)]",
};

export function Badge({
  variant = "default",
  children,
  className,
  pulse,
}: BadgeProps) {
  const showPulse = pulse ?? variant === "live";
  const dotTone =
    variant === "warning"
      ? "amber"
      : variant === "info"
        ? "cyan"
        : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        variantStyles[variant],
        className,
      )}
    >
      {showPulse && (
        <span aria-hidden="true" className={cn("pulse-dot", dotTone)} />
      )}
      {children}
    </span>
  );
}

