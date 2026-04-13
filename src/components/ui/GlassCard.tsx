"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  hover?: boolean;
}

const blurMap = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-xl",
  lg: "backdrop-blur-2xl",
};

export function GlassCard({
  children,
  className,
  blur = "md",
  hover = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-subtle)]/60 border border-[var(--border-strong)]",
        "rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]",
        blurMap[blur],
        "saturate-[1.8]",
        hover && [
          "transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]",
          "hover:border-[var(--accent-primary)]/20 hover:shadow-[var(--shadow-glow-cyan)]",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
