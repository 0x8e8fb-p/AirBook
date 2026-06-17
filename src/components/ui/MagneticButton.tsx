"use client";

import { useRef, useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const SPRING = { stiffness: 220, damping: 18, mass: 0.6 } as const;

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  onClick,
  disabled,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  // Inner content tracks slightly less for a layered parallax feel.
  const ix = useTransform(sx, (v) => v * 0.55);
  const iy = useTransform(sy, (v) => v * 0.55);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (isTouch || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * strength);
      y.set((e.clientY - rect.top - rect.height / 2) * strength);
    },
    [isTouch, strength, x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => setIsTouch(true)}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative will-change-transform disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
    >
      <motion.span
        style={{ x: ix, y: iy }}
        className="relative inline-flex items-center justify-center pointer-events-none"
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

