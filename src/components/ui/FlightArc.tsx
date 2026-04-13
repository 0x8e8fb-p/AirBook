"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function FlightArc({ 
  width = 300, 
  height = 100, 
  className = "" 
}: { 
  width?: number;
  height?: number;
  className?: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      
      // Initial CSS state for stroke-dasharray/offset
      gsap.set(pathRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length
      });

      // Animate stroke
      gsap.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        repeatDelay: 1,
        yoyo: true
      });
    }
  }, []);

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        ref={pathRef}
        d={`M 10,${height - 10} Q ${width/2},${-(height/2)} ${width - 10},${height - 10}`}
        stroke="url(#gradient-arc)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ willChange: "stroke-dashoffset" }}
      />
      <circle cx={10} cy={height - 10} r="4" fill="var(--color-accent-amber)" />
      <circle cx={width - 10} cy={height - 10} r="4" fill="var(--color-accent-blue)" />
      
      <defs>
        <linearGradient id="gradient-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-accent-cyan)" stopOpacity="0.2" />
          <stop offset="50%" stopColor="var(--color-accent-cyan)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-accent-violet)" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
