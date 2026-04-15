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

type ViewTransitionLike = { finished: Promise<void> };
type StartViewTransition = (updateCallback: () => void) => ViewTransitionLike;

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
  const startViewTransition: StartViewTransition | null =
    typeof document !== "undefined"
      ? ((document as unknown as { startViewTransition?: StartViewTransition })
          .startViewTransition ?? null)
      : null;
  const supportsViewTransition = !!startViewTransition;

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

  const setViewTransitionVars = useCallback((o: { x: number; y: number }, r: number) => {
    const root = document.documentElement;
    root.style.setProperty("--vt-x", `${o.x}px`);
    root.style.setProperty("--vt-y", `${o.y}px`);
    root.style.setProperty("--vt-r", `${r}px`);
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
        if (supportsViewTransition) {
          setViewTransitionVars(nextOrigin, r);
          setMode("manual");
          setTheme(nextTheme);

          const vt = startViewTransition(() => {
            applyHtmlTheme(nextTheme, "manual");
          });

          await vt.finished;
          return;
        }

        setPhase("wipe");
        await new Promise((r2) => setTimeout(r2, 680));
        setMode("manual");
        setTheme(nextTheme);
        applyHtmlTheme(nextTheme, "manual");
        await new Promise((r2) => setTimeout(r2, 60));
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
    [applyHtmlTheme, computeRadius, setViewTransitionVars, startViewTransition, supportsViewTransition]
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
        if (supportsViewTransition) {
          setViewTransitionVars(nextOrigin, r);
          setMode("system");
          setTheme(resolved);

          const vt = startViewTransition(() => {
            applyHtmlTheme(resolved, "system");
          });

          await vt.finished;
          return;
        }

        setPhase("wipe");
        await new Promise((r2) => setTimeout(r2, 680));
        setMode("system");
        setTheme(resolved);
        applyHtmlTheme(resolved, "system");
        await new Promise((r2) => setTimeout(r2, 60));
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
    [applyHtmlTheme, computeRadius, setViewTransitionVars, startViewTransition, supportsViewTransition]
  );

  return {
    mode,
    theme,
    phase,
    origin,
    toTheme,
    radius,
    supportsViewTransition,
    setManualTheme,
    setSystemMode,
  };
}
