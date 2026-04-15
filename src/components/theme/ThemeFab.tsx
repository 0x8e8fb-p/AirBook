"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SunMedium, Moon } from "lucide-react";
import { ThemeTransitionOverlay } from "./ThemeTransitionOverlay";
import { useThemeController } from "./useThemeController";

type Item = {
  id: "warm" | "matte";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: Item[] = [
  { id: "warm", label: "Warm white", icon: SunMedium },
  { id: "matte", label: "Matte black", icon: Moon },
];

function getCenter(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function ThemeFab() {
  const { mode, theme, phase, origin, toTheme, setManualTheme, setSystemMode } =
    useThemeController();
  const [open, setOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const posStyle = useMemo(() => {
    return {
      right: "calc(16px + env(safe-area-inset-right))",
      bottom: `calc(${16 + keyboardOffset}px + env(safe-area-inset-bottom))`,
    } as const;
  }, [keyboardOffset]);

  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;

    const update = () => {
      const delta = window.innerHeight - vv.height;
      setKeyboardOffset(delta > 120 ? Math.round(delta) : 0);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
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
      <ThemeTransitionOverlay
        phase={phase}
        origin={origin}
        toTheme={toTheme}
        enabled
      />

      <div className="fixed z-[80]" style={posStyle}>
        {open && (
          <div className="mb-3 w-[220px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] overflow-hidden">
            <div className="p-2">
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--accent-primary-dim)] transition-colors text-[13px]"
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--accent-primary-dim)] transition-colors text-[13px]"
                  onClick={async () => {
                    const el = btnRef.current;
                    if (!el) return;
                    await setManualTheme(it.id, getCenter(el));
                    setOpen(false);
                  }}
                >
                  <it.icon className="w-4 h-4 opacity-80" />
                  <span className="flex-1">{it.label}</span>
                  {mode === "manual" && theme === it.id ? (
                    <span className="text-[11px] opacity-70">Active</span>
                  ) : null}
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
