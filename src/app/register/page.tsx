"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plane, Loader2 } from "lucide-react";
import { registerUser } from "@/app/actions/authActions";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-detect country code based on IP
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      })
      .catch(err => console.log('Could not detect country code'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("mobile", `${countryCode}${mobile}`);
    formData.append("password", password);

    const res = await registerUser(formData);

    if (!res.success) {
      setError(res.error || "Failed to register");
      setLoading(false);
    } else {
      setSuccessMsg(res.message || "Registration successful! Please check your email to verify your account.");
      setLoading(false);
      // We no longer auto-login here, the user must verify their email first.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-subtle)] relative overflow-hidden pt-14">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-cta)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Plane className="w-6 h-6 text-[var(--accent-cta)]" />
            <span className="text-xl font-bold tracking-tight">AirBook</span>
          </Link>
          <h1 className="text-2xl font-bold text-center">Create an account</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">
            Join AirBook to save your credit cards and track flight prices.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm text-center">
            {error}
          </div>
        )}

        {successMsg ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] text-sm">
              {successMsg}
            </div>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-[var(--accent-cta)] mt-2 p-2 bg-[var(--accent-cta)]/10 rounded">
                <strong>Developer Note:</strong> If no Resend API key is set on the server, the verification link is logged to the server terminal.
              </p>
            )}
            <Link href="/login" className="inline-block mt-4 py-2 px-4 bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Unique Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                placeholder="johndoe123"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Mobile Number</label>
              <div className="flex gap-2">
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
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                  placeholder="9876543210"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent-cta)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}