import type { SystemScheme, ThemeName } from "./types";

export function resolveThemeFromSystem(scheme: SystemScheme): ThemeName {
  return scheme === "dark" ? "matte" : "warm";
}

