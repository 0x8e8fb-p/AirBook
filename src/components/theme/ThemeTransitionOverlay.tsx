"use client";

import { useLayoutEffect, useMemo } from "react";
import type { ThemeName } from "@/lib/theme/types";

export type ThemeTransitionPhase = "idle" | "wipe";

const THEME_SURFACES: Record<ThemeName, { bgBase: string; accent: string }> = {
  warm: { bgBase: "#F5F1EA", accent: "#0B0B0D" },
  matte: { bgBase: "#09090B", accent: "#FAFAFA" },
};

export function ThemeTransitionOverlay({
  phase,
  origin,
  toTheme,
  radius,
  enabled,
}: {
  phase: ThemeTransitionPhase;
  origin: { x: number; y: number };
  toTheme: ThemeName;
  radius: number;
  enabled: boolean;
}) {
  const style = useMemo(() => {
    const to = THEME_SURFACES[toTheme];
    return {
      ["--tt-x" as string]: `${origin.x}px`,
      ["--tt-y" as string]: `${origin.y}px`,
      ["--tt-r" as string]: `${radius}px`,
      ["--tt-phase" as string]: phase,
      ["--tt-to-bg-base" as string]: to.bgBase,
      ["--tt-accent" as string]: to.accent,
    } satisfies Record<string, string>;
  }, [origin.x, origin.y, radius, phase, toTheme]);

  useLayoutEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.themeTransition = phase;
    return () => {
      delete document.documentElement.dataset.themeTransition;
    };
  }, [phase, enabled]);

  if (!enabled || phase === "idle") return null;

  return (
    <div aria-hidden="true" style={style} className="theme-transition-overlay" />
  );
}
