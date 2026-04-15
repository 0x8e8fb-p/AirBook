"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useThemeController() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<ThemeName>("warm");
  const [phase, setPhase] = useState<ThemeTransitionPhase>("idle");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [toTheme, setToTheme] = useState<ThemeName>("warm");

  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const animatingRef = useRef(false);

  const applyHtmlTheme = useCallback((t: ThemeName, m: ThemeMode) => {
    const root = document.documentElement;
    root.dataset.theme = t;
    root.dataset.themeMode = m;
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
      cookieThemeRaw === "white" ||
      cookieThemeRaw === "matte" ||
      cookieThemeRaw === "amoled"
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

      const run = async () => {
        if (reduceMotion) {
          setPhase("morph");
          await new Promise((r) => setTimeout(r, 120));
          setMode("manual");
          setTheme(nextTheme);
          applyHtmlTheme(nextTheme, "manual");
          setPhase("idle");
          return;
        }

        setPhase("morph");
        await new Promise((r) => setTimeout(r, 160));
        setPhase("glitch");
        await new Promise((r) => setTimeout(r, 160));
        setMode("manual");
        setTheme(nextTheme);
        applyHtmlTheme(nextTheme, "manual");
        setPhase("wipe");
        await new Promise((r) => setTimeout(r, 360));
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
    [applyHtmlTheme, reduceMotion]
  );

  const setSystemMode = useCallback(
    async (nextOrigin: { x: number; y: number }) => {
      const resolved = resolveThemeFromSystem(getSystemScheme());
      await setManualTheme(resolved, nextOrigin);
      setMode("system");
      applyHtmlTheme(resolved, "system");
      writeLocalStorageThemeMode("system");
      writeCookie(THEME_MODE_COOKIE, "system");
    },
    [applyHtmlTheme, setManualTheme]
  );

  return {
    mode,
    theme,
    phase,
    origin,
    toTheme,
    setManualTheme,
    setSystemMode,
  };
}
