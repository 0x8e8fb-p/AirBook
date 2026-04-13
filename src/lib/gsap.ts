"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register core plugins globally
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  
  // Set default ease for velocity aesthetics
  gsap.defaults({
    ease: "power3.out"
  });
}

export { gsap, ScrollTrigger, useGSAP };
