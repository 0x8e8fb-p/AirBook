"use client";

import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name?.split(" ")[0] || "Profile";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-[60] border-b backdrop-blur-md transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]",
          scrolled
            ? "h-[58px] border-[var(--border-default)]/90 bg-[var(--bg-base)]/92 shadow-[var(--depth-soft)]"
            : "h-16 border-[var(--border-default)]/60 bg-[var(--bg-base)]/82",
        )}
      >
        <nav
          className="container-app flex h-full items-center justify-between gap-3"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="TheWingScan Home"
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-spring)] group-hover:scale-[1.06]">
              <span
                aria-hidden="true"
                className="absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-slow)] group-hover:opacity-100"
                style={{ background: "var(--gradient-aurora)" }}
              />
              <Plane className="relative z-10 h-4 w-4 text-[var(--text-primary)] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-spring)] group-hover:-rotate-[18deg]" />
            </span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap font-[var(--font-display)] text-[13px] font-semibold leading-none tracking-[-0.01em] sm:text-[14px]">
                TheWingScan
              </span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)] sm:block">
                Aviation Intelligence
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_74%,transparent)] px-1.5 py-1 shadow-[var(--shadow-sm)] md:flex">
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
                    "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {link.icon ? (
                    <link.icon className="relative z-10 h-3 w-3 opacity-70" aria-hidden="true" />
                  ) : null}
                  <span className="relative z-10">{link.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-base)_70%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,white_8%,transparent)]"
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="hidden items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] lg:inline-flex">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">K</kbd>
            </span>
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              Search
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_78%,transparent)] px-2 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-primary-dim)] text-[10px] font-semibold text-[var(--text-primary)]">
                      {displayName.slice(0, 1)}
                    </span>
                  )}
                  {displayName}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="gloss-sweep ring-cinematic flex items-center gap-1.5 rounded-full bg-[var(--accent-cta)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--text-inverse)] shadow-[var(--depth-soft)] transition-[transform,box-shadow,filter] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:scale-[1.03] hover:shadow-[var(--depth-elevated)] hover:brightness-[1.05] active:scale-[0.97]"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-elevated)_76%,transparent)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent-cta)_42%,transparent)] to-transparent transition-opacity duration-[var(--duration-slow)]",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        />
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[55] bg-[var(--bg-base)]/96 pt-16 backdrop-blur-2xl md:hidden"
          >
            <div className="container-app flex h-[calc(100vh-4rem)] flex-col justify-between py-8 pb-10">
              <div className="surface-panel mb-8 rounded-[28px] p-4">
                <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Navigate
                </div>
                <div className="flex flex-col gap-2">
                  {NAV_LINKS.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.32,
                        delay: 0.05 + index * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
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
                        {link.icon ? (
                          <link.icon className="h-4 w-4 text-[var(--text-muted)]" />
                        ) : null}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="gloss-sweep mb-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] shadow-[var(--depth-soft)] transition-opacity hover:opacity-95"
              >
                Start a new search
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              {user ? (
                <div className="surface-panel flex flex-col gap-5 rounded-[28px] p-5">
                  <div className="flex items-center gap-3 text-lg font-semibold text-[var(--text-primary)] transition-colors">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-primary-dim)] text-sm font-semibold text-[var(--text-primary)]">
                        {displayName.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <div>{displayName}</div>
                      <div className="text-sm font-normal text-[var(--text-muted)]">
                        Manage alerts and saved cards
                      </div>
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
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="gloss-sweep rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-95"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="surface-panel flex flex-col gap-4 rounded-[28px] p-5">
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      Sign in for alerts and wallet pricing
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Keep your cards synced, save route alerts, and continue with your preferred fare setup.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="gloss-sweep inline-flex items-center justify-center rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              <div className="px-2 text-xs text-[var(--text-muted)]">
                Search flights, save alerts, and check status.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

