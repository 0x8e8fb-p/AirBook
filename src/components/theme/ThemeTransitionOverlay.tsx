"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ThemeName } from "@/lib/theme/types";

export type ThemeTransitionPhase = "idle" | "wipe";

const THEME_SURFACES: Record<ThemeName, { bgBase: string; accent: string }> = {
  warm: { bgBase: "#F5F1EA", accent: "#0B0B0D" },
  matte: { bgBase: "#09090B", accent: "#FAFAFA" },
};

export function ThemeTransitionOverlay({
  phase,
  origin,
  scroll,
  toTheme,
  radius,
  enabled,
}: {
  phase: ThemeTransitionPhase;
  origin: { x: number; y: number };
  scroll: { x: number; y: number };
  toTheme: ThemeName;
  radius: number;
  enabled: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    if (!enabled) return;
    if (phase !== "wipe") return;
    const host = hostRef.current;
    if (!host) return;
    const shell = document.getElementById("app-shell");
    if (!shell) return;

    host.replaceChildren();
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = `${-scroll.y}px`;
    wrapper.style.left = `${-scroll.x}px`;
    wrapper.style.width = "100%";

    const clone = shell.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-theme", toTheme);
    clone.style.pointerEvents = "none";
    clone.style.userSelect = "none";
    clone.style.webkitUserSelect = "none";
    clone.style.width = "100vw";
    clone.style.background = "var(--bg-base)";
    clone.style.color = "var(--text-primary)";

    wrapper.appendChild(clone);
    host.appendChild(wrapper);

    return () => {
      host.replaceChildren();
    };
  }, [enabled, phase, scroll.x, scroll.y, toTheme]);

  if (!enabled || phase === "idle") return null;

  return (
    <div ref={hostRef} aria-hidden="true" style={style} className="theme-transition-overlay" />
  );
}
