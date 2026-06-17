"use client";

import { ReactNode } from "react";

/**
 * Pass-through provider. Lenis smooth-scroll was disabled because its
 * continuous requestAnimationFrame loop (running every frame, even
 * when idle) compounded with the body / backdrop-blur paint cost and
 * made scrolling feel laggy on macOS — where native momentum scroll
 * is already excellent. Re-enable by restoring the Lenis init inside
 * a `useEffect` here if the trade-off ever flips.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
