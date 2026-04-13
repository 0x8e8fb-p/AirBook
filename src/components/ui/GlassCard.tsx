"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

export function GlassCard({
  children,
  className = "",
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    const card = cardRef.current;
    if (!card) return;
    
    // Convert mouse movement to 3D tilt rotation
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Max tilt degrees
      const maxDegree = 7;
      const rotateX = (-(y / (rect.height / 2))) * maxDegree;
      const rotateY = (x / (rect.width / 2)) * maxDegree;
      
      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.5,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)"
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        relative backdrop-blur-2xl bg-white/[0.03] 
        border border-white/10 rounded-2xl 
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        transition-colors duration-500
        hover:border-[var(--color-accent-cyan)]/30
        hover:bg-white/[0.05]
        hover:shadow-[0_0_40px_rgba(0,229,255,0.08)]
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      style={{ willChange: "transform" }}
    >
      {/* Subtle top inner highlight */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] pointer-events-none" />
      {children}
    </div>
  );
}
