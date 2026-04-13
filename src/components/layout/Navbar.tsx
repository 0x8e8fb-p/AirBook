"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plane, Bell, Search, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/alerts", label: "Alerts" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-default)] shadow-[var(--shadow-sm)]"
            : "bg-transparent"
        )}
      >
        <nav className="container-app flex items-center justify-between h-16" aria-label="Main navigation">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="AirBook Home">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
              <Plane className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-display)]">
              AirBook
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-[var(--radius-full)] transition-colors",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-white/5 rounded-[var(--radius-full)] border border-[var(--border-default)]"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/alerts"
              className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              aria-label="Fare Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--accent-amber)] text-[var(--text-inverse)] rounded-[var(--radius-full)] hover:brightness-110 transition-all shadow-[var(--shadow-sm)]"
            >
              <Search className="w-3.5 h-3.5" />
              Find Deals
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-white/5"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[var(--bg-base)]/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col items-center justify-center h-full gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-2xl font-bold transition-colors",
                  pathname === link.href
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center gap-2 px-8 py-3 text-lg font-semibold bg-[var(--accent-amber)] text-[var(--text-inverse)] rounded-[var(--radius-full)]"
            >
              <Search className="w-5 h-5" />
              Find Deals
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
}
