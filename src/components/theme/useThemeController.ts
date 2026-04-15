"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThemeMode, ThemeName, SystemScheme } from "@/lib/theme/types";
import { resolveThemeFromSystem } from "@/lib/theme/resolve";
import {
  THEME_COOKIE,
  THEME_MODE_COOKIE,
  readCookie,
  readLocalStorageTheme,
  readLocalStorageThemeMode,
  writeCookie,
  writeLocalStorageTheme,
  writeLocalStorageThemeMode,
} from "@/lib/theme/storage";
import type { ThemeTransitionPhase } from "./ThemeTransitionOverlay";

function getSystemScheme(): SystemScheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useThemeController() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<ThemeName>("warm");
  const [phase, setPhase] = useState<ThemeTransitionPhase>("idle");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [toTheme, setToTheme] = useState<ThemeName>("warm");
  const [radius, setRadius] = useState(0);

  const animatingRef = useRef(false);

  const applyHtmlTheme = useCallback((t: ThemeName, m: ThemeMode) => {
    const root = document.documentElement;
    root.dataset.theme = t;
    root.dataset.themeMode = m;
  }, []);

  const computeRadius = useCallback((o: { x: number; y: number }) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.ceil(
      Math.max(
        Math.hypot(o.x, o.y),
        Math.hypot(w - o.x, o.y),
        Math.hypot(o.x, h - o.y),
        Math.hypot(w - o.x, h - o.y)
      )
    );
  }, []);

  useEffect(() => {
    const lsMode = readLocalStorageThemeMode();
    const lsTheme = readLocalStorageTheme();

    const cookieModeRaw = readCookie(THEME_MODE_COOKIE);
    const cookieMode: ThemeMode | null =
      cookieModeRaw === "system" || cookieModeRaw === "manual" ? cookieModeRaw : null;

    const cookieThemeRaw = readCookie(THEME_COOKIE);
    const cookieTheme: ThemeName | null =
      cookieThemeRaw === "warm" ||
      cookieThemeRaw === "matte"
        ? cookieThemeRaw
        : null;

    const initialMode: ThemeMode = lsMode ?? cookieMode ?? "system";
    const resolved =
      initialMode === "system"
        ? resolveThemeFromSystem(getSystemScheme())
        : (lsTheme ?? cookieTheme ?? "warm");
    const initialTheme: ThemeName = resolved;

    setMode(initialMode);
    setTheme(initialTheme);
    applyHtmlTheme(initialTheme, initialMode);

    writeCookie(THEME_MODE_COOKIE, initialMode);
    writeCookie(THEME_COOKIE, initialTheme);
  }, [applyHtmlTheme]);

  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveThemeFromSystem(getSystemScheme());
      setTheme(next);
      applyHtmlTheme(next, "system");
      writeCookie(THEME_MODE_COOKIE, "system");
      writeCookie(THEME_COOKIE, next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode, applyHtmlTheme]);

  const setManualTheme = useCallback(
    async (nextTheme: ThemeName, nextOrigin: { x: number; y: number }) => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      setOrigin(nextOrigin);
      setToTheme(nextTheme);
      const r = computeRadius(nextOrigin);
      setRadius(r);

      const run = async () => {
        setPhase("wipe");
        await new Promise((r2) => setTimeout(r2, 680));
        setMode("manual");
        setTheme(nextTheme);
        applyHtmlTheme(nextTheme, "manual");
        setPhase("idle");
      };

      try {
        await run();
      } finally {
        writeLocalStorageThemeMode("manual");
        writeLocalStorageTheme(nextTheme);
        writeCookie(THEME_MODE_COOKIE, "manual");
        writeCookie(THEME_COOKIE, nextTheme);
        animatingRef.current = false;
      }
    },
    [applyHtmlTheme, computeRadius]
  );

  const setSystemMode = useCallback(
    async (nextOrigin: { x: number; y: number }) => {
      const resolved = resolveThemeFromSystem(getSystemScheme());
      if (animatingRef.current) return;
      animatingRef.current = true;

      setOrigin(nextOrigin);
      setToTheme(resolved);
      const r = computeRadius(nextOrigin);
      setRadius(r);

      const run = async () => {
        setPhase("wipe");
        await new Promise((r2) => setTimeout(r2, 680));
        setMode("system");
        setTheme(resolved);
        applyHtmlTheme(resolved, "system");
        setPhase("idle");
      };

      try {
        await run();
      } finally {
        writeLocalStorageThemeMode("system");
        writeCookie(THEME_MODE_COOKIE, "system");
        writeCookie(THEME_COOKIE, resolved);
        animatingRef.current = false;
      }
    },
    [applyHtmlTheme, computeRadius]
  );

  return {
    mode,
    theme,
    phase,
    origin,
    toTheme,
    radius,
    setManualTheme,
    setSystemMode,
  };
}
