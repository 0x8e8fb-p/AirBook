"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plane, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/app/actions/authActions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const hasVerificationParams = Boolean(token && email);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    hasVerificationParams ? "loading" : "error",
  );
  const [errorMsg, setErrorMsg] = useState(hasVerificationParams ? "" : "Invalid verification link.");

  useEffect(() => {
    if (!token || !email) return;

    const verify = async () => {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("email", email);

      const res = await verifyEmail(formData);
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(res.error || "Failed to verify email.");
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="flex flex-col items-center text-center">
      <Link href="/" className="flex items-center gap-2 mb-6">
        <Plane className="w-6 h-6 text-[var(--accent-cta)]" />
        <span className="text-xl font-bold">TheWingsScan</span>
      </Link>

      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-cta)] mb-4" />
          <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
          <p className="text-[var(--text-secondary)]">Please wait while we confirm your account.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-[var(--accent-green)]/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[var(--accent-green)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Your account has been successfully verified. You can now sign in.
          </p>
          <Link
            href="/login"
            className="px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-[var(--accent-red)]/10 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-[var(--accent-red)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
          <p className="text-[var(--text-secondary)] mb-6">{errorMsg}</p>
          <Link
            href="/login"
            className="text-[var(--accent-cta)] font-semibold hover:underline"
          >
            Return to Login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-subtle)] relative overflow-hidden pt-14">
      <div className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8 shadow-2xl relative z-10">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--accent-cta)]" />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
