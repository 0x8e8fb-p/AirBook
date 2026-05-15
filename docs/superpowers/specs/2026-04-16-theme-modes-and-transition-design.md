# Theme Modes + Extraordinary Transitions (Design)

Date: 2026-04-16  
Project: TheWingsScan (Next.js)  
Scope: UI theming (4 modes), floating theme picker, extraordinary theme-switch transitions, prevent flashes and UI glitches, no feature regressions.

## Goals

- Provide 4 visual modes:
  - Warm white (eye-friendly)
  - Pure white
  - Matte black
  - AMOLED black
- Default behavior:
  - Follow system
  - System Light → Warm white
  - System Dark → Matte black
- Theme switching should feel “extraordinary” and impressive while remaining:
  - Platform independent
  - Accessible (reduced-motion friendly)
  - Non-breaking (no impact on routing/auth/forms/DB features)
- UI should not flash the wrong theme on initial load (no FOUC).
- Floating theme picker:
  - Desktop: bottom-right
  - Mobile/small devices: safe-area aware positioning, avoids browser UI and keyboard overlap.
- Fix any “odd appearance” of top navigation during page load (reduce layout shift, make entrance intentional).

## Non-Goals

- No redesign of pages/components beyond what’s required for correct theming and transitions.
- No new backend/DB behavior.
- No dependency on browser-only APIs without a fallback (e.g., View Transitions API optional).

## Current State (Observed)

- Styling is primarily via CSS variables in `src/styles/tokens.css` imported by `src/app/globals.css`.
- Root layout currently sets `html` class with `dark` and uses server-provided user to avoid auth header flicker.
- There is no theme mode infrastructure (no data-theme, cookie/localStorage theme selection).

## Proposed Architecture

### 1) Theme Source of Truth

- Use `data-theme` on `<html>`:
  - `warm | white | matte | amoled`
- Use `data-theme-mode` on `<html>`:
  - `system | manual`
- `data-theme` is always the resolved, concrete theme.
- When `data-theme-mode="system"`, the concrete theme is computed from `prefers-color-scheme`:
  - light → warm
  - dark → matte

### 2) Persistence Strategy (No Theme Flash)

We persist both:
- `localStorage` for quick client reads and user preference retention
- Cookie for SSR so the first server render matches the user preference

Cookie format:
- `thewingsscan_theme_mode=system|manual`
- `thewingsscan_theme=warm|white|matte|amoled` (only meaningful when mode=manual)

SSR responsibility:
- `RootLayout` reads cookies and sets initial `data-theme-mode` and `data-theme`.

Client responsibility:
- On mount, reconcile localStorage vs cookie (prefer localStorage if present, then write cookie to match).
- Attach `matchMedia('(prefers-color-scheme: dark)')` listener only when mode=system.

### 3) Theme Tokens (CSS Variables)

`tokens.css` changes:
- Keep current `:root` values as Matte black baseline.
- Add:
  - `html[data-theme="warm"] { ... }`
  - `html[data-theme="white"] { ... }`
  - `html[data-theme="amoled"] { ... }`

Important:
- Update any hard-coded “white opacity” rules in `globals.css` (selection, focus ring, scrollbars) to use variables so they adapt cleanly across light/dark themes.

### 4) Floating Theme Picker

Component: `ThemeFab` (client component)
- Visible on all pages.
- Tap toggles open a 4-option picker:
  - Warm white
  - Pure white
  - Matte black
  - AMOLED black
- Supports:
  - “Follow system” state (system mode) via a small toggle inside the picker.
  - If user selects a concrete theme, switch to manual mode.

Placement:
- Desktop: bottom-right
- Mobile/small devices:
  - bottom-right, safe-area aware:
    - `right: calc(16px + env(safe-area-inset-right))`
    - `bottom: calc(16px + env(safe-area-inset-bottom))`
- Keyboard avoidance:
  - Prefer `window.visualViewport` when available to detect occlusion and shift upward.
  - Fallback: do nothing (still usable) + allow manual close.

Accessibility:
- Button has aria-label “Theme”.
- Picker uses roving focus / simple tab order, Esc to close.
- `prefers-reduced-motion` reduces animation intensity and duration.

### 5) Extraordinary Transition System

We implement a transition overlay that animates independently of the app UI so it cannot interfere with functionality:
- A fixed, full-screen overlay element with `pointer-events: none` by default.
- Runs a three-phase animation sequence for every theme change:
  1) Morph + blur: subtle blur + slight scale on the whole page
  2) Glitch/noise: lightweight grain + RGB split shimmer
  3) Radial wipe: expanding circle reveal from the floating button’s center point

Mechanics:
- On theme selection, compute origin (FAB button center) from `getBoundingClientRect`.
- Mount overlay, set CSS variables for origin and new theme colors.
- Update `<html data-theme="...">` at a controlled point in the sequence so the wipe reveals the new theme.
- Remove overlay at end; restore crisp UI.

Reduced-motion:
- Skip multi-stage effects; do a simple opacity fade between themes.

Optional enhancement:
- If View Transitions API exists, it can be used to add additional polish, but must not be required.

### 6) Fix Navbar “Odd Appearance” On Load

Goal: avoid janky/odd nav appearance while page is loading.

Plan:
- Ensure the header does not visually “jump” between auth states (already mitigated via SSR initialUser).
- Make entrance intentional and consistent:
  - Use a short opacity/translate entrance for header content.
  - Avoid element reflow by ensuring typography spacing is stable.
- Ensure the theme is resolved on the server to prevent a flash that changes background/text colors after hydration (theme cookie strategy).

## Security / Safety Considerations

- No secret values stored in localStorage/cookies. Only theme mode and theme name.
- No changes to Supabase auth/session logic other than theme-related UI changes.
- Overlay is non-interactive (pointer-events none), so it won’t block clicks, forms, or navigation.
- Respect `prefers-reduced-motion` for accessibility.

## Performance Considerations

- CSS variables switching is cheap; avoid forcing layout thrash.
- Animations should use:
  - `transform` and `opacity` (GPU friendly)
  - minimal `backdrop-filter` usage (use sparingly and short)
- Provide a hard cap on transition duration (e.g., 600–900ms total) to keep app feeling snappy.

## Testing Strategy

- Unit tests (Vitest):
  - Theme resolution logic: system mapping, persistence.
  - ThemeFab open/close, selecting themes sets correct attributes.
  - Navbar remains stable (existing tests stay).
- Manual verification checklist:
  - No theme flash on hard refresh.
  - Switching themes does not break navigation/auth actions.
  - Mobile safe-area placement and keyboard overlap.
  - Reduced-motion behaves correctly.

## Acceptance Criteria

- Four modes implemented and selectable via a floating button.
- Default is follow system; system light maps to warm.
- Theme persists across refresh and does not flash wrong theme.
- Theme transition is multi-stage (morph/blur → glitch/noise → radial wipe) and looks impressive.
- Reduced-motion fallback is smooth and accessible.
- No regression in app features (search, auth, alerts, profile).
- Works across modern browsers and mobile devices without platform-specific code.

