"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Only initialize if not reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth custom easing
      orientation: "vertical",
      gestureOrientation: "vertical",
      allowNestedScroll: true,
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    (window as unknown as { __thewingsscanLenis?: Lenis }).__thewingsscanLenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      delete (window as unknown as { __thewingsscanLenis?: Lenis }).__thewingsscanLenis;
    };
  }, []);

  return <>{children}</>;
}
