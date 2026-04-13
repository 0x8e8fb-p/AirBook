"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

export function MagneticButton({
  children,
  className = "",
  onClick,
  disabled
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Magnetic pull effect disabled upon user request
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Shockwave click effect
    const ripple = document.createElement("div");
    ripple.className = "absolute bg-white/20 rounded-full scale-0 pointer-events-none";
    const size = Math.max(buttonRef.current?.offsetWidth || 0, buttonRef.current?.offsetHeight || 0) * 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    }
    
    buttonRef.current?.appendChild(ripple);
    
    gsap.to(ripple, {
      scale: 3,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });

    if (onClick) onClick(e);
  };

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden group ${className}`}
      onClick={handleClick}
      disabled={disabled}
      style={{ willChange: "transform" }}
    >
      <div 
        ref={glowRef}
        className="absolute w-24 h-24 bg-white/20 rounded-full blur-xl -z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 left-1/2 top-1/2 -mt-12 -ml-12"
      />
      {children}
    </button>
  );
}
