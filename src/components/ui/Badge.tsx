"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-[var(--accent-primary-dim)] text-[var(--text-secondary)] border-[var(--border-default)]",
  success: "bg-[var(--accent-green)]/8 text-[var(--accent-green)] border-[var(--accent-green)]/15",
  warning: "bg-[var(--accent-primary-dim)] text-[var(--text-secondary)] border-[var(--border-default)]",
  danger: "bg-[var(--accent-red)]/8 text-[var(--accent-red)] border-[var(--accent-red)]/15",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border tracking-wide",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
