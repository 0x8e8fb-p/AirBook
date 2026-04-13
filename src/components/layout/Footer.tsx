"use client";

import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Search Flights", href: "/search" },
    { label: "Fare Alerts", href: "/alerts" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-muted)]" role="contentinfo">
      <div className="container-app py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-sm font-semibold">AirBook</span>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed max-w-[180px]">
              Find the cheapest flights. Track prices.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-muted)] flex items-center justify-between">
          <p className="text-[11px] text-[var(--text-muted)]">© {new Date().getFullYear()} AirBook</p>
          <p className="text-[11px] text-[var(--text-muted)]">Made in India <span className="text-red-500">❤️</span></p>
        </div>
      </div>
    </footer>
  );
}
