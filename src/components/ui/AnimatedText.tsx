"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function AnimatedText({
  text,
  className = "",
  staggerDelay = 0.08
}: {
  text: string;
  className?: string;
  staggerDelay?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    // We get all the word elements child of this container
    const words = containerRef.current?.querySelectorAll(".word-wrap");
    
    if (words && words.length > 0) {
      gsap.fromTo(words, 
        { 
          opacity: 0,
          y: 60,
          filter: "blur(10px)"
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
          stagger: staggerDelay,
          // Remove transform willChange optimization after completion
          onComplete: () => {
             gsap.set(words, { clearProps: "filter,willChange" });
          }
        }
      );
    }
  }, [text, staggerDelay]);

  // Fallback split logic
  const words = text.split(" ");

  return (
    <div ref={containerRef} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] pb-[0.1em]">
          <span className="word-wrap inline-block" style={{ willChange: "transform, filter, opacity" }}>
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}
