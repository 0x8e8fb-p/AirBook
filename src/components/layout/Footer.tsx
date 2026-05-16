"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Radar, ShieldCheck, Sparkles } from "lucide-react";

const FOOTER_LINKS = {
  Plan: [
    { label: "Start a Search", href: "/" },
    { label: "Fare Alerts", href: "/alerts" },
    { label: "Flight Tracker", href: "/status" },
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
              <div className="section-kicker mb-4">TheWingScan</div>
              <h2 className="max-w-2xl text-2xl md:text-4xl font-semibold font-[var(--font-display)] leading-tight">
                Search flights, track fares, and check status.
              </h2>
              <p className="max-w-2xl text-sm md:text-base text-[var(--text-secondary)] mt-4 leading-relaxed">
                Use TheWingScan to search routes, create alerts, and manage your trip tools in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                >
                  Start a search
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/alerts"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Create alert
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: "Search fares", text: "Search routes and dates in one place before you continue to booking." },
                  { icon: BellRing, title: "Track prices", text: "Save alerts and return when the route matches your target fare." },
                  { icon: Radar, title: "Check status", text: "Look up departure and arrival updates quickly on any device." },
                ].map((item) => (
                  <div key={item.title} className="surface-card rounded-[22px] p-4">
                    <item.icon className="w-4 h-4 text-[var(--accent-cta)] mb-3" />
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-1">
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
              <p className="text-sm font-semibold font-[var(--font-display)]">TheWingScan</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">© {new Date().getFullYear()} TheWingScan.</p>
            </div>
            <p className="max-w-xl text-[11px] leading-relaxed text-[var(--text-muted)] md:text-right">
              Availability, baggage, and refund rules are confirmed on the final booking page before payment is completed.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
