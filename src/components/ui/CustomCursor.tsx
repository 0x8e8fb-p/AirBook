"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  
  const springX = useSpring(0, { stiffness: 400, damping: 28 });
  const springY = useSpring(0, { stiffness: 400, damping: 28 });

  useEffect(() => {
    // Hide cursor on mobile/touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Direct update for the small dot (no lag)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Spring update for trailing circle
      springX.set(e.clientX - 16); // 16 is half the width of the follower (32px)
      springY.set(e.clientY - 16);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [springX, springY]);

  return (
    <div className="hidden [@media(pointer:fine)]:block">
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-[var(--text-primary)] rounded-full -ml-[3px] -mt-[3px] pointer-events-none z-[9999] opacity-80"
      />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[var(--text-primary)]/25 pointer-events-none z-[9998]"
        style={{
          x: springX,
          y: springY,
        }}
      />
    </div>
  );
}
