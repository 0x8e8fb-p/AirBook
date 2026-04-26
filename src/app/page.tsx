"use client";

import { useEffect } from "react";
import { HeroSection } from "@/components/sections/Hero";
import { DealsStrip } from "@/components/sections/DealsStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FeaturedRoutes } from "@/components/sections/FeaturedRoutes";
import { PriceIntelligence } from "@/components/sections/PriceIntelligence";
import { PopularAirlines } from "@/components/sections/PopularAirlines";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/layout/Footer";
import { registerGSAP, initHeroAnimations, initScrollAnimations, initNavScroll, initCounters } from "@/lib/animations";

export default function HomePage() {
  useEffect(() => {
    // Small delay to let three.js render first
    const timer = setTimeout(() => {
      registerGSAP();
      initHeroAnimations();
      initScrollAnimations();
      initNavScroll();
      initCounters();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] relative">
      <HeroSection />

      <div className="relative z-10 bg-[var(--void)]">
        {/* Subtle top glow for first section */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[var(--aurora-gold)]/30 to-transparent" />

        <DealsStrip />
        <HowItWorks />
        <FeaturedRoutes />
        <PriceIntelligence />
        <PopularAirlines />
        <Testimonials />
        <Footer />
      </div>
    </div>
  );
}
