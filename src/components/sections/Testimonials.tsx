"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "I saved ₹4,200 on my Bangalore to Delhi flight. The price prediction was spot on — it told me to wait 3 days and the fare dropped exactly as predicted.",
    author: "Rahul Sharma",
    role: "Frequent Business Traveller",
    rating: 5,
    avatar: "RS",
  },
  {
    quote: "The bank offers integration is brilliant. I didn't even know my HDFC card had a 10% discount on domestic flights. AirBook found it automatically.",
    author: "Priya Menon",
    role: "Software Engineer",
    rating: 5,
    avatar: "PM",
  },
  {
    quote: "I've used every flight booking app in India. AirBook is the only one that actually shows you the true final price including all fees and offers upfront.",
    author: "Vikram Patel",
    role: "Travel Blogger",
    rating: 5,
    avatar: "VP",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const t = TESTIMONIALS[current];

  return (
    <section className="testimonials-section py-20 md:py-28 relative z-10">
      <div className="container-app">
        <div className="text-center mb-10">
          <span className="inline-block text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Testimonials
          </span>
          <h2 className="section-title text-3xl md:text-4xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Loved by Travellers
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-[var(--radius-xl)] p-8 md:p-12 text-center relative">
            <Quote className="w-8 h-8 text-[var(--aurora-gold)]/30 mx-auto mb-6" />

            <blockquote className="text-lg md:text-xl text-[var(--text-primary)] leading-relaxed mb-8 font-[family-name:var(--font-display)]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[var(--aurora-gold)] text-[var(--aurora-gold)]" />
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center text-sm font-bold text-[var(--aurora-gold)]">
                {t.avatar}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">{t.author}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{t.role}</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--aurora-gold)] transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === current
                        ? "w-6 bg-[var(--aurora-gold)]"
                        : "bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/50"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-8 h-8 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--aurora-gold)] transition-all"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
