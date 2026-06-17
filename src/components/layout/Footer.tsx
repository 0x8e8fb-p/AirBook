"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BellRing, Plane, Radar, ShieldCheck } from "lucide-react";

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

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Search fares",
    text: "Search routes and dates in one place before you continue to booking.",
  },
  {
    icon: BellRing,
    title: "Track prices",
    text: "Save alerts and return when the route matches your target fare.",
  },
  {
    icon: Radar,
    title: "Check status",
    text: "Look up departure and arrival updates quickly on any device.",
  },
];

export function Footer() {
  return (
    <footer
      className="relative z-10 mt-12 border-t border-[var(--border-muted)] bg-transparent"
      role="contentinfo"
    >
      <div className="container-app py-12 md:py-16">
        <div className="surface-hero overflow-hidden rounded-[32px] p-6 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <div>
              <div className="section-kicker mb-4">
                <Plane className="h-3 w-3" aria-hidden="true" />
                TheWingScan
              </div>
              <h2 className="max-w-2xl text-balance font-[var(--font-display)] text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
                Search flights, track fares,
                <br className="hidden md:block" /> and check status.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Use TheWingScan to search routes, create alerts, and manage your trip tools in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="gloss-sweep ring-cinematic group inline-flex items-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] shadow-[var(--depth-soft)] transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:scale-[1.03] hover:shadow-[var(--depth-elevated)] active:scale-[0.97]"
                >
                  Start a search
                  <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/alerts"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Create alert
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {PILLARS.map((item) => (
                  <div
                    key={item.title}
                    className="surface-card hover-lift gradient-border-kiss group relative overflow-hidden rounded-[22px] p-4"
                  >
                    <div className="relative z-10">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] text-[var(--accent-cta)] transition-colors group-hover:border-[color-mix(in_srgb,var(--accent-cta)_36%,transparent)]">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-1">
              {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                <div key={title}>
                  <h4 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                    {title}
                  </h4>
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                        >
                          <span className="relative">
                            {link.label}
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-0 -bottom-0.5 h-px scale-x-0 origin-left bg-gradient-to-r from-[var(--accent-cta)] to-transparent transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:scale-x-100"
                            />
                          </span>
                          <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:translate-x-0 group-hover:opacity-100" />
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
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)]">
                <Plane className="h-3.5 w-3.5 text-[var(--text-primary)]" />
              </span>
              <div>
                <p className="font-[var(--font-display)] text-sm font-semibold">TheWingScan</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  © {new Date().getFullYear()} TheWingScan · Aviation intelligence for India
                </p>
              </div>
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

