"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Adds an animated gradient border kiss for premium surfaces. */
  glow?: boolean;
  /** Adds a spring-physics hover lift. */
  hoverable?: boolean;
  /** Adds a layered cinematic shadow (hero surfaces). */
  cinematic?: boolean;
}

export function GlassCard({
  children,
  className,
  glow = false,
  hoverable = false,
  cinematic = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-xl)] border border-[var(--border-default)]",
        "bg-[color-mix(in_srgb,var(--bg-subtle)_92%,transparent)]",
        "backdrop-blur-xl",
        cinematic && "shadow-[var(--depth-hero)]",
        !cinematic && "shadow-[var(--depth-soft)]",
        hoverable && "hover-lift",
        glow && "gradient-border-kiss",
        className,
      )}
    >
      {children}
    </div>
  );
}

