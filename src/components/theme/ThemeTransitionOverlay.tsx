"use client";

import { useEffect, useMemo } from "react";
import type { ThemeName } from "@/lib/theme/types";

export type ThemeTransitionPhase = "idle" | "morph" | "glitch" | "chroma" | "wipe";

const THEME_SURFACES: Record<ThemeName, { bgBase: string; accent: string }> = {
  warm: { bgBase: "#F5F1EA", accent: "#0B0B0D" },
  matte: { bgBase: "#09090B", accent: "#FAFAFA" },
};

export function ThemeTransitionOverlay({
  phase,
  origin,
  toTheme,
  enabled,
}: {
  phase: ThemeTransitionPhase;
  origin: { x: number; y: number };
  toTheme: ThemeName;
  enabled: boolean;
}) {
  const style = useMemo(() => {
    const s = THEME_SURFACES[toTheme];
    return {
      ["--tt-x" as string]: `${origin.x}px`,
      ["--tt-y" as string]: `${origin.y}px`,
      ["--tt-phase" as string]: phase,
      ["--tt-theme" as string]: toTheme,
      ["--tt-bg-base" as string]: s.bgBase,
      ["--tt-accent" as string]: s.accent,
    } satisfies Record<string, string>;
  }, [origin.x, origin.y, phase, toTheme]);

  useEffect(() => {
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
