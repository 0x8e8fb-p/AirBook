"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plane, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => urlError ? `Authentication error: ${urlError}` : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");

  useEffect(() => {
    // Auto-detect country code based on IP
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      })
      .catch(() => console.log('Could not detect country code'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // If input looks like a phone number (just digits), prepend the country code
    const isMobile = /^\d{10}$/.test(email.trim());
    const finalEmail = isMobile ? `${countryCode}${email.trim()}` : email.trim();

    const res = await signIn("credentials", {
      redirect: false,
      email: finalEmail,
      password,
    });

    if (res?.error) {
      setError(res.error || "Invalid credentials");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-subtle)] relative overflow-hidden pt-14">
      <div className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Plane className="w-6 h-6 text-[var(--accent-cta)]" />
            <span className="text-xl font-bold">TheWingsScan</span>
          </Link>
          <h1 className="text-2xl font-bold text-center">Welcome back</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">
            Sign in to access your saved credit cards, price alerts, and search history.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Email or Mobile Number</label>
          <div className="flex gap-2">
            {/^\d+$/.test(email) || email === "" ? (
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[100px] px-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors text-sm appearance-none"
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
            ) : null}
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
              placeholder="you@example.com or 9876543210"
            />
          </div>
        </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-default)]" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--bg-base)] px-2 text-[var(--text-muted)] font-semibold">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold rounded-[var(--radius-md)] hover:bg-[var(--accent-primary-dim)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Google
        </button>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
          Do not have an account?{" "}
          <Link href="/register" className="text-[var(--accent-cta)] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cta)]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
