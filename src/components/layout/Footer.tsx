"use client";

import Link from "next/link";
import { Plane } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Search Flights", href: "/search" },
    { label: "Fare Alerts", href: "/alerts" },
    { label: "API Documentation", href: "/api" },
    { label: "Status Page", href: "/status" },
  ],
  Routes: [
    { label: "Delhi → Mumbai", href: "/search?from=DEL&to=BOM" },
    { label: "Bangalore → Hyderabad", href: "/search?from=BLR&to=HYD" },
    { label: "Chennai → Delhi", href: "/search?from=MAA&to=DEL" },
    { label: "All Routes", href: "/routes" },
  ],
  Developers: [
    { label: "API Reference", href: "/api" },
    { label: "SDKs", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "Get API Key", href: "/profile" },
  ],
};

export function Footer() {
  return (
    <footer className="relative z-10" role="contentinfo">
      {/* Luminous divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--aurora-gold)]/40 to-transparent" />

      <div className="container-app py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <Plane className="w-4 h-4 text-[var(--aurora-gold)] group-hover:rotate-12 transition-transform" />
              <span className="text-[15px] font-semibold tracking-tight font-[family-name:var(--font-display)]">
                Air<span className="text-[var(--aurora-gold)]">Book</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[220px] mb-6">
              The sky is not the limit.
              <br />
              It&apos;s the beginning.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--aurora-gold)] transition-all"
                aria-label="GitHub"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--aurora-gold)] transition-all"
                aria-label="Twitter"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--aurora-gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[var(--border-muted)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} AirBook. All flight data sourced from real Indian aviation networks.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
            <Link href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
