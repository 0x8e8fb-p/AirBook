"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  /** Override the marquee duration (e.g. "24s"). Defaults to `--duration-marquee`. */
  duration?: string;
  /** Reverse direction. */
  reverse?: boolean;
  /** Disable hover-pause. */
  noPause?: boolean;
  /** Fade edges horizontally (recommended). */
  fade?: boolean;
  className?: string;
}

/**
 * Infinite horizontal marquee. Renders children twice for a seamless loop
 * and animates the track via the `marquee-scroll` keyframe in globals.css.
 *
 * Respects `prefers-reduced-motion` (animation suppressed via the
 * existing reduced-motion media query in globals.css).
 */
export function Marquee({
  children,
  duration,
  reverse = false,
  noPause = false,
  fade = true,
  className,
}: MarqueeProps) {
  const items = Children.toArray(children);
  // Duplicate the items once so the -50% translate produces a seamless loop.
  const doubled: ReactNode[] = [
    ...items,
    ...items.map((child, index) =>
      isValidElement(child)
        ? cloneElement(child, { key: `dup-${index}` })
        : <span key={`dup-${index}`}>{child}</span>,
    ),
  ];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        fade && "marquee-fade",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="marquee-track"
        style={{
          animationDuration: duration,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: noPause ? "running" : undefined,
        }}
      >
        {doubled}
      </div>
    </div>
  );
}
