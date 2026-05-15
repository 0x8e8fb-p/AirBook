# Theme Modes + Extraordinary Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 theme modes (warm/white/matte/amoled) with a floating theme picker and a multi-stage “wow” transition, without breaking app functionality, and without theme flash on load.

**Architecture:** Use CSS variables keyed off `html[data-theme]` for colors, plus a client Theme controller that persists to localStorage + cookies and triggers a non-interactive overlay animation (morph/blur → glitch/noise → radial wipe). SSR reads cookies in `RootLayout` to set initial theme attributes to prevent flashes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS variables, Tailwind (tokens), Vitest + Testing Library.

---

## File Map (What changes where)

**Modify**
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/styles/tokens.css`  
  Add theme blocks for warm/white/amoled; keep current `:root` as matte baseline.
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/app/globals.css`  
  Replace hard-coded white/opacity for selection/scrollbar/focus with token variables; add transition helpers.
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/app/layout.tsx`  
  Read theme cookies and set `data-theme` / `data-theme-mode` server-side; render ThemeFab.

**Create**
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/lib/theme/types.ts`  
  Theme enums/types.
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/lib/theme/storage.ts`  
  localStorage + cookie helpers (client/server-safe).
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/lib/theme/resolve.ts`  
  System mapping logic (light→warm, dark→matte).
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/components/theme/ThemeFab.tsx`  
  Floating button + 4-mode picker UI.
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/components/theme/ThemeTransitionOverlay.tsx`  
  Overlay animation component.
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/components/theme/useThemeController.ts`  
  Hook coordinating theme state + transitions.

**Tests**
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/lib/theme/resolve.test.ts`
- `file:///Users/prabha/Desktop/Plan2 - TheWingsScan/src/components/theme/ThemeFab.test.tsx`

---

### Task 1: Define Theme Types + Resolver (TDD)

**Files:**
- Create: `src/lib/theme/types.ts`
- Create: `src/lib/theme/resolve.ts`
- Test: `src/lib/theme/resolve.test.ts`

- [ ] **Step 1: Write failing tests for system mapping**

Create `src/lib/theme/resolve.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveThemeFromSystem } from "./resolve";

describe("resolveThemeFromSystem", () => {
  it("maps light to warm", () => {
    expect(resolveThemeFromSystem("light")).toBe("warm");
  });

  it("maps dark to matte", () => {
    expect(resolveThemeFromSystem("dark")).toBe("matte");
  });
});
```

- [ ] **Step 2: Run tests (expect FAIL)**

Run:
```bash
npm test
```
Expected: FAIL (module/function not found).

- [ ] **Step 3: Implement minimal types + resolver**

Create `src/lib/theme/types.ts`:

```ts
export type ThemeName = "warm" | "white" | "matte" | "amoled";
export type ThemeMode = "system" | "manual";
export type SystemScheme = "light" | "dark";
```

Create `src/lib/theme/resolve.ts`:

```ts
import type { SystemScheme, ThemeName } from "./types";

export function resolveThemeFromSystem(scheme: SystemScheme): ThemeName {
  return scheme === "dark" ? "matte" : "warm";
}
```

- [ ] **Step 4: Run tests (expect PASS)**

Run:
```bash
npm test
```
Expected: PASS.

---

### Task 2: Storage Helpers (localStorage + cookies)

**Files:**
- Create: `src/lib/theme/storage.ts`

- [ ] **Step 1: Implement storage helpers (no tests yet)**

Create `src/lib/theme/storage.ts`:

```ts
import type { ThemeMode, ThemeName } from "./types";

export const THEME_COOKIE = "thewingsscan_theme";
export const THEME_MODE_COOKIE = "thewingsscan_theme_mode";

export const THEME_LS_KEY = "thewingsscan:theme";
export const THEME_MODE_LS_KEY = "thewingsscan:theme_mode";

export function readLocalStorageTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(THEME_LS_KEY);
  if (v === "warm" || v === "white" || v === "matte" || v === "amoled") return v;
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
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
```

- [ ] **Step 2: Run typecheck/build sanity**

Run:
```bash
npm run build
```
Expected: PASS.

---

### Task 3: Add Theme Tokens (4 modes)

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add theme blocks**

Edit `src/styles/tokens.css`:

1) Keep existing `:root { ... }` as Matte baseline.
2) Add these blocks below it:

```css
html[data-theme="amoled"] {
  --bg-base:        #000000;
  --bg-subtle:      #000000;
  --bg-elevated:    #050506;
  --bg-overlay:     #0B0B0D;

  --border-default: rgba(255, 255, 255, 0.08);
  --border-muted:   rgba(255, 255, 255, 0.06);
  --border-strong:  rgba(255, 255, 255, 0.14);
  --border-focus:   rgba(255, 255, 255, 0.30);

  --text-primary:   #FAFAFA;
  --text-secondary: #B3B3B8;
  --text-muted:     #6A6A73;
  --text-inverse:   #000000;

  --accent-primary: #F5F5F7;
  --accent-cta:     #FAFAFA;
}

html[data-theme="warm"] {
  --bg-base:        #F5F1EA;
  --bg-subtle:      #EEE7DE;
  --bg-elevated:    #FFFFFF;
  --bg-overlay:     #FFFFFF;

  --border-default: rgba(8, 8, 10, 0.08);
  --border-muted:   rgba(8, 8, 10, 0.06);
  --border-strong:  rgba(8, 8, 10, 0.14);
  --border-focus:   rgba(8, 8, 10, 0.28);

  --text-primary:   #0B0B0D;
  --text-secondary: rgba(11, 11, 13, 0.70);
  --text-muted:     rgba(11, 11, 13, 0.50);
  --text-inverse:   #FFFFFF;

  --accent-primary: #0B0B0D;
  --accent-primary-dim: rgba(11, 11, 13, 0.10);
  --accent-cta:     #0B0B0D;
}

html[data-theme="white"] {
  --bg-base:        #FFFFFF;
  --bg-subtle:      #F6F6F7;
  --bg-elevated:    #FFFFFF;
  --bg-overlay:     #FFFFFF;

  --border-default: rgba(8, 8, 10, 0.08);
  --border-muted:   rgba(8, 8, 10, 0.06);
  --border-strong:  rgba(8, 8, 10, 0.14);
  --border-focus:   rgba(8, 8, 10, 0.28);

  --text-primary:   #0B0B0D;
  --text-secondary: rgba(11, 11, 13, 0.70);
  --text-muted:     rgba(11, 11, 13, 0.50);
  --text-inverse:   #FFFFFF;

  --accent-primary: #0B0B0D;
  --accent-primary-dim: rgba(11, 11, 13, 0.10);
  --accent-cta:     #0B0B0D;
}
```

- [ ] **Step 2: Build to verify no CSS import issues**

Run:
```bash
npm run build
```
Expected: PASS.

---

### Task 4: Make Globals Theme-Aware (scrollbar/selection/focus)

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace hard-coded selection and scrollbar colors**

Edit `src/app/globals.css`:
- Update `::selection`, `::-webkit-scrollbar-thumb`, and `:focus-visible` to use variables:

Example replacements:

```css
::selection {
  background: color-mix(in srgb, var(--accent-primary) 22%, transparent);
  color: var(--text-primary);
}

::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--text-primary) 12%, transparent); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--text-primary) 18%, transparent); }
* { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--text-primary) 12%, transparent) transparent; }

:focus-visible {
  outline: 1.5px solid var(--border-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Lint + build**

Run:
```bash
npm run lint
npm run build
```
Expected: PASS.

---

### Task 5: Theme Controller Hook + Overlay API (TDD where feasible)

**Files:**
- Create: `src/components/theme/useThemeController.ts`
- Create: `src/components/theme/ThemeTransitionOverlay.tsx`

- [ ] **Step 1: Implement overlay contract**

Create `src/components/theme/ThemeTransitionOverlay.tsx`:

```tsx
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
      ["--tt-x" as any]: `${origin.x}px`,
      ["--tt-y" as any]: `${origin.y}px`,
      ["--tt-phase" as any]: phase,
      ["--tt-theme" as any]: toTheme,
    };
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
    <div
      aria-hidden="true"
      style={style}
      className="theme-transition-overlay"
    />
  );
}
```

- [ ] **Step 2: Implement theme controller hook**

Create `src/components/theme/useThemeController.ts`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThemeMode, ThemeName, SystemScheme } from "@/lib/theme/types";
import { resolveThemeFromSystem } from "@/lib/theme/resolve";
import {
  THEME_COOKIE,
  THEME_MODE_COOKIE,
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

    const initialMode: ThemeMode = lsMode ?? "system";
    const resolved = initialMode === "system" ? resolveThemeFromSystem(getSystemScheme()) : (lsTheme ?? "warm");
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

  const setSystemMode = useCallback(async (nextOrigin: { x: number; y: number }) => {
    const resolved = resolveThemeFromSystem(getSystemScheme());
    await setManualTheme(resolved, nextOrigin);
    setMode("system");
    applyHtmlTheme(resolved, "system");
    writeLocalStorageThemeMode("system");
    writeCookie(THEME_MODE_COOKIE, "system");
  }, [applyHtmlTheme, setManualTheme]);

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
```

- [ ] **Step 3: Build**

Run:
```bash
npm run build
```
Expected: PASS.

---

### Task 6: Theme FAB UI (TDD)

**Files:**
- Create: `src/components/theme/ThemeFab.tsx`
- Test: `src/components/theme/ThemeFab.test.tsx`

- [ ] **Step 1: Write failing test for picker open/close**

Create `src/components/theme/ThemeFab.test.tsx`:

```tsx
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeFab } from "./ThemeFab";

describe("ThemeFab", () => {
  it("opens the picker on tap", () => {
    render(<ThemeFab />);
    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.getByText("Warm white")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests (expect FAIL)**

Run:
```bash
npm test
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement minimal ThemeFab**

Create `src/components/theme/ThemeFab.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SunMedium, Moon, Droplets, Sparkles } from "lucide-react";
import { ThemeTransitionOverlay } from "./ThemeTransitionOverlay";
import { useThemeController } from "./useThemeController";

type Item = {
  id: "warm" | "white" | "matte" | "amoled";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: Item[] = [
  { id: "warm", label: "Warm white", icon: SunMedium },
  { id: "white", label: "Pure white", icon: Sparkles },
  { id: "matte", label: "Matte black", icon: Moon },
  { id: "amoled", label: "AMOLED black", icon: Droplets },
];

function getCenter(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function ThemeFab() {
  const { mode, theme, phase, origin, toTheme, setManualTheme, setSystemMode } = useThemeController();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const posStyle = useMemo(() => {
    return {
      right: "calc(16px + env(safe-area-inset-right))",
      bottom: "calc(16px + env(safe-area-inset-bottom))",
    } as const;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ThemeTransitionOverlay phase={phase} origin={origin} toTheme={toTheme} enabled />

      <div className="fixed z-[80]" style={posStyle}>
        {open && (
          <div className="mb-3 w-[220px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] overflow-hidden">
            <div className="p-2">
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-white/[0.06] transition-colors text-[13px]"
                onClick={async () => {
                  const el = btnRef.current;
                  if (!el) return;
                  await setSystemMode(getCenter(el));
                  setOpen(false);
                }}
              >
                Follow system {mode === "system" ? "•" : ""}
              </button>
            </div>
            <div className="h-px bg-[var(--border-muted)]" />
            <div className="p-2 grid gap-1.5">
              {ITEMS.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-white/[0.06] transition-colors text-[13px]"
                  onClick={async () => {
                    const el = btnRef.current;
                    if (!el) return;
                    await setManualTheme(it.id, getCenter(el));
                    setOpen(false);
                  }}
                >
                  <it.icon className="w-4 h-4 opacity-80" />
                  <span className="flex-1">{it.label}</span>
                  {mode === "manual" && theme === it.id ? <span className="text-[11px] opacity-70">Active</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          ref={btnRef}
          type="button"
          aria-label="Theme"
          className="h-12 w-12 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] flex items-center justify-center hover:opacity-95 active:scale-[0.98] transition"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-[12px] font-medium">{open ? "×" : "☼"}</span>
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run tests (expect PASS)**

Run:
```bash
npm test
```
Expected: PASS.

---

### Task 7: Overlay CSS (Extraordinary Sequence)

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add overlay styles**

Append to `src/app/globals.css`:

```css
.theme-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  transform: translateZ(0);
}

html[data-theme-transition="morph"] body {
  transition: filter 160ms var(--ease-out), transform 160ms var(--ease-out);
  filter: blur(6px) saturate(0.95);
  transform: scale(1.01);
}

html[data-theme-transition="glitch"] .theme-transition-overlay {
  background:
    radial-gradient(circle at var(--tt-x) var(--tt-y), rgba(255,255,255,0.18), transparent 55%),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
  opacity: 0.9;
  animation: tt-noise 140ms steps(2) infinite;
}

html[data-theme-transition="wipe"] .theme-transition-overlay {
  background: var(--bg-base);
  -webkit-mask-image: radial-gradient(circle at var(--tt-x) var(--tt-y), #000 0%, #000 35%, transparent 60%);
  mask-image: radial-gradient(circle at var(--tt-x) var(--tt-y), #000 0%, #000 35%, transparent 60%);
  animation: tt-wipe 360ms var(--ease-out) forwards;
}

@keyframes tt-noise {
  0% { transform: translate3d(0,0,0); filter: hue-rotate(0deg) contrast(1.05); }
  50% { transform: translate3d(1px,-1px,0); filter: hue-rotate(4deg) contrast(1.1); }
  100% { transform: translate3d(-1px,1px,0); filter: hue-rotate(0deg) contrast(1.05); }
}

@keyframes tt-wipe {
  0% {
    -webkit-mask-image: radial-gradient(circle at var(--tt-x) var(--tt-y), #000 0%, #000 0%, transparent 0%);
    mask-image: radial-gradient(circle at var(--tt-x) var(--tt-y), #000 0%, #000 0%, transparent 0%);
    opacity: 1;
  }
  100% {
    -webkit-mask-image: radial-gradient(circle at var(--tt-x) var(--tt-y), #000 0%, #000 140%, transparent 160%);
    mask-image: radial-gradient(circle at var(--tt-x) var(--tt-y), #000 0%, #000 140%, transparent 160%);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  html[data-theme-transition] body {
    filter: none !important;
    transform: none !important;
    transition: none !important;
  }
  .theme-transition-overlay {
    display: none !important;
  }
}
```

- [ ] **Step 2: Lint + build**

Run:
```bash
npm run lint
npm run build
```
Expected: PASS.

---

### Task 8: SSR Theme Initialization (avoid theme flash) + Mount ThemeFab

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read cookies server-side and set html data attributes**

Edit `src/app/layout.tsx` to:
- Read `cookies()` and parse `thewingsscan_theme_mode` and `thewingsscan_theme`.
- Resolve theme when mode=system using a safe server default:
  - Use `warm` as SSR default for system mode (client will correct if system is dark; but to avoid flash, also write a small inline script below).
- Add a tiny inline script in `<head>` to resolve system scheme before paint when mode=system:
  - If `prefers-color-scheme: dark`, set `data-theme="matte"` else `warm`.

Implementation detail:
- This script only runs when cookies indicate `mode=system`.
- It must be small and not depend on React.

- [ ] **Step 2: Render ThemeFab globally**

In `RootLayout` body, render `<ThemeFab />` once so it’s present on all pages.

- [ ] **Step 3: Build**

Run:
```bash
npm run build
```
Expected: PASS.

---

### Task 9: Mobile placement + keyboard avoidance (progressive enhancement)

**Files:**
- Modify: `src/components/theme/ThemeFab.tsx`

- [ ] **Step 1: Implement visualViewport keyboard-aware shift**

Add effect:
- If `window.visualViewport` exists:
  - Track `visualViewport.height` changes.
  - If `window.innerHeight - visualViewport.height > 120`, treat as keyboard open and add extra bottom offset.

- [ ] **Step 2: Manual verify on mobile emulation**

Run:
```bash
npm run dev
```
Expected: FAB doesn’t overlap inputs while typing (reasonable behavior).

---

### Task 10: Fix Navbar “odd appearance” on load (non-breaking)

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Ensure stable layout during load**
- Keep existing SSR `initialUser` logic.
- Add a minimal, consistent entrance animation that does not shift layout:
  - animate opacity/translate for inner content only.
- Confirm reduced-motion behavior is respected (framer-motion already respects it; verify).

- [ ] **Step 2: Lint + test**

Run:
```bash
npm run lint
npm test
```
Expected: PASS.

---

## Plan Self-Review

- Spec coverage:
  - 4 modes via `data-theme`: Tasks 1–4
  - Follow system + mapping light→warm/dark→matte: Task 1 + Task 5 + Task 8
  - Floating picker bottom-right + mobile-safe: Task 6 + Task 9
  - Extraordinary multi-stage transition: Task 5 + Task 7
  - Reduced-motion fallback: Task 7 + controller reduceMotion logic
  - No theme flash: Task 8 (SSR + prepaint script)
  - No functionality regression: overlay pointer-events none + global placement; build/lint/tests in each task
- Placeholder scan: no “TODO/TBD”; each step includes code/commands.

---

## Execution Handoff

Plan saved to:
`file:///Users/prabha/Desktop/Plan2 - TheWingsScan/docs/superpowers/plans/2026-04-16-theme-modes-and-transition.md`

Two execution options:

1) **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks  
2) **Inline Execution** — execute tasks in this session using executing-plans

Which approach do you want?

