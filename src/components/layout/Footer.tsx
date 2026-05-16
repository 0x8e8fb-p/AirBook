"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Globe2, ShieldCheck, Sparkles } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { label: "Search Flights", href: "/search" },
    { label: "Fare Alerts", href: "/alerts" },
    { label: "Price Intelligence", href: "/intelligence" },
  ],
  Explore: [
    { label: "Route Compare", href: "/compare" },
    { label: "Deals", href: "/deals" },
    { label: "Status", href: "/status" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "Register", href: "/register" },
    { label: "Profile & Wallet", href: "/profile" },
  ],
};

export function Footer() {
  return (
    <footer className="relative z-10 mt-12 border-t border-[var(--border-muted)] bg-transparent" role="contentinfo">
      <div className="container-app py-12 md:py-16">
        <div className="surface-panel rounded-[32px] p-6 md:p-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <div>
              <div className="section-kicker mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Production-ready flight discovery
              </div>
              <h2 className="max-w-2xl text-2xl md:text-4xl font-semibold font-[var(--font-display)] leading-tight">
                Better search surfaces, clearer savings, and a calmer path from discovery to booking.
              </h2>
              <p className="max-w-2xl text-sm md:text-base text-[var(--text-secondary)] mt-4 leading-relaxed">
                TheWingsScan is built for fast route discovery, effective-price comparison, and clean booking handoffs backed by server-side fare intelligence.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: "Secure handoff", text: "Server-side booking links and guarded data flows." },
                  { icon: BellRing, title: "Track prices", text: "Save alerts and monitor routes without noise." },
                  { icon: Globe2, title: "Explore faster", text: "Compare airlines, dates, and route signals in one place." },
                ].map((item) => (
                  <div key={item.title} className="surface-card rounded-[22px] p-4">
                    <item.icon className="w-4 h-4 text-[var(--accent-cta)] mb-3" />
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-8">
              {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                <div key={title}>
                  <h4 className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">{title}</h4>
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
                          <span>{link.label}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="glow-divider my-8" />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold font-[var(--font-display)]">TheWingsScan</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">© {new Date().getFullYear()} TheWingsScan. Designed for cleaner flight discovery.</p>
            </div>
            <p className="max-w-xl text-[11px] leading-relaxed text-[var(--text-muted)] md:text-right">
              Pricing insights and offer surfaces are informational. Final availability, baggage, and fare rules are confirmed on the booking partner page.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
