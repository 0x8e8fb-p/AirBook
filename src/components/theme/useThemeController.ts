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

type LockedScroll = {
  x: number;
  y: number;
  lenis: LenisLike | null;
  cleanup: () => void;
};

type LenisLike = {
  stop: () => void;
  start: () => void;
  scrollTo?: (target: number, options?: { immediate?: boolean; force?: boolean }) => void;
};

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
  const [scroll, setScroll] = useState({ x: 0, y: 0 });

  const animatingRef = useRef(false);
  const lockedScrollRef = useRef<LockedScroll | null>(null);

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

  const lockScroll = useCallback((): LockedScroll => {
    lockedScrollRef.current?.cleanup();
    lockedScrollRef.current = null;

    const x = window.scrollX;
    const y = window.scrollY;
    const lenis =
      (window as unknown as { __airbookLenis?: LenisLike }).__airbookLenis ?? null;
    lenis?.stop();

    const keep = () => {
      if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      if (
        k === " " ||
        k === "PageUp" ||
        k === "PageDown" ||
        k === "Home" ||
        k === "End" ||
        k === "ArrowUp" ||
        k === "ArrowDown"
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("scroll", keep, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown, { passive: false });

    const locked: LockedScroll = {
      x,
      y,
      lenis,
      cleanup: () => {
        window.removeEventListener("scroll", keep);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("keydown", onKeyDown);
        lenis?.start();
      },
    };

    lockedScrollRef.current = locked;
    return locked;
  }, []);

  const unlockScroll = useCallback((locked: LockedScroll) => {
    locked.cleanup();
    locked.lenis?.scrollTo?.(locked.y, { immediate: true, force: true });
    window.scrollTo(locked.x, locked.y);
    lockedScrollRef.current = null;
  }, []);

  useEffect(() => {
    if (phase !== "idle") return;
    lockedScrollRef.current?.cleanup();
    lockedScrollRef.current = null;
  }, [phase]);

  useEffect(() => {
    return () => {
      lockedScrollRef.current?.cleanup();
      lockedScrollRef.current = null;
    };
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

      if (mode === "manual" && nextTheme === theme) return;
      if (mode === "system" && nextTheme === theme) {
        setMode("manual");
        writeLocalStorageThemeMode("manual");
        writeLocalStorageTheme(nextTheme);
        writeCookie(THEME_MODE_COOKIE, "manual");
        writeCookie(THEME_COOKIE, nextTheme);
        applyHtmlTheme(nextTheme, "manual");
        return;
      }

      animatingRef.current = true;

      setScroll({ x: window.scrollX, y: window.scrollY });
      setOrigin(nextOrigin);
      setToTheme(nextTheme);
      const r = computeRadius(nextOrigin);
      setRadius(r);

      const run = async () => {
        const locked = lockScroll();
        let unlocked = false;
        try {
          setPhase("wipe");
          await new Promise((r2) => setTimeout(r2, 680));
          setMode("manual");
          setTheme(nextTheme);
          document.documentElement.dataset.themeSwap = "1";
          applyHtmlTheme(nextTheme, "manual");
          unlockScroll(locked);
          unlocked = true;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          );
          delete document.documentElement.dataset.themeSwap;
          setPhase("idle");
        } finally {
          if (!unlocked) unlockScroll(locked);
        }
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
    [applyHtmlTheme, computeRadius, lockScroll, mode, theme, unlockScroll]
  );

  const setSystemMode = useCallback(
    async (nextOrigin: { x: number; y: number }) => {
      const resolved = resolveThemeFromSystem(getSystemScheme());
      if (animatingRef.current) return;

      if (mode === "system" && resolved === theme) return;
      if (mode === "manual" && resolved === theme) {
        setMode("system");
        writeLocalStorageThemeMode("system");
        writeCookie(THEME_MODE_COOKIE, "system");
        writeCookie(THEME_COOKIE, resolved);
        applyHtmlTheme(resolved, "system");
        return;
      }

      animatingRef.current = true;

      setScroll({ x: window.scrollX, y: window.scrollY });
      setOrigin(nextOrigin);
      setToTheme(resolved);
      const r = computeRadius(nextOrigin);
      setRadius(r);

      const run = async () => {
        const locked = lockScroll();
        let unlocked = false;
        try {
          setPhase("wipe");
          await new Promise((r2) => setTimeout(r2, 680));
          setMode("system");
          setTheme(resolved);
          document.documentElement.dataset.themeSwap = "1";
          applyHtmlTheme(resolved, "system");
          unlockScroll(locked);
          unlocked = true;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          );
          delete document.documentElement.dataset.themeSwap;
          setPhase("idle");
        } finally {
          if (!unlocked) unlockScroll(locked);
        }
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
    [applyHtmlTheme, computeRadius, lockScroll, mode, theme, unlockScroll]
  );

  return {
    mode,
    theme,
    phase,
    origin,
    toTheme,
    radius,
    scroll,
    setManualTheme,
    setSystemMode,
  };
}
