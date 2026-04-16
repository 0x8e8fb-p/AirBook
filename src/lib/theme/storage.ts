import type { ThemeMode, ThemeName } from "./types";

export const THEME_COOKIE = "airbook_theme";
export const THEME_MODE_COOKIE = "airbook_theme_mode";

const THEME_LS_KEY = "airbook:theme";
const THEME_MODE_LS_KEY = "airbook:theme_mode";

export function readLocalStorageTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(THEME_LS_KEY);
  if (v === "warm" || v === "matte") return v;
  return null;
}

export function readLocalStorageThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(THEME_MODE_LS_KEY);
  if (v === "system" || v === "manual") return v;
  return null;
}

export function writeLocalStorageTheme(theme: ThemeName) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_LS_KEY, theme);
}

export function writeLocalStorageThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_MODE_LS_KEY, mode);
}

export function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const n = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(n)) return decodeURIComponent(p.slice(n.length));
  }
  return null;
}
