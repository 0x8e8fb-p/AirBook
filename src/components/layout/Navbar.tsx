"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plane, Menu, X, User as UserIcon, LogIn, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Alerts" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { data: session, status } = useSession();
  const user = session?.user;

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
            {status === "loading" ? (
              <div className="w-16 h-8 animate-pulse bg-[var(--bg-subtle)] rounded-[var(--radius-md)]" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                  {user.image ? (
                    <img src={user.image} alt={user.name || "User"} className="w-5 h-5 rounded-full" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                  {user.name?.split(' ')[0] || 'Profile'}
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium bg-[var(--accent-cta)] text-[var(--text-inverse)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[var(--bg-base)] md:hidden pt-14"
        >
          <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-8 pb-10">
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
            
            {status === "loading" ? null : user ? (
              <>
                <div className="text-2xl font-semibold transition-colors flex flex-col items-center gap-2 mt-4 text-[var(--text-primary)]">
                  {user.image ? (
                    <img src={user.image} alt={user.name || "User"} className="w-8 h-8 rounded-full" />
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                  {user.name}
                </div>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className="text-xl font-semibold text-[var(--accent-red)] transition-colors mt-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
               <button
                onClick={() => { setMobileOpen(false); signIn('google'); }}
                className={cn(
                  "text-2xl font-semibold transition-colors mt-4 text-[var(--text-muted)]"
                )}
              >
                Sign In
              </button>
            )}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}