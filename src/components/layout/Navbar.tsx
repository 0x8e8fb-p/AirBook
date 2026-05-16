"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Menu, Plane, X, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/compare", label: "Compare" },
  { href: "/deals", label: "Deals" },
  { href: "/status", label: "Tracker" },
  { href: "/alerts", label: "Alerts" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name?.split(" ")[0] || "Profile";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] border-b border-[var(--border-default)]/80 bg-[var(--bg-base)]/80 backdrop-blur-2xl">
        <nav className="container-app flex items-center justify-between h-14 gap-3" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0" aria-label="TheWingsScan Home">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] shadow-[var(--shadow-sm)]">
              <Plane className="w-4 h-4 text-[var(--text-primary)] group-hover:-rotate-12 transition-transform duration-300" />
            </div>
            <div className="min-w-0">
              <span className="block text-[14px] font-semibold font-[var(--font-display)] leading-none">TheWingsScan</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)] mt-1">Flight intelligence</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_74%,transparent)] px-1.5 py-1 shadow-[var(--shadow-sm)]">
            {NAV_LINKS.map((link) => {
              const active = pathname === (link.href.split('?')[0]);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors",
                    active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="relative z-10">{link.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-base)_70%,transparent)]"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              New Search
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link 
                  href="/profile"
                  className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_78%,transparent)] px-2 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                >
                  {user.image ? (
                    <Image src={user.image} alt={user.name || "User"} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-primary-dim)] text-[10px] font-semibold text-[var(--text-primary)]">
                      {displayName.slice(0, 1)}
                    </span>
                  )}
                  {displayName}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium bg-[var(--accent-cta)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity shadow-[var(--shadow-sm)]"
              >
                Sign In
              </Link>
            )}
          </div>
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_76%,transparent)] text-[var(--text-secondary)]"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[55] bg-[var(--bg-base)]/96 backdrop-blur-2xl md:hidden pt-14"
          >
          <div className="container-app flex flex-col justify-between h-[calc(100vh-3.5rem)] py-8 pb-10">
            <div className="surface-panel rounded-[28px] p-4 mb-8">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-3">Navigate</div>
              <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-[var(--radius-lg)] px-4 py-3 text-lg font-semibold transition-colors border",
                    pathname === (link.href.split('?')[0])
                      ? "text-[var(--text-primary)] border-[var(--border-strong)] bg-[var(--accent-primary-dim)]"
                      : "text-[var(--text-muted)] border-transparent hover:border-[var(--border-default)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              </div>
            </div>

            {user ? (
              <div className="surface-panel rounded-[28px] p-5 flex flex-col gap-5">
                <div className="text-lg font-semibold transition-colors flex items-center gap-3 text-[var(--text-primary)]">
                  {user.image ? (
                    <Image src={user.image} alt={user.name || "User"} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-primary-dim)] text-sm font-semibold text-[var(--text-primary)]">
                      {displayName.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <div>{displayName}</div>
                    <div className="text-sm font-normal text-[var(--text-muted)]">Manage your alerts and saved cards</div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Go to Profile
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className="rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="surface-panel rounded-[28px] p-5 flex flex-col gap-4">
                <div>
                  <div className="text-lg font-semibold text-[var(--text-primary)]">Sign in for alerts and wallet pricing</div>
                  <p className="text-sm text-[var(--text-muted)] mt-2">Keep your cards synced, save price alerts, and continue securely at checkout.</p>
                </div>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                >
                  Sign In
                </Link>
              </div>
            )}

            <div className="px-2 text-xs text-[var(--text-muted)]">Server-side fare intelligence, better date flexibility, and secure booking handoffs.</div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
