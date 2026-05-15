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
      (window as unknown as { __thewingsscanLenis?: LenisLike }).__thewingsscanLenis ?? null;
    lenis?.stop();

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    const htmlStyle = document.documentElement.style;
    const htmlPrev = {
      overflow: htmlStyle.overflow,
      paddingRight: htmlStyle.paddingRight,
    };

    const bodyStyle = document.body.style;
    const bodyPrev = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      left: bodyStyle.left,
      right: bodyStyle.right,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
    };

    htmlStyle.overflow = "hidden";
    htmlStyle.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${y}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";

    const locked: LockedScroll = {
      x,
      y,
      lenis,
      cleanup: () => {
        bodyStyle.position = bodyPrev.position;
        bodyStyle.top = bodyPrev.top;
        bodyStyle.left = bodyPrev.left;
        bodyStyle.right = bodyPrev.right;
        bodyStyle.width = bodyPrev.width;
        bodyStyle.overflow = bodyPrev.overflow;

        htmlStyle.overflow = htmlPrev.overflow;
        htmlStyle.paddingRight = htmlPrev.paddingRight;

        window.scrollTo(x, y);
        lenis?.scrollTo?.(y, { immediate: true, force: true });
        lenis?.start();
      },
    };

    lockedScrollRef.current = locked;
    return locked;
  }, []);

  const unlockScroll = useCallback((locked: LockedScroll) => {
    locked.cleanup();
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
