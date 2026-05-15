"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plane, Loader2, CheckCircle2 } from "lucide-react";
import { updatePassword } from "@/app/actions/authActions";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
        <p className="text-[var(--text-secondary)] mb-6">This password reset link is missing required information or is invalid.</p>
        <Link href="/login" className="text-[var(--accent-cta)] font-semibold hover:underline">
          Return to Login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("token", token);
    formData.append("email", email);
    formData.append("password", password);

    const res = await updatePassword(formData);

    if (!res.success) {
      setError(res.error || "Failed to reset password");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  if (success) {
    return (
      <div className="text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-[var(--accent-green)]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Password Reset Successful</h2>
        <p className="text-[var(--text-secondary)] mb-6">Your password has been successfully updated.</p>
        <p className="text-sm text-[var(--text-muted)]">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <Plane className="w-6 h-6 text-[var(--accent-cta)]" />
          <span className="text-xl font-bold">TheWingsScan</span>
        </Link>
        <h1 className="text-2xl font-bold text-center">Create new password</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">
          Please enter your new password below.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">New Password</label>
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
        
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 mt-6"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-subtle)] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-cta)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8 shadow-2xl relative z-10">
        <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cta)]" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}