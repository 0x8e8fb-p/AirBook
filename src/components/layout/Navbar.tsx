"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Bell, LogOut, Menu, Plane, Radar, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/status", label: "Tracker", icon: Radar },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name?.split(" ")[0] || "Profile";

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[60] border-b border-[var(--border-default)]/80 bg-[var(--bg-base)]/82 backdrop-blur-2xl">
        <nav className="container-app flex h-16 items-center justify-between gap-3" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0" aria-label="TheWingScan Home">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] shadow-[var(--shadow-sm)]">
              <Plane className="w-4 h-4 text-[var(--text-primary)] group-hover:-rotate-12 transition-transform duration-300" />
            </div>
            <div className="min-w-0">
              <span className="block whitespace-nowrap text-[13px] font-semibold font-[var(--font-display)] leading-none sm:text-[14px]">TheWingScan</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_74%,transparent)] px-1.5 py-1 shadow-[var(--shadow-sm)]">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href.split("?")[0];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors",
                    active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
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
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              Search
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
            aria-expanded={mobileOpen}
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
            className="fixed inset-0 z-[55] bg-[var(--bg-base)]/96 pt-16 backdrop-blur-2xl md:hidden"
          >
          <div className="container-app flex h-[calc(100vh-4rem)] flex-col justify-between py-8 pb-10">
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
                    "flex items-center justify-between rounded-[var(--radius-lg)] border px-4 py-3 text-lg font-semibold transition-colors",
                    pathname === link.href.split("?")[0]
                      ? "border-[var(--border-strong)] bg-[var(--accent-primary-dim)] text-[var(--text-primary)]"
                      : "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <span>{link.label}</span>
                  {link.icon ? <link.icon className="h-4 w-4 text-[var(--text-muted)]" /> : null}
                </Link>
              ))}
              </div>
            </div>

            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="mb-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90"
            >
              Start a new search
              <ArrowUpRight className="h-4 w-4" />
            </Link>

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
                    <div className="text-sm font-normal text-[var(--text-muted)]">Manage alerts and saved cards</div>
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
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Keep your cards synced, save route alerts, and continue with your preferred fare setup.</p>
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

            <div className="px-2 text-xs text-[var(--text-muted)]">Search flights, save alerts, and check status.</div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
