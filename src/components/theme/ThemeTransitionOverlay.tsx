"use client";

import { useEffect, useMemo } from "react";
import type { ThemeName } from "@/lib/theme/types";

export type ThemeTransitionPhase = "idle" | "morph" | "glitch" | "wipe";

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
    return {
      ["--tt-x" as string]: `${origin.x}px`,
      ["--tt-y" as string]: `${origin.y}px`,
      ["--tt-phase" as string]: phase,
      ["--tt-theme" as string]: toTheme,
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

