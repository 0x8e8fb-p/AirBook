"use client";

import Link from "next/link";
import { Plane } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Search Flights", href: "/search" },
    { label: "Fare Alerts", href: "/alerts" },
    { label: "Price Calendar", href: "/calendar" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--border-default)]" role="contentinfo">
      {/* Glow separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

      <div className="container-app py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
                <Plane className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-base font-bold tracking-tight">AirBook</span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[200px]">
              Find the cheapest flights. Track prices. Never overpay.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-[var(--border-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} AirBook. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Made with precision in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
