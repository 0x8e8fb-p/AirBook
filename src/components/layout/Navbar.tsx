"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plane, Menu, X, User as UserIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/alerts", label: "Alerts" },
];

export function Navbar({ initialUser }: { initialUser?: User | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser ?? null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={false}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[var(--bg-base)]/90 backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <nav className="container-app flex items-center justify-between h-14" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2 group" aria-label="AirBook Home">
            <Plane className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
            <span className="text-[15px] font-semibold tracking-tight">AirBook</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  className={cn(
                    "relative px-3.5 py-1.5 text-[13px] font-medium rounded-[var(--radius-md)] transition-colors",
                    active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-[var(--accent-primary-dim)] rounded-[var(--radius-md)]"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
               <Link
                href="/profile"
                prefetch
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
            ) : (
              <Link
                href="/auth/login"
                prefetch
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium bg-[var(--accent-cta)] text-[var(--text-inverse)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)]"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </motion.header>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-[var(--bg-base)] md:hidden"
        >
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-2xl font-semibold transition-colors",
                  pathname === link.href ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/profile"
                prefetch
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-2xl font-semibold transition-colors flex flex-col items-center gap-2 mt-4",
                  pathname === "/profile" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}
              >
                <UserIcon className="w-6 h-6" />
                Profile
              </Link>
            ) : (
               <Link
                href="/auth/login"
                prefetch
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-2xl font-semibold transition-colors mt-4",
                  pathname === "/auth/login" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
